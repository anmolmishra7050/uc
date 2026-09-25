"""Serve the built `dist/` folder with the real security headers from `_headers`.

Cloudflare Pages applies `_headers` for you. Locally nothing does — so a broken
Content-Security-Policy would only be discovered on the live domain, after deploy.
This script reads the `/*` block out of `_headers` and applies exactly those headers,
so what you test locally is what Cloudflare will send.

Usage:
    # build dist first (same command as GO-LIVE.md Part 1)
    mkdir -p dist && cp -r index.html assets robots.txt sitemap.xml _headers _redirects .nojekyll dist/
    python tools/preview-headers.py       # then open http://127.0.0.1:4181
"""
import http.server
import os
import socketserver

PORT = 4181
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOBAL_BLOCK = "/*"  # the catch-all rule in _headers


def load_global_headers():
    """Read the header name/value pairs out of the `/*` block of `_headers`."""
    path = os.path.join(ROOT, "_headers")
    if not os.path.exists(path):
        raise SystemExit("_headers not found")

    headers = {}
    pattern = None
    with open(path, encoding="utf-8") as fh:
        for line in fh.read().splitlines():
            text = line.strip()
            if not text or text.startswith("#"):
                continue
            if line[:1].isspace():           # indented line = a header for `pattern`
                if pattern == GLOBAL_BLOCK and ":" in text:
                    name, _, value = text.partition(":")
                    headers[name.strip()] = value.strip()
            else:                            # unindented line = a new URL pattern
                pattern = text
    return headers


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        for name, value in self.server.headers_to_send.items():
            self.send_header(name, value)
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

    def __init__(self, address, handler, headers_to_send):
        self.headers_to_send = headers_to_send
        super().__init__(address, handler)


if __name__ == "__main__":
    dist = os.path.join(ROOT, "dist")
    if not os.path.isdir(dist):
        raise SystemExit("dist/ not found - build it first (see GO-LIVE.md Part 1)")

    headers = load_global_headers()
    print("Serving {0} on http://127.0.0.1:{1} with headers from _headers:".format(dist, PORT))
    for name, value in headers.items():
        print("  {0}: {1}".format(name, value if len(value) < 100 else value[:97] + "..."))

    os.chdir(dist)
    with Server(("127.0.0.1", PORT), Handler, headers) as httpd:
        httpd.serve_forever()
