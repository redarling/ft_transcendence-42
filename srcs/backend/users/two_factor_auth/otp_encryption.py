import os, base64
from cryptography.fernet import Fernet

key = os.getenv("ENCRYPTION_KEY")

if key is None:
    raise ValueError("ENCRYPTION_KEY is not set in the environment!")

try:
    cipher = Fernet(key)
except Exception as e:
    raise ValueError(f"Invalid ENCRYPTION_KEY: {e}")

def encrypt_otp(otp_secret: str) -> str:
    return cipher.encrypt(otp_secret.encode()).decode()

def decrypt_otp(encrypted_otp: str) -> str:
    return cipher.decrypt(encrypted_otp.encode()).decode()
