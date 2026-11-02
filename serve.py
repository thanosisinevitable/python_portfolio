"""Run the portfolio locally using Python 3's standard library."""

import argparse
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class LocalHTTPServer(ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        error = sys.exc_info()[1]
        if isinstance(error, (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)


def main():
    parser = argparse.ArgumentParser(description="Run the Python portfolio locally.")
    parser.add_argument("--port", type=int, default=8000, help="Local port (default: 8000)")
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent / "dist"
    if not (directory / "index.html").is_file():
        parser.error("The dist folder is missing. Extract the entire ZIP first.")

    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    try:
        server = LocalHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Cannot start on port {args.port}: {error}\nTry --port 8001.\n")

    print(f"Portfolio: http://localhost:{args.port}", flush=True)
    print("Press Ctrl+C to stop. Refresh your browser after editing content.js.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPortfolio server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
