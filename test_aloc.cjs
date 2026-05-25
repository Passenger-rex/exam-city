async function test() {
   const res = await fetch("https://questions.aloc.com.ng/api/v2/q/40?subject=english", {
      headers: { "AccessToken": "ALOC-d57fb2d98d89069d58ca" }
   });
   console.log("ALOC STATUS:", res.status);
   const text = await res.text();
   console.log("ALOC RESPONSE:", text.slice(0, 200));
}
test();
