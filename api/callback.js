export default async function handler(req, res) {
  const { code } = req.query;

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    }
  );

  const data = await response.json();

  const script = `
    <script>
      window.opener.postMessage(
        'authorization:github:success:${JSON.stringify({
          token: data.access_token,
          provider: "github"
        })}',
        '*'
      );
      window.close();
    </script>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(script);
}
