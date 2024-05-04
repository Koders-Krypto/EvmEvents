import OrderPaymentABI from "./contractABI";
import { setupListenerService } from "./services/eventProcessorService";
import { APICallReturn, BaseParam } from "./types/types";

// event PaymentReceived(
//     uint256 indexed orderID,
//     bytes32 indexed collectionId,
//     uint256 amount,
//     uint256 mintCount,
//     string filePath
// );

// event CollectionCreated(
//     uint256 mintingPrice,
//     bytes32 collectionId,
//     address creatorAddress
// );

interface CollectionCreatedParam extends BaseParam {
    mintingPrice: string;
    collectionID: string;
    creatorAddress: string;
}

interface PaymentReceivedParam extends BaseParam {
    orderID: string;
    collectionID: string;
    amount: string;
    mintCount: string;
    filePath: string;
}

export const convertCollectionCreated = (
    blockNumber: number,
    param: any[],
): CollectionCreatedParam => {
    return {
        mintingPrice: param[0].toString(),
        collectionID: param[1].toString(),
        creatorAddress: param[2].toString(),
        blockNumber,
        eventType: "collection-created",
    };
};

export const convertPaymentReceived = (
    blockNumber: number,
    param: any[],
): PaymentReceivedParam => {
    return {
        orderID: param[0].toString(),
        collectionID: param[1].toString(),
        amount: param[2].toString(),
        mintCount: param[3].toString(),
        filePath: param[4].toString(),
        blockNumber,
        eventType: "payment-received",
    };
};

const eventFormatMap = {
    CollectionCreated: convertCollectionCreated,
    PaymentReceived: convertPaymentReceived,
};

const callFunc = async (
    eventParam: BaseParam,
): Promise<APICallReturn<number[]>> => {
    console.log("got event ", eventParam);
    return {
        success: true,
        data: [eventParam.blockNumber],
    };
};

setupListenerService(callFunc, OrderPaymentABI, eventFormatMap);
