import { ethers } from "ethers";
import { ENVConfig, envConfig } from "./envConfig";

// Web3 configuration and contract Package initialization

export class Web3Service {
    // web3: Web3;
    socketProvider: ethers.providers.WebSocketProvider;
    jsonProvider: ethers.providers.JsonRpcProvider;
    signer: ethers.Wallet;

    setup = async () => {
        this.jsonProvider = new ethers.providers.JsonRpcProvider(
            envConfig.JSON_RPC_URL,
            undefined,
        );
        console.log("json rpc: ", envConfig.JSON_RPC_URL);

        let currentBlockNum = await this.jsonProvider.getBlockNumber();

        console.log("started json provider: ", currentBlockNum);
        this.signer = new ethers.Wallet(
            envConfig.CLUSTER_PRIVATE_KEY,
            this.jsonProvider,
        );
    };

    getSocketProvider = () => {
        return this.socketProvider;
    };

    getHTTPProvider = () => {
        return this.jsonProvider;
    };

    createWebSocketProvider = () => {
        this.socketProvider = new ethers.providers.WebSocketProvider(
            envConfig.SOCKET_RPC_URL,
        );

        return this.socketProvider;
    };
}
