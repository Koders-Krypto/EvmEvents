import { ethers } from "ethers";
import {
    NFT_EVENT_ID_MAP,
    RESOURCE_TYPE_CATEGORIES,
} from "../constant/constant";
import {
    APICallReturn,
    APIStatusReturnError,
    APIStatusReturnSuccess,
    AppParam,
    BalanceAddedParam,
    BalanceWithdrawnParam,
    FetchedContractApp,
    DeleteAppParam,
    PaymentReceivedParam,
} from "../types/types";

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const hexToString = (hexx: any) => {
    var hex = hexx.toString();

    var str = "";

    for (var i = 0; i < hex.length; i += 2) {
        const val = String.fromCharCode(parseInt(hex.substr(i, 2), 16));

        if (val.charCodeAt(0) > 0) {
            str += val;
        }
    }

    return str;
};

export const convertDeleteAppParam = (
    blockNumber: number,
    param: any[],
): DeleteAppParam => {
    // const nftID = param[0];
    // const appID = param[1];

    const PARAMID = {
        nftID: 0,
        appID: 1,
        appName: 2,
        subnetList: 3,
        multiplier: 4,
        resourceCount: 5,
        resourceType: 6,
    };

    const nftID = param[PARAMID.nftID].toString();
    const appID = param[PARAMID.appID].toString();
    // const [appPath, modPath] = param[PARAMID.path];

    let appName = param[PARAMID.appName];
    appName = hexToString(appName);

    const subnetList = param[PARAMID.subnetList].map((t: ethers.BigNumber) =>
        t.toString(),
    );
    const multiplier = param[PARAMID.multiplier].map(
        (arr: ethers.BigNumber[]) =>
            arr.map((e: ethers.BigNumber) => Number(e)),
    );
    const resourceCount = param[PARAMID.resourceCount].map(
        (e: ethers.BigNumber) => Number(e),
    );
    const resourceType = param[PARAMID.resourceType].map(
        (e: ethers.BigNumber) => Number(e),
    );

    const convertParam: DeleteAppParam = {
        blockNumber,
        // eventID: NFT_EVENT_ID_MAP.DELETE_APP,
        eventType: "delete",
        nftID,
        appID,
        appName,
        // appPath: "",
        // modPath: "",
        subnetList,
        // multiplier,
        // resourceCount,
        // resourceType,
    };

    return convertParam;
};

export const convertBalanceAddedParam = (
    blockNumber: number,
    param: any[],
): BalanceAddedParam => {
    const nftID = param[0].toString();
    return {
        blockNumber,
        // eventID: NFT_EVENT_ID_MAP.BALANCE_ADDED,
        eventType: "balance-added",
        nftID,
    };
};

export const convertBalanceWithdrawnParam = (
    blockNumber: number,
    param: any[],
): BalanceWithdrawnParam => {
    const nftID = param[0].toString();
    return {
        blockNumber,
        eventType: "balance-withdrawn",
        nftID,
    };
};

export const convertAppName = (appName: string) => {
    return hexToString(appName);
};

export const convertPath = (path: string) => {
    // path = Buffer.from(path.substring(2), "hex").toString();
    // path = path.substring(1);
    path = path.substring(2);
    return path;
};

export const formatAppParams = (
    blockNumber: number,
    nftID: string,
    contractApp: FetchedContractApp,
): AppParam => {
    const app: AppParam = {
        nftID,
        blockNumber,
        // eventID: NFT_EVENT_ID_MAP.UPDATE_APP,
        eventType: "update",
        appID: contractApp[0].toString(),
        subnetList: contractApp[1].map((subnetID) => subnetID.toString()),
        multiplier: contractApp[2].map((mulArr) =>
            mulArr.map((mul) => Number(mul)),
        ),
        appName: contractApp[3][0],
        appPath: contractApp[3][2][0],
        modPath: contractApp[3][2][1],
        resourceCount: contractApp[3][3].map((res) => Number(res)),
        resourceType: contractApp[3][4].map((res) => Number(res)),
    };

    return app;
};

export const convertCreateAppParam = (
    blockNumber: number,
    param: any[],
): AppParam => {
    const PARAMID = {
        nftID: 0,
        appID: 1,
        appName: 2,
        path: 3,
        subnetList: 4,
        multiplier: 5,
        resourceCount: 6,
        resourceType: 7,
    };

    const nftID = param[PARAMID.nftID].toString();
    const appID = param[PARAMID.appID].toString();
    let [appPath, modPath] = param[PARAMID.path];

    // appPath = Buffer.from(appPath.substring(2), "hex").toString();
    // appPath = appPath.substring(1);
    // modPath = Buffer.from(modPath.substring(2), "hex").toString();
    // modPath = modPath.substring(1);
    appPath = convertPath(appPath);
    modPath = convertPath(modPath);

    let appName = param[PARAMID.appName];
    appName = hexToString(appName);

    const subnetList = param[PARAMID.subnetList].map((t: ethers.BigNumber) =>
        t.toString(),
    );
    const multiplier = param[PARAMID.multiplier].map(
        (arr: ethers.BigNumber[]) => arr.map((e) => Number(e)),
    );
    const resourceCount = param[PARAMID.resourceCount].map(
        (e: ethers.BigNumber) => Number(e),
    );
    const resourceType = param[PARAMID.resourceType].map(
        (e: ethers.BigNumber) => Number(e),
    );

    const convertParam: AppParam = {
        blockNumber,
        // eventID: NFT_EVENT_ID_MAP.CREATE_APP,
        eventType: "update",
        nftID,
        appID,
        appName,
        appPath,
        modPath,
        subnetList,
        multiplier,
        resourceCount,
        resourceType,
    };

    return convertParam;
};

export const convertCreateAppBatchParam = (
    blockNumber: number,
    param: any[],
): AppParam[] => {
    const PARAMID = {
        nftID: 0,
        appID: 1,
        appName: 2,
        path: 3,
        subnetList: 4,
        multiplier: 5,
        resourceCount: 6,
        resourceType: 7,
    };

    const nftID = param[PARAMID.nftID].toString();
    const appIDList = param[PARAMID.appID];
    const appPathList = param[PARAMID.path];
    const appNameList = param[PARAMID.appName];
    const appSubnetList = param[PARAMID.subnetList];
    const appMultiplier = param[PARAMID.multiplier];
    const appResourceCount = param[PARAMID.resourceCount];
    const appResourceType = param[PARAMID.resourceType];

    const appParamList: AppParam[] = [];
    for (let i = 0; i < appIDList.length; i++) {
        const appID = appIDList[i].toString();
        const appPath = convertPath(appPathList[i][0]);
        const modPath = convertPath(appPathList[i][1]);
        const appName = hexToString(appNameList[i]);
        const subnetList = appSubnetList[i].map((subnetID: ethers.BigNumber) =>
            subnetID.toString(),
        );
        const multiplier = appMultiplier[i].map((arr: ethers.BigNumber[]) =>
            arr.map((e) => Number(e)),
        );
        const resourceType = appResourceType[i].map((res: ethers.BigNumber) =>
            Number(res),
        );
        const resourceCount = appResourceCount[i].map((res: ethers.BigNumber) =>
            Number(res),
        );

        const appParam: AppParam = {
            blockNumber,
            nftID,
            eventType: "update",
            appID,
            appName,
            appPath,
            modPath,
            subnetList,
            multiplier,
            resourceType,
            resourceCount,
        };

        appParamList.push(appParam);
    }

    return appParamList;
};

export const convertUpdateAppBatchParam = (
    blockNumber: number,
    param: any[],
): AppParam[] => {
    const PARAMID = {
        nftID: 1,
        appID: 2,
        appName: 3,
        path: 4,
        subnetList: 5,
        multiplier: 6,
        resourceCount: 7,
        resourceType: 8,
    };

    console.log("param: ", param);
    const nftID = param[PARAMID.nftID].toString();
    const appIDList = param[PARAMID.appID];
    const appPathList = param[PARAMID.path];
    const appNameList = param[PARAMID.appName];
    const appSubnetList = param[PARAMID.subnetList];
    const appMultiplier = param[PARAMID.multiplier];
    const appResourceCount = param[PARAMID.resourceCount];
    const appResourceType = param[PARAMID.resourceType];

    const appParamList: AppParam[] = [];
    for (let i = 0; i < appIDList.length; i++) {
        const appID = appIDList[i].toString();
        const appPath = convertPath(appPathList[i][0]);
        const modPath = convertPath(appPathList[i][1]);
        const appName = hexToString(appNameList[i]);
        console.log("appNameList: ", appNameList, appName);
        const subnetList = appSubnetList[i].map((subnetID: ethers.BigNumber) =>
            subnetID.toString(),
        );
        const multiplier = appMultiplier[i].map((arr: ethers.BigNumber[]) =>
            arr.map((e) => Number(e)),
        );
        const resourceType = appResourceType[i].map((res: ethers.BigNumber) =>
            Number(res),
        );
        const resourceCount = appResourceCount[i].map((res: ethers.BigNumber) =>
            Number(res),
        );

        const appParam: AppParam = {
            blockNumber,
            nftID,
            eventType: "update",
            appID,
            appName,
            appPath,
            modPath,
            subnetList,
            multiplier,
            resourceType,
            resourceCount,
        };

        appParamList.push(appParam);
    }

    return appParamList;
};

export const convertUpdateAppParam = (
    blockNumber: number,
    param: any[],
): AppParam => {
    const PARAMID = {
        nftID: 1,
        appID: 2,
        appName: 3,
        path: 4,
        subnetList: 5,
        multiplier: 6,
        resourceCount: 7,
        resourceType: 8,
    };

    const nftID = param[PARAMID.nftID].toString();
    const appID = param[PARAMID.appID].toString();
    let [appPath, modPath] = param[PARAMID.path];

    appPath = convertPath(appPath);
    modPath = convertPath(modPath);

    let appName = param[PARAMID.appName];
    appName = hexToString(appName);

    const subnetList = param[PARAMID.subnetList].map((t: ethers.BigNumber) =>
        t.toString(),
    );
    const multiplier = param[PARAMID.multiplier].map(
        (arr: ethers.BigNumber[]) => arr.map((e) => Number(e)),
    );
    const resourceCount = param[PARAMID.resourceCount].map(
        (e: ethers.BigNumber) => Number(e),
    );
    const resourceType = param[PARAMID.resourceType].map(
        (e: ethers.BigNumber) => Number(e),
    );

    const convertParams: AppParam = {
        blockNumber,
        // eventID: NFT_EVENT_ID_MAP.UPDATE_APP,
        eventType: "update",
        nftID,
        appID,
        appName,
        appPath,
        modPath,
        subnetList,
        multiplier,
        resourceCount,
        resourceType,
    };

    return convertParams;
};

export const getEventABI = (ContractABI: any[], eventName: string) => {
    const Fragment = ContractABI.find(
        (res) => res.name === eventName && res.type === "event",
    );
    const ABI = Fragment.inputs.map((res: any) => res.internalType);
    return ABI;
};

export const dateToCron = (date: Date) => {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    return `${minutes} ${hours} ${days} ${months} ${dayOfWeek}`;
};

type APIResponse<K, E> =
    | {
          resp: K;
          success: true;
      }
    | {
          resp: E;
          success: false;
      };

export const apiCallWrapper = async <K, T, E = Error>(
    apiCall: Promise<K>,
    format?: (rowList: K) => T,
    modifyRet?: (param: APIResponse<K, E>) => APICallReturn<T, E>,
): Promise<APICallReturn<T, E>> => {
    let retVal: APICallReturn<T, E>;
    try {
        const resp: any = await apiCall;
        const tempFormat: any = format;

        if (modifyRet) {
            retVal = modifyRet({ resp, success: true });
        } else {
            retVal = {
                success: true,
                data: tempFormat(resp),
            };
        }
    } catch (err: any) {
        const error: E = err;
        if (modifyRet) {
            retVal = modifyRet({ resp: error, success: false });
        } else {
            retVal = {
                success: false,
                data: error,
            };
        }
    }

    return retVal;
};

export const statusCheckCallWrapper = async <K, T, E = Error>(
    apiCall: Promise<K>,
    getStatusCode: (param: APIResponse<K, E>) => number,
    format?: (rowList: K) => T,
    modifyRet?: (param: APIResponse<K, E>) => APICallReturn<T, E>,
): Promise<APICallReturn<T, E>> => {
    let result: APICallReturn<T, E>;
    try {
        const resp = await apiCall;

        const tempFormat: any = format;

        if (modifyRet) {
            result = modifyRet({ resp, success: true });
        } else {
            result = {
                success: true,
                statusCode: getStatusCode({
                    success: true,
                    resp,
                }),
                data: tempFormat(resp),
            };
        }
    } catch (err: any) {
        const error: E = err;
        if (modifyRet) {
            result = modifyRet({ resp: error, success: false });
        } else {
            result = {
                success: false,
                data: error,
                statusCode: getStatusCode({
                    success: false,
                    resp: error,
                }),
            };
        }
    }

    return result;
};

export const isValidCPUInstance = (resourceType: number[]) => {
    let cpuNumbers = 0;
    let index;

    for (let i = 0; i < resourceType.length; i++) {
        const resourceTypeElement = resourceType[i];

        const isCPUPresent =
            RESOURCE_TYPE_CATEGORIES.cpuInstance.includes(resourceTypeElement);

        if (isCPUPresent) {
            cpuNumbers++;
            index = i;
        }
        if (cpuNumbers > 1) break;
    }

    if (cpuNumbers === 1) return { status: true, index };
    return {
        status: false,
        message:
            "Error : you have to select exact one instance for all resources",
    };
};

export const stringifyTryCatch = (data: any) => {
    try {
        return JSON.stringify(data, (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
        );
    } catch (err) {
        return "(failed to stringify)";
    }
};
