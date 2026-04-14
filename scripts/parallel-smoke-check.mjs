const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:4100';

const checks = [
  { name: 'Healthcheck', path: '/api/health', expectJson: true },
  { name: 'Home', path: '/', expectHtml: true },
  { name: 'Workspace', path: '/dashboard', expectHtml: true },
  { name: 'RAG', path: '/rag', expectHtml: true },
  { name: 'Zabbix API', path: '/api/zabbix', expectJson: true },
  { name: 'WA Insights', path: '/api/wa-monitor/insights?days=7', expectJson: true },
];

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

async function runCheck(check) {
  const url = `${normalizeBaseUrl(baseUrl)}${check.path}`;

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      return {
        ...check,
        ok: false,
        status: response.status,
        detail: `HTTP ${response.status}`,
      };
    }

    if (check.expectJson && !contentType.includes('application/json')) {
      return {
        ...check,
        ok: false,
        status: response.status,
        detail: `Conteudo inesperado: ${contentType || 'sem content-type'}`,
      };
    }

    if (check.expectHtml && !contentType.includes('text/html')) {
      return {
        ...check,
        ok: false,
        status: response.status,
        detail: `Conteudo inesperado: ${contentType || 'sem content-type'}`,
      };
    }

    return {
      ...check,
      ok: true,
      status: response.status,
      detail: contentType || 'ok',
    };
  } catch (error) {
    return {
      ...check,
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : 'Falha desconhecida',
    };
  }
}

async function main() {
  console.log(`Smoke check paralelo em ${normalizeBaseUrl(baseUrl)}\n`);

  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }

  for (const result of results) {
    const marker = result.ok ? 'OK' : 'FAIL';
    console.log(`[${marker}] ${result.name} -> ${result.path} (${result.detail})`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} verificacao(oes) falharam.`);
    process.exit(1);
  }

  console.log('\nSmoke check concluido com sucesso.');
}

main();
