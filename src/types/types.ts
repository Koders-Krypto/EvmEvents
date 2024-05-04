import { MessageTypes, TypedMessage } from "@metamask/eth-sig-util";
import { NFT_EVENT_ID_MAP } from "../constant/constant";
import { ETHAddress } from "@decloudlabs/stk-v2/lib/types/types";
export interface BaseParam {
    eventType: string;
    blockNumber: number;
}

export interface EventFormatMap {
    [eventName: string]: (blockNumber: number, param: any[]) => BaseParam;
}

export interface AppParam extends BaseParam {
    eventType: "update";
    nftID: string;
    appID: string;
    appName: string;
    appPath: string;
    modPath: string;
    subnetList: string[];
    multiplier: number[][];
    resourceCount: number[];
    resourceType: number[];
}

export interface AppBatchParam extends BaseParam {
    eventType: "update-batch";
    nftID: string;
    appList: {
        appID: string;
        appPath: string;
        modPath: string;
        subnetList: string[];
        multiplier: number[][];
        resourceCount: number[];
        resourceType: number[];
    };
}

export interface DeleteAppParam extends BaseParam {
    eventType: "delete";
    nftID: string;
    appID: string;
    subnetList: string[];
    appName: string;
}

export interface DeleteAppUsingNameParam extends BaseParam {
    eventType: "delete";
    nftID: string;
    appID?: string;
    subnetList: string[];
    appName: string;
}

export interface BalanceAddedParam extends BaseParam {
    eventType: "balance-added";
    nftID: string;
}

export interface BalanceWithdrawnParam extends BaseParam {
    eventType: "balance-withdrawn";
    nftID: string;
}

export interface CronBalanceTimeoutParam extends BaseParam {
    eventType: "balance-timeout";
    nftID: string;
}

export interface PaymentReceivedParam extends BaseParam {
    eventType: "payment-received";
    orderID: string;
    collectionID: string;
    amount: string;
    mintCount: number;
    receiverAddress: ETHAddress;
    filePath: string;
}

// uint256 indexed orderID, uint256 amount, string collectionId, uint256 mintCount, address _recieverAddress, string filePath

// export type NFTEvent = PaymentReceivedParam;
// | AppParam
// | DeleteAppParam
// | BalanceAddedParam
// | BalanceWithdrawnParam
// | CronBalanceTimeoutParam;

export interface BlockEvents {
    blockNumber: number;
    eventList: BaseParam[];
    lastReceivedTime: number;
    waitingStatus: boolean;
}

export interface NFTEventCollection {
    nftID: string;
    update: AppParam[];
    delete: DeleteAppParam[];
    balance?:
        | BalanceAddedParam
        | BalanceWithdrawnParam
        | CronBalanceTimeoutParam;
}

export interface NFTExecutable {
    executionStatus: "idle" | "running" | "success" | "fail";
    // nftEventCollection: NFT;
    nftEvent: BaseParam;
}

export interface NFTEventMap {
    [index: string]: NFTEventCollection;
}

export type FetchedContractApp = [
    appID: string,
    subnetList: bigint[],
    multiplier: bigint[][],
    app: [
        appName: string,
        timestamp: bigint,
        path: [appPath: string, modPath: string],
        resourceType: bigint[],
        resourceCount: bigint[],
        cidLock: boolean,
    ],
];

export interface NFTTrackMap {
    [nftID: string]: {
        balanceEndTime: Date;
    };
}

export interface NFTTrack {
    nftID: string;
    balanceEndTime: Date;
}

export interface NFTLog {
    nftID: string;
    logType: "success" | "operation" | "validation" | "error";
    logID: string;
    timestamp: Date;
    appID?: string;
    appName?: string;
    operation: string;
    message: string;
}

export interface ResourceUnit {
    memory: string;
    cpu: string;
    disk?: string;
}

// export interface AppPayload {
//     /**
//      * @appName an unique identifier per namespace.
//      */
//     appName: string;
//     namespace: string;
//     networkId?: string;
//     nftID: string;
//     hostUrl: string;
//     path?: string[];
//     image: CreateAppImage;
//     replicaCount?: string;
//     statefulSet?: boolean;
//     args?: string[];
//     commands?: string[];
//     envVariables?: CreateAppEnvVariables[];
//     containerPort: string;
//     servicePort?: string;
//     whitelistedIps: string[];
//     persistenceEnabled: boolean;
//     storageType?: "standard" | "ssd-sc";
//     storageSize?: string;
//     username?: string;
//     password?: string;
//     volumeMounts?: CreateAppVolumeMounts[];
//     // resourceLimits: ResourceUnit;
//     // resourceRequests: ResourceUnit;
//     status?: string;
//     privateImage?: boolean;
//     privateImageRegistry?: string;
//     privateImageUsername?: string;
//     privateImagePassword?: string;
//     enableCertKey?: string;
//     certificateValue?: string;
//     keyValue?: string;
//     condition: any;
//     defaultValue: any;
//     conditionDescription: any;
//     resourceRequests: ResourceUnit;
//     resourceLimits: ResourceUnit;
// }
// export class AppPayload {
//     appName: string;
//     namespace: string;
//     nftID: string;
//     containers: {
//         name: string;
//         image: string;
//         tag: string;
//         tcpPorts: Port[];
//         httpPorts: Port[];
//         args?: string[];
//         commands?: string[];
//         envVariables?: CreateAppEnvVariables[];
//         volumeMounts?: CreateAppVolumeMounts[];
//         resourceLimits: ResourceUnit;
//         resourceRequests: ResourceUnit;
//     }[];
//     replicaCount: number;
//     whitelistedIps: string[];
//     persistence: {
//         name: string;
//         accessMode: "ReadWriteOnce";
//         storageType: "standard" | "ssd-sc";
//         storageSize?: string;
//     }[];
//     status: string;
//     privateImage?: {
//         registry: string;
//         username: string;
//         password: string;
//     };
// }

export interface Port {
    containerPort: number;
    servicePort: number;
    hostUrl?: string;
    createFlag?: boolean;
}

export interface CreateAppVolumeMounts {
    mountPath: string;
    name: string; // should just get rid of thie. THis is going to be app name always.
}

export interface CreateAppEnvVariables {
    name: string;
    value: string;
}

export interface CreateAppImage {
    repository: string;
    tag: string;
}

// export interface WebTTYPayload extends AppPayload {
//     username: string;
//     password: string;
// }

export interface SystemLog {
    timestamp: Date;
    operation: string;
    message: string;
    logType: "operation" | "validation" | "error";
}

export interface APICallReturnSuccess<T> {
    success: true;
    data: T;
    statusCode?: number;
}

export interface APICallReturnError<E> {
    success: false;
    data: E;
    statusCode?: number;
}

export type APICallReturn<T, E = Error> =
    | APICallReturnSuccess<T>
    | APICallReturnError<E>;

export interface AuthPayload {
    userAddress: string;
    signature: string;
    message: TypedMessage<MessageTypes>;
}

export interface BlockNumber {
    blockNumber: number;
    createTime: Date;
}

export interface LastBalanceScanTime {
    lastBalanceScanTime: Date;
}

export interface CFragUrsulaParams {
    nftID: string;
    appID: string;
    ursulaPath: string;
    clusterWalletAddress: string;
    userAuthPayload: AuthPayload;
    capsuleBytes: any;
    kfrag: any;
}

export interface KFragList {
    [index: number]: {
        kfrag: string;
        ursula: string;
    };
}

export interface CapsuleBytes {
    [index: number]: number;
}

export interface CipherText {
    [index: number]: number;
}

export interface CreatorKeys {
    address: string;
    publicKey: { [index: number]: number };
    secretKey: string;
}

export interface KfragList {
    [index: number]: {
        kfrag: string;
        ursula: string;
    };
}

export interface APIStatusReturnSuccess<T> {
    success: true;
    statusCode: number;
    data: T;
}

export interface APIStatusReturnError<E> {
    success: false;
    statusCode: number;
    data: E;
}

export type APIStatusReturn<T, E = Error> =
    | APIStatusReturnSuccess<T>
    | APIStatusReturnError<E>;

export interface HeartBeat {
    heartBeatTime: Date;
}

export interface ModifierArguments {
    modAttribVar?: {
        [index: string]: any;
    };
    resourceType?: number[];
    resourceCount?: number[];
}

export interface AppStatusLog extends NFTLog {
    appID: string;
    appName: string;
    logURL: string;
}

// export interface NFTLog {
//     nftID: string;
//     logType: "success" | "operation" | "validation" | "error";
//     logID: string;
//     timestamp: Date;
//     appID?: string;
//     appName?: string;
//     operation: string;
//     message: string;
// }
