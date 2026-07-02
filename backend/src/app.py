import os
import sys
from flask import Flask, redirect

# Append src folder to path for absolute imports
src_dir = os.path.dirname(os.path.abspath(__file__))
if src_dir not in sys.path:
    sys.path.append(src_dir)

from config import PORT, SECRET_KEY
from database import run_migrations
from routes import api

# Configure Flask app to serve static assets from frontend folder
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '../frontend'))

app = Flask(__name__, static_url_path='', static_folder=frontend_dir)
app.secret_key = SECRET_KEY

# Register Blueprint
app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def root():
    return redirect('/login.html')

if __name__ == '__main__':
    # Initialize DB & migrations
    run_migrations()
    
    import socket
    def get_local_ip():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except Exception:
            return '127.0.0.1'

    local_ip = get_local_ip()
    print("==================================================================")
    print("  ✅ PharmaCare Restructured Server running successfully!")
    print(f"     • Local Host:  http://localhost:{PORT}")
    print(f"     • Remote Link: http://{local_ip}:{PORT}/login.html")
    print("==================================================================")

    import webbrowser
    webbrowser.open(f'http://localhost:{PORT}/login.html')

    app.run(host='0.0.0.0', port=PORT, debug=False)
