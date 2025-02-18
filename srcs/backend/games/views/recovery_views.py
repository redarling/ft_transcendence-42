from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from asgiref.sync import async_to_sync
from ..game_logic.recovery_key_manager import RecoveryKeyManager
from games.game_logic.utils import check_active_match
import logging

logger = logging.getLogger(__name__)

class CheckActiveMatchAPIView(APIView):
    """
    Checks if there is an active match for the requesting user.
    """

    def get(self, request):
        user = request.user
        return async_to_sync(self.get_match_data)(user)

    async def get_match_data(self, user):
        try:
            match_data = await check_active_match(user)
            if match_data["active"]:
                return Response(match_data, status=status.HTTP_200_OK)
            return Response({'active': False}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error checking active match: {e}")
            return Response({'error': 'An error occurred while checking active match'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckActiveTournamentAPIView(APIView):
    """
    Checks if there is an active tournament for the requesting user.
    """
    def get(self, request):
        user = request.user
        return async_to_sync(self.get_active_tournament_id)(user)

    async def get_active_tournament_id(self, user):
        try:
            logger.info(f"Trying to get the tournament id: {user.id}")
            tournament_id = await RecoveryKeyManager.get_tournament_recovery_key(user.id)
            logger.info(f"Recovered tournament id: {tournament_id}")
            if tournament_id:
                return Response({'active': True, 'tournament_id': tournament_id}, status=status.HTTP_200_OK)
            return Response({'active': False}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error checking active tournament: {e}")
            return Response({'error': 'An error occurred while checking active tournament'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        