import os
import sys
from flask import Flask, redirect

src_dir = os.path.dirname(os.path.abspath(__file__))
if src_dir not in sys.path:
    sys.path.append(src_dir)

from config import PORT, SECRET_KEY
from database import run_migrations
from routes import api

frontend_dir = os.path.abspath(os.path.join(src_dir, '../../frontend'))

app = Flask(__name__, static_url_path='', static_folder=frontend_dir)
app.secret_key = SECRET_KEY

app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def root():
    return redirect('/login.html')

if __name__ == '__main__':
    run_migrations()

    import socket
    def get_local_ip():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return '127.0.0.1'

    local_ip = get_local_ip()
    print("=" * 60)
    print("  ✅  NexusPOS — Running!")
    print(f"     • Local:   http://localhost:{PORT}")
    print(f"     • Network: http://{local_ip}:{PORT}/login.html")
    print("=" * 60)

    import webbrowser
    webbrowser.open(f'http://localhost:{PORT}/login.html')

    app.run(host='0.0.0.0', port=PORT, debug=False)
