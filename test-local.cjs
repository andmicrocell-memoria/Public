async function main() {
  const localUrl = 'http://localhost:3000/api/health';
  try {
    console.log("Fetching local server:", localUrl);
    const res = await fetch(localUrl);
    console.log("Status code:", res.status);
    const json = await res.json();
    console.log("Response:", json);
  } catch (err) {
    console.error("Error fetching local server:", err.message);
  }
}

main();
