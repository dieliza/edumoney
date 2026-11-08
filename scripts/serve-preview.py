"""Servidor local de la exportación de demostración; no almacena datos de usuario."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

root = Path(__file__).resolve().parent.parent / 'dist-preview'
class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)
    def do_GET(self):
        if not Path(urlparse(self.path).path).suffix:
            self.path = '/index.html'
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1', 8081), PreviewHandler).serve_forever()
