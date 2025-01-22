from web3 import Web3
from .settings import HTTP_ADDRESS

def get_web3_instance():
    """Connect to the blockchain and return a Web3 instance."""
    web3 = Web3(Web3.HTTPProvider(HTTP_ADDRESS))
    if not web3.is_connected():
        raise ConnectionError("Couldn't connect to the blockchain.")
    return web3
