const {
    Client,
    TopicCreateTransaction,
    PrivateKey,
    TransactionReceipt,
    TopicInfoQuery,
    TopicUpdateTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");

require("dotenv").config();

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

    const adminKey = PrivateKey.fromString(myPrivateKey);
    const submitKey = PrivateKey.generateED25519();


    let txResponse = await new TopicCreateTransaction()
        .setAdminKey(adminKey)
        .setSubmitKey(submitKey)
        .setTopicMemo("this memo is v1")
        .execute(client);

    const getReceipt = await txResponse.getReceipt(client);

    let topicID = getReceipt.topicId;
    const query = new TopicInfoQuery().setTopicId(topicID);
    const info = await query.execute(client);


    console.log("New topic ID is: " + info.topicId);
    console.log('New topic memo is :' + info.topicMemo);

    const transaction = await new TopicUpdateTransaction()
        .setTopicId(topicID)
        .setTopicMemo("this memo is v2")
        .setSubmitKey(submitKey)
        .freezeWith(client)

    const signTx = await transaction.sign(adminKey);

    const txResponse2 = await signTx
        .execute(client);

    const receipt = await txResponse.getReceipt(client);

    const query2 = new TopicInfoQuery().setTopicId(topicID);
    const info2 = await query2.execute(client);

    console.log("New topic ID is: " + info2.topicId);
    console.log('New topic memo is :' + info2.topicMemo);


    await new Promise((resolve) => setTimeout(resolve, 5000));
    // Subscribe to the topic
    new TopicMessageQuery()
        .setTopicId(topicID)
        .subscribe(client, null, (message) => {
            let messageAsString = Buffer.from(message.contents, "utf8").toString();
            console.log(
                `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
            );
        });
    
    
    // Send message to private topic
    let submitMsgTx = await new TopicMessageSubmitTransaction({
        topicId: topicID,
        message: "My first message in this topic",
    })
        .freezeWith(client)
        .sign(submitKey);

    let submitMsgTxSubmit = await submitMsgTx.execute(client);
    

    // Get the receipt of the transaction
    let getReceipt3 = await submitMsgTxSubmit.getReceipt(client);

    // Get the status of the transaction
    const transactionStatus = getReceipt3.status;
    console.log("The message transaction status " + transactionStatus.toString());


}
main();