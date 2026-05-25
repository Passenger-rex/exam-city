async function test() {
   const res = await fetch("http://localhost:3000/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          messages: [{ role: "user", parts: [{ text: "Hello!" }] }]
      })
   });
   console.log("STATUS:", res.status);
   const text = await res.text();
   console.log("RESPONSE:", text);
}
test();
