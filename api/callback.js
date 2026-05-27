export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send("Missing code parameter");
    return;
  }

  let data;
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: "https://www.baharibluetech.co.ke/api/callback",
      }),
    });
    data = await response.json();
  } catch (err) {
    res.status(500).send(`<pre>Fetch error: ${err.message}</pre>`);
    return;
  }

  if (!data.access_token) {
    res.status(500).send(`
      <h2>OAuth failed</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `);
    return;
  }

  const token = data.access_token;
  const content = JSON.stringify({ token, provider: "github" });

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!doctype html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
(function() {
  // Step 1: Tell Decap we are starting authorization
  window.opener.postMessage("authorizing:github", "*");

  // Step 2: Listen for Decap's acknowledgment, then send the token
  window.addEventListener("message", function receiveMessage(e) {
    console.log("Message from parent:", e.data, "origin:", e.origin);

    if (e.data === "authorizing:github") {
      // Step 3: Send the token back to the exact origin Decap is on
      window.opener.postMessage(
        "authorization:github:success:${content}",
        e.origin
      );
      window.removeEventListener("message", receiveMessage);
      setTimeout(function() { window.close(); }, 1000);
    }
  }, false);
})();
</script>
</body>
</html>`);
}
