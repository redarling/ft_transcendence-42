from rest_framework.response import Response
from rest_framework import status

def validate_required_fields(data, required_fields):
    """
    Check that the specified fields are present in the data.
    :param data: dictionary with data to check
    :param required_fields: list of required fields
    :return: Response with an error or None
    """
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return Response(
            {"detail": f"Missing fields: {', '.join(missing_fields)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    return None

