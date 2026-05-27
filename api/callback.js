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

  const content = `
<!doctype html>
<html>
<body>
<script>
(function() {
  const message = 'authorization:github:success:' + JSON.stringify({
    token: '${data.access_token}',
    provider: 'github'
  });

  if (window.opener) {
    window.opener.postMessage(message, '*');
    window.close();
  } else {
    document.body.innerHTML = 'Login complete. You can close this window and return to Decap.';
  }
})();
</script>
</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(content);
}
