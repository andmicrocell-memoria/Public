import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));
const url = config.chatwootUrl.endsWith('/') ? config.chatwootUrl.slice(0, -1) : config.chatwootUrl;
const token = config.chatwootApiAccessToken;
const accountId = 1;

async function run() {
  const res = await fetch(`${url}/api/v1/accounts/${accountId}/contacts?page=1`, {
    headers: { 'api-access-token': token }
  });
  if (!res.ok) {
    console.error("Contacts fetch failed:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log("Response keys:", Object.keys(data));
  console.log("Contacts count on page 1:", data.payload ? data.payload.length : "no payload");
  if (data.payload && data.payload.length > 0) {
    console.log("First contact:", JSON.stringify(data.payload[0], null, 2));
  }
}

run();
