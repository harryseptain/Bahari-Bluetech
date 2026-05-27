export default async function handler(req, res) {
  const { code } = req.query;

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code
    })
  });

  const data = await response.json();

  if (!data.access_token) {
    res.status(500).send(`
      <h2>OAuth failed</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `);
    return;
  }

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
<!doctype html>
<html>
<body>
<script>
  const token = ${JSON.stringify(data.access_token)};
  const message = "authorization:github:success:" + JSON.stringify({ token: token });

  window.opener.postMessage(message, window.location.origin);
  window.close();
</script>
</body>
</html>
  `);
}
