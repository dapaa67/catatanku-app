const fetch = require('node-fetch');

async function test() {
  const data = {
    session_id: "test-session-123",
    message: "Halo, bisa bantu saya?"
  };

  const res = await fetch("https://yobby15-catatanku-fastapi.hf.space/api/chat/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    console.log("Error status:", res.status);
    console.log(await res.text());
    return;
  }
  const json = await res.json();
  console.log(json);
}

test();
