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
  const content = JSON.stringify({ token: token, provider: "github" });
  const successMessage = "authorization:github:success:" + content;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!doctype html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
(function() {
  var successMessage = ${JSON.stringify(successMessage)};

  window.opener.postMessage("authorizing:github", "*");

  window.addEventListener("message", function(e) {
    if (e.data === "authorizing:github" || e.data === "authorizing:github:") {
      window.opener.postMessage(successMessage, e.origin);
      setTimeout(function() { window.close(); }, 500);
    }
  }, false);
})();
</script>
</body>
</html>\`);
}
