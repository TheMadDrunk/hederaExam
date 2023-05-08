const {
    Client, PrivateKey, AccountCreateTransaction, Hbar, FileCreateTransaction, ContractCreateTransaction, ContractFunctionParameters,ContractExecuteTransaction,
    ContractCallQuery

} = require("@hashgraph/sdk");

require("dotenv").config();


async function newAccount(client) {
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    //Create a new account with 1,000 tinybar starting balance
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    return newAccount.getReceipt();
}

async function main() {
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (!myAccountId || !myPrivateKey) {
        throw new Error(
            "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
        );
    }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    //Import the compiled contract from the HelloHedera.json file
    let helloHedera = require("./HelloHedera.json");
    const bytecode = helloHedera.bytecode;

    //Create a file on Hedera and store the hex-encoded bytecode
    const fileCreateTx = new FileCreateTransaction()
        //Set the bytecode of the contract
        .setContents(bytecode);

    //Submit the file to the Hedera test network signing with the transaction fee payer key specified with the client
    const submitTx = await fileCreateTx.execute(client);

    //Get the receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);

    //Get the file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    // Instantiate the contract instance
    const contractTx = await new ContractCreateTransaction()
        //Set the file ID of the Hedera file storing the bytecode
        .setBytecodeFileId(bytecodeFileId)
        //Set the gas to instantiate the contract
        .setGas(100000)
        //Provide the constructor parameters for the contract
        .setConstructorParameters(new ContractFunctionParameters().addString("Hello from Hedera!"));

    //Submit the transaction to the Hedera test network
    const contractResponse = await contractTx.execute(client);

    //Get the receipt of the file create transaction
    const contractReceipt = await contractResponse.getReceipt(client);

    //Get the smart contract ID
    const newContractId = contractReceipt.contractId;

    //Log the smart contract ID
    console.log("The smart contract ID is " + newContractId);

    //v2 JavaScript SDK
    // Calls a function of the smart contract
    const contractQuery = await new ContractCallQuery()
        //Set the gas for the query
        .setGas(100000)
        //Set the contract ID to return the request for
        .setContractId(newContractId)
        //Set the contract function to call
        .setFunction("get_address")
        //Set the query payment for the node returning the request
        //This value must cover the cost of the request otherwise will fail
        .setQueryPayment(new Hbar(2));

    //Submit to a Hedera network
    const get_address = await contractQuery.execute(client);

    // Get a string from the result at index 0
    const address = get_address;

    //Log the message
    //console.log("The contract get_address: " + address);
    //console.log("The gas used : " + get_address.gasUsed);

    //v2 Hedera JavaScript SDK
    newAcR = newAccount(client);


    //Create the transaction to update the contract message
    const contractExecTx = await new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(newContractId)
        //Set the gas for the contract call
        .setGas(100000)
        //Set the contract function to call
        .setFunction("set_address", new ContractFunctionParameters().addAddress(newAcR.accountId));

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);

    //Get the receipt of the transaction
    const receipt2 = await submitExecTx.getReceipt(client);

    //Confirm the transaction was executed successfully 
    console.log("The transaction status is " + receipt2.status.toString());

    //Query the contract for the contract message
}
main();