const express = require('express');
const router = express.Router();
const Web3 = require('web3').default; 
const validator = require('web3-validator');
const contractInteraction = require('../services/ethereumContractInteractions');

// GET /api/ethereum/contract-balance
router.get('/', async (req, res, next) => {
    try {
        const web3 = new Web3(process.env.RPC_URL_SEPOLIA);
        const smartContractAddress = req.body.smartContractAddress; 
        const privateKey = process.env.WALLET_PRIVATE_KEY;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);

        // Check if input address is accurate
        if (!validator.isAddress(smartContractAddress)) {
            return res.status(400).json({ 
                error: 'Invalid Ethereum address.' 
            });
        }

        const nonce = await web3.eth.getTransactionCount(req.body.fromAddress, 'latest');

        const interactionBody = {
            fromAddress: req.body.fromAddress,
            smartContractAddress: smartContractAddress
        }

        const tx = await contractInteraction.contractInteractionTransaction(interactionBody, web3, nonce);

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

        // Send signed transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        // NOTE: Tipically for view only transactions, we would only call the function by use of web3 .call() - not specifically create a transaction
        // Hence, here we do not have a result, but only the tx receipt
        // I did this for demonstrating contract interaction

        res.json({
            success: true,
            message: `Transaction was sucessful`,
            txHash: receipt.transactionHash
        });
    } catch (err) {
      next(err);
    }
});

module.exports = router;