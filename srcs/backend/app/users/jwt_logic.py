import jwt
import datetime
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
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

# Function to generate a JWT token
def generate_jwt(payload: dict, expiration_minutes: int) -> str:
    """
    Generate a JWT token with the given payload and expiration time.

    :param payload: Dictionary containing user data (e.g., {"user_id": 1})
    :param expiration_minutes: Token's lifespan in minutes
    :return: A JWT token string
    """

    payload['exp'] = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiration_minutes)
    
    token = jwt.encode(payload, PRIVATE_KEY, algorithm='RS256')
    return token

# TODO: Verifying that a token has not actually been modified or tampered with?
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
        raise ExpiredSignatureError("The token has expired.")
    except InvalidTokenError:
        raise InvalidTokenError("The token is invalid.")