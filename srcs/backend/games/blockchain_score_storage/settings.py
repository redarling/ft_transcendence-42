import socket

# Configuration for blockchain connection
HTTP_PORT = 443 # Port of the nginx web server using ssl which will redirected the request to the blockchain container
RESOLVED_DNS = socket.gethostbyname('nginx')  # Resolve nginx webserv container DNS
HTTP_ADDRESS = f"https://{RESOLVED_DNS}:{HTTP_PORT}/blockchain/"

# Paths to the compiled contract files
ABI_PATH = './games/blockchain_score_storage/build/TournamentScores.abi'
BIN_PATH = './games/blockchain_score_storage/build/TournamentScores.bin'