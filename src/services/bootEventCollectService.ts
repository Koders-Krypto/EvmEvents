import { envConfig } from "../config/envConfig";
import { Web3Service } from "../config/ethersConfig";
import { NFTEventProcessor } from "../events/eventProcessor";
import { DatabaseWriterExecution } from "../utils/databaseWriterExecution";
import Mutex from "../utils/mutex";
import { COService } from "../utils/service";
import { stringifyTryCatch } from "../utils/utils";
import { ContractService } from "./contractService";
import { DatabaseService } from "./databaseService";
import { SystemLogService } from "./systemLogService";

export class BootEventCollectService implements COService {
    bootupStatus: "idle" | "start" | "running" | "succeeded" | "failed";
    lastBlockNumber: number;
    currentBlockNumber: number;
    blocksToWriteList: number[];
    databaseWriter: DatabaseWriterExecution<number[]>;

    bootupBlockParam: {
        oldestBlock: number;
        currentBlock: number;
    };

    databaseService: DatabaseService;
    web3Service: Web3Service;
    contractService: ContractService;
    systemLogService: SystemLogService;
    eventProcessor: NFTEventProcessor;
    firstRunBootFlag: boolean;

    constructor(
        databaseService: DatabaseService,
        contractService: ContractService,
        eventProcessor: NFTEventProcessor,
        web3Service: Web3Service,
        systemLogService: SystemLogService,
    ) {
        this.databaseService = databaseService;
        this.contractService = contractService;
        this.eventProcessor = eventProcessor;
        this.web3Service = web3Service;
        this.systemLogService = systemLogService;
    }

    setup = async () => {
        const { PROCESSED_BLOCK_UPLOAD_DURATION, FIRST_RUN_BOOT_FLAG } =
            envConfig.SYSTEM_ENV;
        this.firstRunBootFlag = FIRST_RUN_BOOT_FLAG;
        this.databaseWriter = new DatabaseWriterExecution<number[]>(
            "processedBlockWriter",
            this.saveBlocksToDatabase,
            this.addBlocksToWrite,
            PROCESSED_BLOCK_UPLOAD_DURATION,
        );
        this.blocksToWriteList = [];
        this.bootupStatus = "idle";
    };

    setBootupStatus = (status) => {
        this.bootupStatus = status;
    };

    setBlocksToReady = async () => {
        const { oldestBlock, currentBlock } = this.bootupBlockParam;
        for (let i = oldestBlock; i <= currentBlock; i++) {
            this.eventProcessor.collectBlock(i, false);
        }
    };

    fetchBalanceEventsFromBlock = async (
        fromBlock: number,
        toBlock: number,
    ) => {
        const OrderPayment = this.contractService.getOrderPayment();

        const logDataList = await this.web3Service.getHTTPProvider().getLogs({
            fromBlock: fromBlock,
            toBlock: toBlock,
            address: envConfig.CONTRACT_ADDRESSES.OrderPayment,
        });

        const eventList = logDataList
            .map((log) => {
                const blockNumber = log.blockNumber;
                const topicList: string[] = log.topics.map((x) => x);
                const events = OrderPayment.interface.parseLog({
                    topics: topicList,
                    data: log.data,
                });

                const filter = events.topic;
                const params = events.args;

                if (!this.eventProcessor.filterToParamMap[filter]) return null;

                const nftEvent = this.eventProcessor.filterToParamMap[filter](
                    blockNumber,
                    params,
                );

                return nftEvent;
            })
            .filter((event) => event != null);

        if (eventList.length > 0) {
            eventList.forEach((event) => {
                this.eventProcessor.collectEvents(false, [event]);
            });
        }
    };

    fetchEventsSinceLastRun = async () => {
        let { oldestBlock, currentBlock } = this.bootupBlockParam;

        if (oldestBlock > currentBlock) {
            console.log(
                "nothing to scan, the block number is the latest. old: ",
                oldestBlock,
                "new: ",
                currentBlock,
            );
            return;
        }

        const fetchEvents = async (
            oldestBlock: number,
            currentBlock: number,
            fetchEventFunc: (fromBlock, ToBlock) => Promise<any>,
        ) => {
            let blockInc = oldestBlock;
            const maxBlockStride = 20;
            let blockStride = maxBlockStride;
            let successCount = 0;

            while (blockInc <= currentBlock) {
                const curBlockStride = Math.min(
                    blockStride,
                    currentBlock - blockInc,
                );
                try {
                    console.log(
                        "fetching events: ",
                        blockInc,
                        blockInc + curBlockStride,
                    );
                    await fetchEventFunc(blockInc, blockInc + curBlockStride);
                    successCount += 1;
                    if (successCount > 5) {
                        blockStride = Math.min(blockStride + 1, maxBlockStride);
                        successCount += 1;
                    }

                    blockInc += curBlockStride + 1;
                } catch (err) {
                    console.error("failed to fetch block: ", err);
                    blockStride = Math.max(blockStride - 1, 0);
                }
            }
        };

        await fetchEvents(
            oldestBlock,
            currentBlock,
            this.fetchBalanceEventsFromBlock,
        );

        console.log("done with fetching events");
    };

    getBlocksToProcess = async () => {
        const { MAX_BLOCK_DIFF } = envConfig.SYSTEM_ENV;
        const resp = await this.databaseService.getMaxProcessedBlock();
        if (!resp.success) throw resp.data;

        let currentBlockNum = await this.web3Service
            .getHTTPProvider()
            .getBlockNumber();

        let oldestBlockNum = 0;
        if (resp.data == null) {
            if (this.firstRunBootFlag) {
                oldestBlockNum = 0;
            } else {
                oldestBlockNum = currentBlockNum;
            }
        } else {
            oldestBlockNum = resp.data.blockNumber;
        }

        console.log("block num from database: ", oldestBlockNum);

        if (currentBlockNum - oldestBlockNum > MAX_BLOCK_DIFF)
            oldestBlockNum = currentBlockNum - MAX_BLOCK_DIFF;

        let blockInc = oldestBlockNum + 1;
        while (blockInc <= currentBlockNum) {
            this.eventProcessor.collectBlock(blockInc, true);
            blockInc += 1;
        }

        this.bootupBlockParam = {
            oldestBlock: oldestBlockNum + 1,
            currentBlock: currentBlockNum,
        };

        console.log("bootup block param: ", this.bootupBlockParam);
    };

    startBootup = () => {
        if (this.bootupStatus !== "running") {
            this.bootupStatus = "start";
        }
    };

    bootup = async () => {
        try {
            console.log("inside getting blocks to process");
            await this.getBlocksToProcess();
        } catch (err) {
            console.log("failed to get blocks to process: ", err);
            this.bootupStatus = "failed";
            return;
        }

        try {
            console.log("fetching events since last run");
            await this.fetchEventsSinceLastRun();
        } catch (err) {
            console.log("failed to fetch events during bootup: ", err);
            this.bootupStatus = "failed";
            return;
        }

        this.setBlocksToReady();

        this.eventProcessor.setRunTick(true);
        this.bootupStatus = "succeeded";
    };

    addBlocksToWriteInternal = (blockList: number[]) => {
        this.blocksToWriteList = [...this.blocksToWriteList, ...blockList];
    };

    addBlocksToWrite = async (blockList: number[]) => {
        await this.databaseWriter.insert(blockList);
    };

    saveBlocksToDatabase = async () => {
        const newBlocksToWrite =
            this.eventProcessor.getAndClearBlockToWriteList();
        this.blocksToWriteList = [
            ...this.blocksToWriteList,
            ...newBlocksToWrite,
        ];

        if (this.blocksToWriteList.length == 0) {
            return;
        }

        let maxBlock = 0;
        for (let i = 0; i < this.blocksToWriteList.length; i++) {
            const blockNum = this.blocksToWriteList[i];
            if (blockNum > maxBlock) {
                maxBlock = blockNum;
            }
        }

        if (maxBlock == 0) return;

        // console.log("saving processed block: ", maxBlock);
        const resp = await this.databaseService.saveProcessedBlocks(
            // this.blocksToWriteList.map((blockNumber) => ({ blockNumber })),
            [{ blockNumber: maxBlock, createTime: new Date() }],
        );

        if (!resp.success) {
            console.error("saving blocks to database failed: ", resp.data);
            await this.systemLogService.addSystemLog({
                timestamp: new Date(),
                operation: "bootEventCollectService",
                message: `${stringifyTryCatch(resp.data)}`,
                logType: "operation",
            });
        } else {
            this.blocksToWriteList = [];
        }
    };

    update = async () => {
        if (this.bootupStatus === "start") {
            this.bootupStatus = "running";
            console.log("booting up");
            this.bootup();
        }

        await this.databaseWriter.execute();
    };
}
