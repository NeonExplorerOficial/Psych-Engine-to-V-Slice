from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

os.chdir('web')

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 5000), NoCacheHandler)
    print('Server running on http://0.0.0.0:5000')
    server.serve_forever()
