res.status(200).send(`<!doctype html>
<html>
<head><title>Authenticating...</title></head>
<body>
<p>Waiting for parent...</p>
<script>
(function() {
  var log = function(msg) {
    document.body.innerHTML += '<p>' + msg + '</p>';
    console.log(msg);
  };

  log("Popup loaded. opener exists: " + !!window.opener);

  // Step 1: Send authorizing message
  window.opener.postMessage("authorizing:github", "*");
  log("Sent: authorizing:github");

  // Step 2: Listen for ANY message back
  window.addEventListener("message", function(e) {
    log("Received from parent - origin: " + e.origin + " data: " + JSON.stringify(e.data));
    
    // Try both with and without colon
    if (e.data === "authorizing:github" || e.data === "authorizing:github:") {
      window.opener.postMessage(
        "authorization:github:success:${content}",
        e.origin
      );
      log("Token sent to parent!");
      setTimeout(function() { window.close(); }, 2000);
    }
  }, false);

  // Fallback: if no response in 5 seconds, log it
  setTimeout(function() {
    log("TIMEOUT - parent never responded. Check parent console.");
  }, 5000);
})();
</script>
</body>
</html>`);
