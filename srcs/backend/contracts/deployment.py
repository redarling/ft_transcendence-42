import json
from .connection import get_web3_instance
from .settings import ABI_PATH, BIN_PATH

def deploy_smart_contract():
    web3 = get_web3_instance()
    print("Connected to the blockchain.")

    # Get the --dev accounts
    accounts = web3.eth.accounts
    if not accounts:
        raise ValueError("No --dev account found to deploy the contract.")

    deployer_address = accounts[0]
    web3.eth.default_account = deployer_address

    # Load ABI and Bytecode
    with open(ABI_PATH, 'r') as abi_file:
        abi = json.load(abi_file)
    with open(BIN_PATH, 'r') as bin_file:
        bytecode = "0x" + bin_file.read().strip()

    contract = web3.eth.contract(abi=abi, bytecode=bytecode)
    transaction = contract.constructor().build_transaction({
        'from': deployer_address,
        'nonce': web3.eth.get_transaction_count(deployer_address),
        'gas': 3000000,
        'gasPrice': web3.to_wei('50', 'gwei')
    })

    txn_hash = web3.eth.send_transaction(transaction)
    print("Transaction hash:", txn_hash.hex())

    txn_receipt = web3.eth.wait_for_transaction_receipt(txn_hash)
    print("Contract deployed at address:", txn_receipt.contractAddress)

    return txn_receipt.contractAddress
