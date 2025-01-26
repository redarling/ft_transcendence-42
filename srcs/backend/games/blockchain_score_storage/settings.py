import socket

# Configuration for blockchain connection
HTTP_PORT = 8545
# RESOLVED_DNS = socket.gethostbyname('blockchain')  # Resolve blockchain container DNS
HTTP_ADDRESS = f"http://127.0.0.1:{HTTP_PORT}"

# Paths to the compiled contract files
ABI_PATH = './build/TournamentScores.abi'
BIN_PATH = './build/TournamentScores.bin'