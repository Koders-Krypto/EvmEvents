import Mutex from "../utils/mutex";
import {
    BlockEvents,
    NFTExecutable,
    NFTEventMap,
    APICallReturn,
    EventFormatMap,
    BaseParam,
} from "../types/types";
import { ContractService } from "../services/contractService";

export class NFTExecuteClass implements NFTExecutable {
    nftEvent: BaseParam;
    executionStatus: "idle" | "running" | "success" | "fail";
    blockProcessed: number[];
    callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>;

    constructor(
        nftEvent: BaseParam,
        callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>,
    ) {
        this.nftEvent = nftEvent;
        this.executionStatus = "idle";
        this.blockProcessed = [];
        this.callFunc = callFunc;
    }

    async execute() {
        this.executionStatus = "running";
        try {
            const blocksProcessed = [];

            const callFuncResp = await this.callFunc(this.nftEvent);
            if (callFuncResp.success == false) throw callFuncResp.data;
            this.blockProcessed = callFuncResp.data;

            this.executionStatus = "success";
            console.log(
                "successfully processed: ",
                this.blockProcessed,
                this.nftEvent,
            );
        } catch (err) {
            this.executionStatus = "fail";
            console.log("execution failed", err);
        }
    }

    executeEvents = async () => {};
}

interface NFTEventFilters {
    paymentReceived: string;
}

export class NFTEventProcessor {
    blockNumberToIDMap: { [index: string]: number } = {};
    runningEventList: NFTExecuteClass[] = [];
    collectedBlockList: BlockEvents[] = [];
    blockEventCountMap: { [index: number]: number } = {};
    nftEventMap: NFTEventMap = {};
    isNFTRunning: {
        [nftID: string]: boolean;
    } = {};
    completedBlockList: number[] = [];
    blockToWriteList: number[] = [];

    shouldRunTick = false;
    nextRunTime = new Date().getTime();
    RUN_INTERVAL = 2000;
    collectedBlockMutex = new Mutex();
    eventFormatMap: EventFormatMap;
    filterToParamMap: {
        [index: string]: (blockNumber: number, param: any) => BaseParam;
    } = {};
    filterToParamBatchMap: {
        [idnex: string]: (blockNumber: number, param: any) => BaseParam[];
    };
    filterToEventIDMap = {};
    filters: NFTEventFilters | undefined = undefined;

    contractService: ContractService;
    callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>;

    constructor(
        contractService: ContractService,
        callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>,
        eventFormatMap: EventFormatMap,
    ) {
        this.contractService = contractService;
        this.callFunc = callFunc;
        this.eventFormatMap = eventFormatMap;
    }

    setup = async () => {
        const OrderPayment = this.contractService.getOrderPayment();

        const eventNameList = Object.keys(this.eventFormatMap);

        for (let i = 0; i < eventNameList.length; i++) {
            const eventName = eventNameList[i];
            const eventFilter =
                OrderPayment.filters[eventName]().topics[0].toString();

            console.log(
                "eventFilter: ",
                eventName,
                OrderPayment.filters[eventName]().topics,
            );
            this.filterToParamMap = {
                ...this.filterToParamMap,
                [eventFilter]: this.eventFormatMap[eventName],
            };
        }
    };

    addCollectedBlockInternal = (
        blockNumber: number,
        waitingStatus: boolean,
    ) => {
        let entryID = -1;
        let lastReceivedTime = new Date();
        const blockNumStr = blockNumber.toString();

        if (this.blockNumberToIDMap[blockNumStr] != undefined) {
            const blockEntryID = this.blockNumberToIDMap[blockNumStr];
            const blockEvents = this.collectedBlockList[blockEntryID];
            blockEvents.lastReceivedTime = lastReceivedTime.getTime();
            blockEvents.waitingStatus = waitingStatus;
            entryID = blockEntryID;
        } else {
            const blockEvents: BlockEvents = {
                blockNumber,
                eventList: [],
                lastReceivedTime: lastReceivedTime.getTime(),
                waitingStatus,
            };

            this.blockNumberToIDMap[blockNumStr] =
                this.collectedBlockList.length;
            this.collectedBlockList.push(blockEvents);
            entryID = this.blockNumberToIDMap[blockNumStr];
        }

        return entryID;
    };

    collectEvents = async (
        waitingStatus: boolean,
        nftEventList: BaseParam[],
    ) => {
        await this.collectedBlockMutex.lock();

        console.log("nftEventList: ", nftEventList);
        for (let i = 0; i < nftEventList.length; i++) {
            const nftEvent = nftEventList[i];
            const { blockNumber } = nftEvent;
            const entryID = this.addCollectedBlockInternal(
                blockNumber,
                waitingStatus,
            );
            this.collectedBlockList[entryID].eventList.push(nftEvent);
        }

        await this.collectedBlockMutex.release();
    };

    collectBlock = async (blockNumber: number, waitingStatus: boolean) => {
        await this.collectedBlockMutex.lock();
        this.addCollectedBlockInternal(blockNumber, waitingStatus);
        await this.collectedBlockMutex.release();
    };

    saveCompletedBlocks = () => {
        const runningBlockNumList = Object.keys(this.blockEventCountMap).map(
            (x) => Number(x),
        );
        let smallestBlockNum = Number.MAX_VALUE;

        if (runningBlockNumList.length == 0) return;

        for (let i = 0; i < runningBlockNumList.length; i++) {
            const blockNumber = runningBlockNumList[i];
            if (this.blockEventCountMap[blockNumber] <= 0) {
                this.completedBlockList.push(blockNumber);
                delete this.blockEventCountMap[blockNumber];
            } else {
                if (smallestBlockNum > blockNumber) {
                    smallestBlockNum = blockNumber;
                }
            }
        }

        if (this.completedBlockList.length == 0) return;

        // console.log(
        //     "save completed blocks: ",
        //     this.completedBlockList,
        //     runningBlockNumList,
        //     smallestBlockNum,
        // );

        const newCompBlockList: number[] = [];
        for (let i = 0; i < this.completedBlockList.length; i++) {
            const blockNumber = this.completedBlockList[i];

            if (blockNumber > smallestBlockNum) {
                newCompBlockList.push(blockNumber);
                continue;
            }

            this.blockToWriteList.push(blockNumber);
        }
        this.completedBlockList = newCompBlockList;
    };

    addNFTEvents = (nftEvent: BaseParam) => {
        const eventType = nftEvent.eventType;
        // const nftID = nftEvent.nftID.toString();

        // if (!this.nftEventMap[nftID]) {
        //     this.nftEventMap[nftID] = {
        //         nftID: nftID,
        //         update: [],
        //         delete: [],
        //     };
        // }

        // if (eventType === "delete") {
        //     const appID = nftEvent.appID;
        //     this.nftEventMap[nftID].update = removePreviousAppEvents(
        //         this.nftEventMap[nftID].update,
        //         appID,
        //     );

        //     this.nftEventMap[nftID].delete.push(nftEvent);
        // }
    };

    handleCompletedEvents = () => {
        const newRunningEventList: NFTExecuteClass[] = [];

        if (this.runningEventList.length == 0) return;

        for (let i = 0; i < this.runningEventList.length; i++) {
            const nftEvent: NFTExecuteClass = this.runningEventList[i];
            if (
                !(
                    nftEvent.executionStatus == "success" ||
                    nftEvent.executionStatus == "fail"
                )
            ) {
                newRunningEventList.push(nftEvent);
            } else {
                console.log(
                    "nftEvent.blockProcessed: ",
                    nftEvent.blockProcessed,
                );
                for (let j = 0; j < nftEvent.blockProcessed.length; j++) {
                    const blockNumber = nftEvent.blockProcessed[j];
                    // const blockNumStr = blockNumber.toString();
                    console.log(
                        "block event count map: ",
                        this.blockEventCountMap,
                    );
                    const blockCount = this.blockEventCountMap[blockNumber];
                    this.blockEventCountMap[blockNumber] =
                        (blockCount || 0) - 1;
                }
            }
        }

        this.runningEventList.length = 0;
        for (let i = 0; i < newRunningEventList.length; i++) {
            this.runningEventList.push(newRunningEventList[i]);
        }
    };

    // saveCompletedBlocks = () => {

    // }

    getReadyBlocksFromCollectedList = async () => {
        const WAIT_DURATION = 1000;

        if (this.collectedBlockList.length == 0) return [];

        await this.collectedBlockMutex.lock();

        this.collectedBlockList.sort((a, b) => {
            return a.blockNumber > b.blockNumber ? 0 : -1;
        });

        let firstWaitingBlock = -1;
        let readyBlockList: BlockEvents[] = [];
        const curTime = new Date().getTime();
        for (let i = 0; i < this.collectedBlockList.length; i++) {
            const blockEvents = this.collectedBlockList[i];

            if (
                blockEvents.waitingStatus ||
                blockEvents.lastReceivedTime + WAIT_DURATION > curTime
            ) {
                break;
            }

            firstWaitingBlock = i;
        }

        if (firstWaitingBlock > -1) {
            readyBlockList = this.collectedBlockList.splice(
                0,
                firstWaitingBlock + 1,
            );
        }

        for (var key in this.blockNumberToIDMap) {
            delete this.blockNumberToIDMap[key];
        }

        for (let i = 0; i < this.collectedBlockList.length; i++) {
            const blockEvents = this.collectedBlockList[i];
            this.blockNumberToIDMap[blockEvents.blockNumber.toString()] = i;
        }

        await this.collectedBlockMutex.release();

        const zeroBlockList: BlockEvents[] = [];
        const plusBlockList: BlockEvents[] = [];
        for (let i = 0; i < readyBlockList.length; i++) {
            const readyBlock = readyBlockList[i];
            const blockNumber = readyBlock.blockNumber;
            if (readyBlock.eventList.length > 0) {
                plusBlockList.push(readyBlock);
                this.blockEventCountMap[blockNumber] =
                    readyBlock.eventList.length;
            } else {
                zeroBlockList.push(readyBlock);
                this.blockEventCountMap[blockNumber] = 0;
            }
        }

        return plusBlockList;
    };

    addNFTEventsFromReadyBlocks = (readyBlockList: BlockEvents[]) => {
        if (readyBlockList.length == 0) return;

        for (let i = 0; i < readyBlockList.length; i++) {
            const blockEvents = readyBlockList[i];

            for (let j = 0; j < blockEvents.eventList.length; j++) {
                const nftEvent = blockEvents.eventList[j];

                const nftEventExecutable = new NFTExecuteClass(
                    nftEvent,
                    this.callFunc,
                );
                nftEventExecutable.execute();
                this.runningEventList.push(nftEventExecutable);
            }
        }

        console.log("nft events added: ", this.nftEventMap);
    };

    // addRunningEvents = () => {
    //     const nftList = Object.keys(this.nftEventMap);
    //     for (let i = 0; i < nftList.length; i++) {
    //         const nftID = nftList[i];

    //         if (this.isNFTRunning[nftID]) continue;

    //         const nftEventExecutable = new NFTEventClass(
    //             this.nftEventMap[nftID],
    //         );
    //         nftEventExecutable.execute();

    //         this.isNFTRunning[nftID] = true;
    //         console.log("executing event:", nftEventExecutable);
    //         this.runningEventList.push(nftEventExecutable);

    //         delete this.nftEventMap[nftID];
    //     }
    // };

    getBlockToWriteList = () => {
        return this.blockToWriteList;
    };

    clearBlockToWriteList = () => {
        this.blockToWriteList = [];
    };

    getAndClearBlockToWriteList = () => {
        const blockToWriteList = this.blockToWriteList;
        this.blockToWriteList = [];
        return blockToWriteList;
    };

    setRunTick = (flag: boolean) => {
        this.shouldRunTick = flag;
    };

    update = async () => {
        if (!this.shouldRunTick) return;

        if (new Date().getTime() < this.nextRunTime) return;

        this.nextRunTime = new Date().getTime() + this.RUN_INTERVAL;

        this.handleCompletedEvents();

        let readyBlockList: BlockEvents[] =
            await this.getReadyBlocksFromCollectedList();

        this.addNFTEventsFromReadyBlocks(readyBlockList);

        // this.addRunningEvents();

        this.saveCompletedBlocks();
    };
}
