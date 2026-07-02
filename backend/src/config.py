import os
import secrets

PORT = 8088
DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pharmacy.db')
BACKUPS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backups')
SECRET_KEY = secrets.token_hex(32)
