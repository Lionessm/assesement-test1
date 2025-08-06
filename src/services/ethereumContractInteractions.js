const axios = require('axios');

// Only Sepolia testnet
contractInteractionTransaction = async (
    operationsData,
    web3,
    nonce
) => {
    let tx
    const o = operationsData

    const contractAbi = await getAbi(o.smartContractAddress);
    if (contractAbi.status !== '1' || contractAbi.message !== 'OK') {
        throw new Error(`Contract does not exist or is not verified.`)
    }

    const contract = new web3.eth.Contract(
        JSON.parse(contractAbi.result), o.smartContractAddress
    )

    const gasPrice = await web3.eth.getGasPrice();

    return tx = {
        from: o.fromAddress,
        to: o.smartContractAddress,
        nonce: nonce,
        gas: 500000,
        gasPrice,
        data: contract.methods.totalSupply().encodeABI(),
    }
}

getAbi = async(smartContractAddress) => {
    const res = await axios.post(
    `${process.env.ETHERSCAN_URL}api?module=contract&action=getabi&address=${smartContractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`,
    {
        params: {},
    }
     )
    if (res.data.status === '0') {
    throw new Error(res.data.result)
    }
    return res.data
}

module.exports = {
    contractInteractionTransaction
};