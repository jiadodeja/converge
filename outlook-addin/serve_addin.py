"""
Tiny HTTPS server for the Converge Outlook add-in.

Outlook only loads add-in pages over HTTPS, so this serves this folder on
https://localhost:3100 using Microsoft's local development certificate.

One time setup (in this folder or anywhere):
    npx office-addin-dev-certs install
That creates a trusted certificate in  C:\\Users\\<you>\\.office-addin-dev-certs

Then run:
    python serve_addin.py
"""

import http.server
import os
import ssl

PORT = 3100
HERE = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(os.path.expanduser("~"), ".office-addin-dev-certs")
CERT_FILE = os.path.join(CERT_DIR, "localhost.crt")
KEY_FILE = os.path.join(CERT_DIR, "localhost.key")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def end_headers(self):
        # Do not cache, so edits show up right after a reload
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    if not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
        print("Certificate not found in", CERT_DIR)
        print("Run this once, then start this script again:")
        print("    npx office-addin-dev-certs install")
        return

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(CERT_FILE, KEY_FILE)

    server = http.server.ThreadingHTTPServer(("localhost", PORT), Handler)
    server.socket = context.wrap_socket(server.socket, server_side=True)

    print(f"Converge add-in is served at https://localhost:{PORT}/taskpane.html")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
