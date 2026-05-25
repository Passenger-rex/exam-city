async function test() {
   const res = await fetch("http://localhost:3000/api/questions?subject=english");
   console.log("STATUS:", res.status);
   const text = await res.text();
   console.log("RESPONSE:", text.slice(0, 400));
}
test();
