import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { searchBookStack } from '@/lib/bookstack';

type RagSource = {
  title: string;
  source: string;
  score?: number;
  imageUrl?: string;
};

type RagContextResult = {
  provider: 'pinecone' | 'empty';
  context: string;
  sources: RagSource[];
  diagnostics: string[];
};

type PineconeMatch = {
  id?: string;
  score?: number;
  metadata?: Record<string, unknown> | null;
};

type QueryIntent = {
  raw: string;
  normalized: string;
  terms: Set<string>;
  identifierTerms: Set<string>;
  wantsImage: boolean;
  wantsProcedure: boolean;
};

const TURBODOCS_BASE_URL = 'http://turbodocs.netturbosolucoes.com.br';

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeImageUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${TURBODOCS_BASE_URL}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${TURBODOCS_BASE_URL}/${trimmed}`;
  return trimmed;
}

function extractImageUrlFromText(text: string) {
  if (!text) return '';

  const markdownImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const markdownLinkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s)'"<>]+|\/uploads\/[^\s)'"<>]+|uploads\/[^\s)'"<>]+)/g;

  const candidates = [markdownImageRegex, markdownLinkRegex, urlRegex];
  for (const regex of candidates) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match?.[1]) return normalizeImageUrl(match[1]);
  }

  return '';
}

function extractMatchContent(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return '';

  return (
    getString(metadata.text) ||
    getString(metadata.content) ||
    getString(metadata.page_content) ||
    getString(metadata.description) ||
    getString(metadata.excerpt)
  );
}

function extractMatchTitle(metadata: Record<string, unknown> | null | undefined, fallback: string) {
  if (!metadata) return fallback;
  return (
    getString(metadata.title) ||
    getString(metadata.name) ||
    getString(metadata.document_title) ||
    fallback
  );
}

function extractMatchImageUrl(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return '';

  // Tenta todos os campos conhecidos de URL de imagem
  const fromField =
    normalizeImageUrl(getString(metadata.image_url)) ||
    normalizeImageUrl(getString(metadata.imageUrl)) ||
    normalizeImageUrl(getString(metadata.image_url_original)) ||
    normalizeImageUrl(getString(metadata.imagePath)) ||
    normalizeImageUrl(getString(metadata.thumbnail)) ||
    normalizeImageUrl(getString(metadata.media_url)) ||
    normalizeImageUrl(getString(metadata.image_src)) ||
    normalizeImageUrl(getString(metadata.imageSrc)) ||
    normalizeImageUrl(getString(metadata.image)) ||
    normalizeImageUrl(getString(metadata.preview_url)) ||
    '';

  if (fromField) return fromField;

  // Fallback: tenta extrair URL de imagem do conteudo textual do chunk
  const textContent = extractMatchContent(metadata);
  if (textContent) return extractImageUrlFromText(textContent);

  return '';
}


function isImageLikeMatch(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return false;

  const title = normalizeText(extractMatchTitle(metadata, ''));
  const source = normalizeText(getString(metadata.source, ''));
  const content = normalizeText(extractMatchContent(metadata));
  const imageUrl = extractMatchImageUrl(metadata);

  return Boolean(
    imageUrl ||
      source.includes('imagem') ||
      source.includes('print') ||
      title.includes('imagem') ||
      title.includes('print') ||
      title.includes('screenshot') ||
      content.includes('imagem') ||
      content.includes('print') ||
      content.includes('screenshot')
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function buildPineconeContext(matches: PineconeMatch[], queryIntent: QueryIntent) {
  const sources: RagSource[] = [];
  const blocks: string[] = [];
  const perMatchLimit = queryIntent.wantsProcedure ? 2600 : 1400;

  matches.forEach((match, index) => {
    const metadata = match.metadata ?? {};
    const title = extractMatchTitle(metadata, `Documento ${index + 1}`);
    const source = getString(metadata.source, 'Pinecone');
    const content = truncateText(extractMatchContent(metadata), perMatchLimit);
    const imageUrl = extractMatchImageUrl(metadata);

    if (!content && !imageUrl) return;

    sources.push({
      title,
      source,
      score: match.score,
      imageUrl: imageUrl || undefined,
    });

    blocks.push(
      [
        `FONTE: ${title}`,
        `ORIGEM: ${source}`,
        imageUrl ? `IMAGEM: ${imageUrl}` : null,
        `CONTEUDO: ${content}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
  });

  return {
    context: blocks.join('\n\n---\n\n'),
    sources,
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractQueryIntent(query: string): QueryIntent {
  const normalized = normalizeText(query);
  const stopwords = new Set([
    'como',
    'qual',
    'quais',
    'para',
    'com',
    'sem',
    'uma',
    'um',
    'de',
    'do',
    'da',
    'dos',
    'das',
    'no',
    'na',
    'nos',
    'nas',
    'o',
    'a',
    'os',
    'as',
    'e',
  ]);
  const terms = new Set(
    normalized
      .split(' ')
      .filter((term) => term.length > 2 && !stopwords.has(term))
  );
  const identifierTerms = new Set(
    Array.from(terms).filter((term) => /[a-z]/.test(term) && /\d/.test(term))
  );

  const wantsImage = /\b(imagem|imagens|print|prints|foto|fotos|screenshot|screenshots|tela|telas)\b/.test(normalized);
  const wantsProcedure =
    /\b(como|configurar|configuracao|acessar|acesso|instalar|ajustar|habilitar|preencher|alterar|passo|passos)\b/.test(
      normalized
    );

  return {
    raw: query,
    normalized,
    terms,
    identifierTerms,
    wantsImage,
    wantsProcedure,
  };
}

function scorePineconeMatch(match: PineconeMatch, queryIntent: QueryIntent) {
  const metadata = match.metadata ?? {};
  const title = normalizeText(extractMatchTitle(metadata, ''));
  const source = normalizeText(getString(metadata.source, ''));
  const content = normalizeText(extractMatchContent(metadata));
  const imageUrl = extractMatchImageUrl(metadata);
  const imageLike = isImageLikeMatch(metadata);
  const hasProcedureSignals =
    content.includes('passo') ||
    content.includes('configur') ||
    content.includes('basic settings') ||
    content.includes('profile sip') ||
    content.includes('access') ||
    content.includes('login') ||
    content.includes('ip address') ||
    content.includes('web ui');
  const hasSubstantialText = content.length >= 120;
  const imageOnly = imageLike && !hasSubstantialText;
  const identifierHits = Array.from(queryIntent.identifierTerms).filter(
    (term) => title.includes(term) || source.includes(term) || content.includes(term)
  );

  let score = typeof match.score === 'number' ? match.score * 100 : 0;

  for (const term of queryIntent.terms) {
    if (title.includes(term)) score += 30;
    if (source.includes(term)) score += 15;
    if (content.includes(term)) score += 10;
  }

  if (queryIntent.identifierTerms.size > 0) {
    score += identifierHits.length * 140;
    if (identifierHits.length === 0) score -= 180;
  }

  if (queryIntent.wantsProcedure) {
    if (hasProcedureSignals) score += 60;
    if (hasSubstantialText) score += 25;
    if (imageOnly) score -= 120;
    if (imageLike && !hasProcedureSignals) score -= 35;
  }

  if (queryIntent.wantsImage) {
    if (title.includes('imagem')) score += 8;
    if (imageUrl) score += 100;
    if (imageLike) score += 80;
    if (source.includes('imagem') || source.includes('print')) score += 20;
  } else {
    if (imageUrl) score += 8;
    if (imageLike) score += 4;
  }

  if (content.includes('passo') || content.includes('configur')) score += 18;

  return score;
}

function buildQueryVariants(queryIntent: QueryIntent) {
  const variants = [queryIntent.raw];
  const keywordOnly = Array.from(queryIntent.terms).join(' ');
  const identifierOnly = Array.from(queryIntent.identifierTerms).join(' ');
  if (keywordOnly && keywordOnly !== queryIntent.normalized) {
    variants.push(keywordOnly);
  }

  if (identifierOnly) {
    variants.push(identifierOnly);
    variants.push(`${identifierOnly} configuracao`);
    variants.push(`${identifierOnly} manual`);
    variants.push(`${identifierOnly} passo a passo`);
  }

  if (queryIntent.wantsProcedure) {
    variants.push(`${identifierOnly || keywordOnly || queryIntent.raw} configuracao passo a passo manual`);
  }

  if (queryIntent.wantsImage) {
    variants.push(`${keywordOnly || queryIntent.raw} imagem print screenshot figura`);
  }

  return [...new Set(variants.filter(Boolean))];
}

function mergeMatches(target: Map<string, PineconeMatch>, incoming: PineconeMatch[]) {
  for (const match of incoming) {
    const key = String(match.id || '');
    if (!key) continue;

    const current = target.get(key);
    if (!current) {
      target.set(key, match);
      continue;
    }

    const currentScore = typeof current.score === 'number' ? current.score : -1;
    const incomingScore = typeof match.score === 'number' ? match.score : -1;
    if (incomingScore > currentScore) {
      target.set(key, match);
    }
  }
}

function splitImageMatches(matches: PineconeMatch[]) {
  const imageMatches: PineconeMatch[] = [];
  const otherMatches: PineconeMatch[] = [];

  for (const match of matches) {
    if (isImageLikeMatch(match.metadata)) {
      imageMatches.push(match);
    } else {
      otherMatches.push(match);
    }
  }

  return {
    imageMatches,
    otherMatches,
  };
}

function selectBestMatches(matches: PineconeMatch[], queryIntent: QueryIntent) {
  const textHeavy = matches.filter((match) => {
    const content = extractMatchContent(match.metadata ?? {});
    return content.trim().length >= 120 || !isImageLikeMatch(match.metadata);
  });
  const imageHeavy = matches.filter((match) => isImageLikeMatch(match.metadata));

  if (queryIntent.wantsProcedure && !queryIntent.wantsImage) {
    return [...textHeavy.slice(0, 14), ...imageHeavy.slice(0, 4), ...matches.slice(0, 4)].slice(0, 18);
  }

  if (queryIntent.wantsImage) {
    return [...imageHeavy.slice(0, 10), ...textHeavy.slice(0, 8)].slice(0, 18);
  }

  return matches.slice(0, 18);
}

async function searchPinecone(query: string): Promise<RagContextResult> {
  const pineconeApiKey = process.env.PINECONE_API_KEY?.trim();
  const googleApiKey = process.env.GOOGLE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX_NAME?.trim() || 'netturbo-rag';

  if (!pineconeApiKey || !googleApiKey) {
    return {
      provider: 'empty',
      context: '',
      sources: [],
      diagnostics: ['Pinecone ou Google API Key ausente no ambiente.'],
    };
  }

  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: googleApiKey,
      model: 'models/gemini-embedding-2-preview',
    });

    const queryVector = await embeddings.embedQuery(query);
    const queryIntent = extractQueryIntent(query);
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const index = pinecone.index(indexName);
    const mergedMatches = new Map<string, PineconeMatch>();

    for (const variant of buildQueryVariants(queryIntent)) {
      const variantVector = variant === query ? queryVector : await embeddings.embedQuery(variant);
      const response = await index.query({
        vector: variantVector,
        topK: variant === query ? 60 : 40,
        includeMetadata: true,
      });

      mergeMatches(mergedMatches, ((response.matches || []) as PineconeMatch[]).filter((match) => Boolean(match.metadata)));
    }

    const sortedMatches = Array.from(mergedMatches.values()).sort(
      (a, b) => scorePineconeMatch(b, queryIntent) - scorePineconeMatch(a, queryIntent)
    );
    const { imageMatches, otherMatches } = splitImageMatches(sortedMatches);
    const matches = selectBestMatches(sortedMatches, queryIntent);

    const { context, sources } = buildPineconeContext(matches, queryIntent);
    const trimmedContext = truncateText(context, queryIntent.wantsProcedure ? 18000 : 9000);
    const imageSourcesCount = sources.filter((source) => Boolean(source.imageUrl)).length;
    const imageLikeMatchesCount = imageMatches.length;
    const nonImageMatchesCount = otherMatches.length;

    return {
      provider: trimmedContext ? 'pinecone' : 'empty',
      context: trimmedContext,
      sources,
      diagnostics: trimmedContext
        ? [
          `Pinecone index: ${indexName}`,
          `Matches ordenados: ${matches.length}`,
          `Matches com imagem: ${imageLikeMatchesCount}`,
          `Matches sem imagem: ${nonImageMatchesCount}`,
          `Fontes com image_url: ${imageSourcesCount}`,
          `Consulta pede imagem: ${queryIntent.wantsImage ? 'sim' : 'nao'}`,
          `Consulta pede procedimento: ${queryIntent.wantsProcedure ? 'sim' : 'nao'}`,
          `Termos da consulta: ${Array.from(queryIntent.terms).join(', ') || 'nenhum'}`,
        ]
        : [`Pinecone index: ${indexName}`, 'Nenhum contexto util retornado pelo Pinecone.'],
    };
  } catch (error) {
    return {
      provider: 'empty',
      context: '',
      sources: [],
      diagnostics: [`Falha ao consultar Pinecone: ${error instanceof Error ? error.message : 'erro desconhecido'}`],
    };
  }
}

export async function buildRagContext(query: string): Promise<RagContextResult> {
  // 1. BookStack (TurboDocs) — principal, sem custo de embedding
  try {
    const bookstackResult = await searchBookStack(query);
    if (bookstackResult.provider === 'bookstack' && bookstackResult.context) {
      return {
        provider: 'pinecone', // mantém compatibilidade com o tipo existente
        context: bookstackResult.context,
        sources: bookstackResult.sources,
        diagnostics: bookstackResult.diagnostics,
      };
    }
  } catch {
    // fallthrough para Pinecone
  }

  // 2. Pinecone — fallback com embeddings
  const pineconeResult = await searchPinecone(query);
  if (pineconeResult.context) return pineconeResult;

  return {
    provider: 'empty',
    context: '',
    sources: [],
    diagnostics: ['BookStack: sem resultado. Pinecone: sem resultado.'],
  };
}
