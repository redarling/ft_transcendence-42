import json
from games.blockchain_score_storage.connection import get_web3_instance
from games.blockchain_score_storage.settings import ABI_PATH

def get_contract_instance(contract_address):
    """Load a contract instance from an address and ABI."""
    with open(ABI_PATH, 'r') as abi_file:
        abi = json.load(abi_file)
    web3 = get_web3_instance()
    return web3.eth.contract(address=contract_address, abi=abi)

def add_score(contract_address, match_id, user_id, score):
    web3 = get_web3_instance()
    accounts = web3.eth.accounts
    if not accounts:
        raise ValueError("No --dev account found to add a new score.")

    web3.eth.default_account = accounts[0]
    contract = get_contract_instance(contract_address)

    transaction = contract.functions.addScore(match_id, user_id, score).build_transaction({
        'from': web3.eth.default_account,
        'nonce': web3.eth.get_transaction_count(web3.eth.default_account),
        'gas': 2000000,
        'gasPrice': web3.to_wei('20', 'gwei')
    })

    txn_hash = web3.eth.send_transaction(transaction)
    txn_receipt = web3.eth.wait_for_transaction_receipt(txn_hash)
    return txn_receipt

def get_score(contract_address, match_id, user_id):
    contract = get_contract_instance(contract_address)
    return contract.functions.getScore(match_id, user_id).call()
