from web3 import Web3
from games.blockchain_score_storage.settings import HTTP_ADDRESS

def get_web3_instance():
    """Connect to the blockchain and return a Web3 instance."""

    # Don't use ssl certificate verification as we use a self signed
    web3 = Web3(Web3.HTTPProvider(HTTP_ADDRESS, request_kwargs={'verify': False}))
    if not web3.is_connected():
        raise ConnectionError("Couldn't connect to the blockchain.")
    return web3
