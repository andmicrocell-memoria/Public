import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));
const url = config.chatwootUrl.endsWith('/') ? config.chatwootUrl.slice(0, -1) : config.chatwootUrl;
const token = config.chatwootApiAccessToken;

async function run() {
  const res = await fetch(`${url}/api/v1/profile`, {
    headers: { 'api-access-token': token }
  });
  if (!res.ok) {
    console.error("Profile fetch failed:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log("account_id:", data.account_id);
  console.log("accounts:", JSON.stringify(data.accounts, null, 2));
}

run();
