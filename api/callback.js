export default async function handler(req, res) {
  const { code, state } = req.query;

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
      <h2>OAuth failed — no access_token returned</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `);
    return;
  }

  // ✅ EXACT format Decap CMS expects:
  // "authorization:github:success:{"token":"...","provider":"github"}"
  const tokenPayload = JSON.stringify({
    token: data.access_token,
    provider: "github",
  });

  const message = `authorization:github:success:${tokenPayload}`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!doctype html>
<html>
<head><title>Authenticating...</title></head>
<body>
<p>Completing login, please wait...</p>
<script>
  (function() {
    var message = ${JSON.stringify(message)};
    var origin = "https://www.baharibluetech.co.ke";

    function sendMessage() {
      if (window.opener) {
        window.opener.postMessage(message, origin);
        setTimeout(function() { window.close(); }, 500);
      } else {
        document.body.innerHTML = "<p>Error: No opener window found. Please close this tab and try again.</p>";
      }
    }

    // Small delay ensures the opener's listener is ready
    setTimeout(sendMessage, 250);
  })();
</script>
</body>
</html>`);
}
