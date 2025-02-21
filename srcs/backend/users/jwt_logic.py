import jwt
from django.utils import timezone
from datetime import timedelta
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from rest_framework.exceptions import NotAuthenticated
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

# Generate RSA private and public keys
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

public_key = private_key.public_key()

# Serialize keys for use in JWT signing and verification
PRIVATE_KEY = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()
)

PUBLIC_KEY = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

def generate_jwt(payload: dict, expiration_minutes: int, session_id: str = None) -> str:
    """
    Generate a JWT token with the given payload and expiration time.

    :param payload: Dictionary containing user data (e.g., {"user_id": 1})
    :param expiration_minutes: Token's lifespan in minutes
    :param session_id: Session ID to include in the token
    :return: A JWT token string
    """
    payload['session_id'] = session_id
    payload['exp'] = timezone.now() + timedelta(minutes=expiration_minutes)

    token = jwt.encode(payload, PRIVATE_KEY, algorithm='RS256')
    return token

def decode_jwt(token: str) -> dict:
    """
    Decode and verify the given JWT token using the public key.

    :param token: The JWT token as a string
    :return: Decoded payload as a dictionary
    :raises: ExpiredSignatureError if the token has expired
             InvalidTokenError if the token is invalid
    """
    try:
        # Decode the token using the public key
        decoded_payload = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])
        return decoded_payload
    except ExpiredSignatureError:
        raise NotAuthenticated("The token has expired.")
    except InvalidTokenError:
        raise NotAuthenticated("The token has expired.")