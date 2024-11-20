from rest_framework.exceptions import AuthenticationFailed

def get_token_from_header(request):
    """
    Utility function to extract and validate the token from the Authorization header.
    Returns the token if valid, otherwise raises AuthenticationFailed.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise AuthenticationFailed("Authorization header is required.")
    
    try:
        token_type, token = auth_header.split(' ')
        if token_type.lower() != 'bearer':
            raise AuthenticationFailed("Invalid token header format.")
        return token
    except ValueError:
        raise AuthenticationFailed("Authorization header must be in 'Bearer <token>' format.")