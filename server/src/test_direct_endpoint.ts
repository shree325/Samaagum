async function main() {
  const url = "http://localhost:3000/api/test/messages/73f59348-c597-40cc-9120-951358cc64e9?actorId=00000000-0000-0000-0000-000000003501&limit=100";
  const res = await fetch(url);
  const json = await res.json();
  console.log("Endpoint response:", JSON.stringify(json, null, 2));
}

main().catch(console.error);
