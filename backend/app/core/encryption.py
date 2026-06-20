import base64
import os
from cryptography.fernet import Fernet
from app.core.config import settings


def _get_key() -> bytes:
    # Derive a 32-byte URL-safe base64 key from SECRET_KEY
    raw = settings.secret_key.encode()
    padded = raw[:32].ljust(32, b"0")
    return base64.urlsafe_b64encode(padded)


_fernet = Fernet(_get_key())


def encrypt(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
