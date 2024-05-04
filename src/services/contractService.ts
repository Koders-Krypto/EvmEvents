import { MutexExecution } from "../utils/mutexExecution";
import { APICallReturn, AppParam } from "../types/types";
import {
    apiCallWrapper,
    convertAppName,
    convertPath,
    formatAppParams,
} from "../utils/utils";
import { Web3Service } from "../config/ethersConfig";
import { ethers } from "ethers";
import { envConfig } from "../config/envConfig";
// import AppDeploymentABI from "../config/abi/AppDeployment";
// import SubnetClusterABI from "../config/abi/SubnetCluster";
// import SubscriptionBalanceABI from "../config/abi/SubscriptionBalance";
import { APIRetryExecution } from "../utils/apiWaitExecution";
import { AxiosError } from "axios";

export class ContractService {
    web3Service: Web3Service;
    appListMutex: MutexExecution<any, AppParam[]>;
    balanceTimeMutex: MutexExecution<string, Date>;

    OrderPayment: ethers.Contract;
    OrderPaymentABI: any;

    socketContracts: {
        AppDeployment: ethers.Contract;
        SubscriptionBalance: ethers.Contract;
        SubnetCluster: ethers.Contract;
    };

    constructor(web3Service: Web3Service, OrderPaymentABI: any) {
        this.web3Service = web3Service;
        this.OrderPaymentABI = OrderPaymentABI;
    }

    setup = async () => {
        this.setupContracts(this.web3Service.signer, this.OrderPaymentABI);
        // this.appListMutex = new APIRetryExecution<any, any, Error>(
        //     CONT_GETAPPLIST_LIMIT,
        //     this.getAppListInternal,
        // );
        // this.balanceTimeMutex = new APIRetryExecution<string, Date, Error>(
        //     CONT_GETBALTIME_LIMIT,
        //     this.getBalanceEndTimeInternal,
        // );
    };

    // getAppListInternal = async (param: {
    //     nftID: string;
    //     blockNumber: number;
    // }): Promise<APICallReturn<AppParam[], Error>> => {
    //     const { nftID, blockNumber } = param;
    //     // const AppDeployment = this.getAppDeployment();

    //     const result = await apiCallWrapper<any, AppParam[]>(
    //         AppDeployment.getAppList(nftID),
    //         (contractAppList) =>
    //             contractAppList
    //                 .map((app) => formatAppParams(blockNumber, nftID, app))
    //                 .map((app) => {
    //                     return {
    //                         ...app,
    //                         appName: convertAppName(app.appName),
    //                         appPath: convertPath(app.appPath),
    //                         modPath: convertPath(app.modPath),
    //                     };
    //                 }),
    //     );

    //     return result;
    // };

    // getAppList = async (param: {
    //     nftID: string;
    //     blockNumber: number;
    // }): Promise<APICallReturn<AppParam[]>> => {
    //     return await this.appListMutex.execute(param);
    // };

    // getBalanceEndTimeInternal = async (
    //     nftID: string,
    // ): Promise<APICallReturn<Date>> => {
    //     const result = await apiCallWrapper<bigint, Date>(
    //         this.getSubscriptionBalance().getBalanceEndTime(nftID),
    //         (balanceEndTime) => new Date(Number(balanceEndTime) * 1000),
    //     );

    //     return result;
    // };

    // getBalanceEndTime = async (nftID: string): Promise<APICallReturn<Date>> => {
    //     return await this.balanceTimeMutex.execute(nftID);
    // };

    setupContracts = (signer, OrderPaymentABI: any) => {
        const socketProvider = this.web3Service.getSocketProvider();
        const { OrderPayment } = envConfig.CONTRACT_ADDRESSES;
        this.OrderPayment = new ethers.Contract(
            OrderPayment,
            OrderPaymentABI,
            signer,
        );
        // this.AppDeployment = new ethers.Contract(
        //     AppDeployment,
        //     AppDeploymentABI,
        //     signer,
        // );
        // this.SubscriptionBalance = new ethers.Contract(
        //     SubscriptionBalance,
        //     SubscriptionBalanceABI,
        //     signer,
        // );
        // this.SubnetCluster = new ethers.Contract(
        //     Registration,
        //     SubnetClusterABI,
        //     signer,
        // );
    };

    // getAppDeployment = () => {
    //     return this.AppDeployment;
    // };

    // getSubscriptionBalance = () => {
    //     return this.SubscriptionBalance;
    // };

    // getSubnetCluster = () => {
    //     return this.SubnetCluster;
    // };

    getOrderPayment = () => {
        return this.OrderPayment;
    };

    // getSocketContracts = () => {
    //     return this.socketContracts;
    // };

    // initSocketContracts = (
    //     socketProvider: ethers.providers.WebSocketProvider,
    // ) => {
    //     const { AppDeployment, SubscriptionBalance, Registration } =
    //         envConfig.CONTRACT_ADDRESSES;
    //     this.socketContracts = {
    //         AppDeployment: new ethers.Contract(
    //             AppDeployment,
    //             AppDeploymentABI,
    //             socketProvider,
    //         ),
    //         SubscriptionBalance: new ethers.Contract(
    //             SubscriptionBalance,
    //             SubscriptionBalanceABI,
    //             socketProvider,
    //         ),
    //         SubnetCluster: new ethers.Contract(
    //             Registration,
    //             SubnetClusterABI,
    //             socketProvider,
    //         ),
    //     };
    // };
}
