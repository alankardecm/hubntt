import process from 'node:process';

function parseArgs(argv) {
  const args = {};
  for (const entry of argv) {
    if (!entry.startsWith('--')) continue;
    const withoutPrefix = entry.slice(2);
    const separatorIndex = withoutPrefix.indexOf('=');
    if (separatorIndex === -1) {
      args[withoutPrefix] = true;
      continue;
    }
    const key = withoutPrefix.slice(0, separatorIndex);
    const value = withoutPrefix.slice(separatorIndex + 1);
    args[key] = value;
  }
  return args;
}

function resolveDate(value) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = resolveDate(args.date);
  const groupName = typeof args.group === 'string' && args.group.trim() ? args.group.trim() : undefined;
  const groupId = typeof args.group_id === 'string' && args.group_id.trim() ? args.group_id.trim() : undefined;
  const baseUrl = process.env.WA_DAILY_SUMMARY_URL || 'http://localhost:4000';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/wa-monitor/daily-insights/generate`;
  const body = { date, ...(groupName ? { group_name: groupName } : {}), ...(groupId ? { group_id: groupId } : {}) };

  console.log(`Generating daily summary for ${date} using ${endpoint}`);
  if (groupName) console.log(`Group filter: ${groupName}`);
  if (groupId) console.log(`Group ID filter: ${groupId}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Failed to generate daily summary');
    console.error(JSON.stringify(payload, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
