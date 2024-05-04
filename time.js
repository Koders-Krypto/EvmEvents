const { JsonRpcProvider } = require("ethers");

// let arr = [1, 2, 3]

// let mul = 5;

// for(let i = 0; i < 3; i++)
// 	arr[i] = arr[i] *  5;

// console.log("array: ", arr);

let option = {
    batchMaxCount: 1,
};

const jsonProvider = new JsonRpcProvider(
    "https://validator1.stackos-testnet.polygon.zeeve.net",
    undefined,
    option,
);
// console.log("json rpc: ", envConfig.JSON_RPC_URL);

const test = async () => {
    let currentBlockNum = await jsonProvider.getBlockNumber();

    console.log("curblock: ", currentBlockNum);
};

test();
