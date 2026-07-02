import hashlib
import secrets
from flask import session, jsonify
from functools import wraps

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    rounds = 100000
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), rounds)
    return f"pbkdf2:sha256:{rounds}${salt}${key.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    try:
        parts = hashed.split('$')
        if len(parts) != 3:
            return False
        algo_rounds, salt, key_hex = parts
        rounds = int(algo_rounds.split(':')[-1])
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), rounds)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False

def require_role(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = session.get('user')
            if not user or user.get('role') not in roles:
                return jsonify({'error': 'Unauthorized access'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
