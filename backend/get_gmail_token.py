"""
Run this script ONCE on your local machine to generate a Gmail OAuth2 refresh token.
After running, copy the output values into Railway environment variables.

Usage:
    python get_gmail_token.py
"""

import json
import urllib.parse
import urllib.request
import http.server
import threading
import webbrowser

CLIENT_ID = input("Paste your GMAIL_CLIENT_ID: ").strip()
CLIENT_SECRET = input("Paste your GMAIL_CLIENT_SECRET: ").strip()

SCOPES = "https://www.googleapis.com/auth/gmail.send"
REDIRECT_URI = "http://localhost:8080"

auth_params = {
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "response_type": "code",
    "scope": SCOPES,
    "access_type": "offline",
    "prompt": "consent",
}
auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(auth_params)

code_holder = []

class _Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if "code" in params:
            code_holder.append(params["code"][0])
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h2>Done! You can close this tab and go back to the terminal.</h2>")

    def log_message(self, *args):
        pass

server = http.server.HTTPServer(("localhost", 8080), _Handler)
t = threading.Thread(target=server.handle_request)
t.daemon = True
t.start()

print("\nOpening browser — sign in as dhanesh@ivalueindia.com and click Allow...")
print(f"If the browser does not open, paste this URL manually:\n{auth_url}\n")
webbrowser.open(auth_url)
t.join(timeout=120)

if not code_holder:
    print("\nNo code received within 2 minutes. Please try again.")
    raise SystemExit(1)

code = code_holder[0]
post_data = urllib.parse.urlencode({
    "code": code,
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "redirect_uri": REDIRECT_URI,
    "grant_type": "authorization_code",
}).encode()

req = urllib.request.Request(
    "https://oauth2.googleapis.com/token",
    data=post_data,
    method="POST",
)
with urllib.request.urlopen(req) as resp:
    tokens = json.loads(resp.read())

if "refresh_token" not in tokens:
    print("\nERROR: No refresh_token in response. Make sure you clicked Allow and try again.")
    print("Response:", tokens)
    raise SystemExit(1)

print("\n" + "="*60)
print("SUCCESS! Add these 4 variables in Railway dashboard:")
print("="*60)
print(f"GMAIL_CLIENT_ID     = {CLIENT_ID}")
print(f"GMAIL_CLIENT_SECRET = {CLIENT_SECRET}")
print(f"GMAIL_REFRESH_TOKEN = {tokens['refresh_token']}")
print(f"FROM_EMAIL          = dhanesh@ivalueindia.com")
print("="*60 + "\n")
