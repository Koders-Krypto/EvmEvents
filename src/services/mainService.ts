import { NFTEventProcessor } from "../events/eventProcessor";
import { Web3Service } from "../config/ethersConfig";
import { envConfig } from "../config/envConfig";
import {
    APICallReturn,
    BaseParam,
    EventFormatMap,
    HeartBeat,
    SystemLog,
} from "../types/types";
import { NFT_EVENT_ID_MAP } from "../constant/constant";
import { DatabaseService } from "./databaseService";
import { sleep, stringifyTryCatch } from "../utils/utils";
import { BootEventCollectService } from "./bootEventCollectService";
import { SystemLogService } from "./systemLogService";
import { ContractService } from "./contractService";
import { HeartBeatService } from "./heartBeatService";
import { ProcessCheckService } from "./processCheckService";

export class Main {
    RUN_DURATION: number;
    nextRunTime: number;
    web3Service: Web3Service;
    contractService: ContractService;
    eventProcessor: NFTEventProcessor;

    databaseService: DatabaseService;
    bootupEventCollectService: BootEventCollectService;
    systemLogService: SystemLogService;
    heartBeatService: HeartBeatService;
    processCheckService: ProcessCheckService;

    constructor(
        callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>,
        contractABI: any,
        eventFormatMap: EventFormatMap,
    ) {
        this.RUN_DURATION = 0;
        this.nextRunTime = new Date().getTime();
        this.web3Service = new Web3Service();
        this.contractService = new ContractService(
            this.web3Service,
            contractABI,
        );
        this.databaseService = new DatabaseService();
        this.systemLogService = new SystemLogService(this.databaseService);

        this.eventProcessor = new NFTEventProcessor(
            this.contractService,
            callFunc,
            eventFormatMap,
        );
        this.bootupEventCollectService = new BootEventCollectService(
            this.databaseService,
            this.contractService,
            this.eventProcessor,
            this.web3Service,
            this.systemLogService,
        );

        this.heartBeatService = new HeartBeatService(
            this.databaseService,
            this.systemLogService,
        );
        this.processCheckService = new ProcessCheckService(
            this.systemLogService,
        );
    }

    addSetupLog = async (type: SystemLog["logType"], message: string) => {
        await this.systemLogService.addSystemLog({
            timestamp: new Date(),
            operation: "main.setup",
            message: message,
            logType: type,
        });
    };

    addUpdateLog = async (type: SystemLog["logType"], message: string) => {
        await this.systemLogService.addSystemLog({
            timestamp: new Date(),
            operation: "main.update",
            message: message,
            logType: type,
        });
    };

    setup = async () => {
        try {
            envConfig.setupENV();

            await this.systemLogService.setup();

            this.addSetupLog(
                "operation",
                `ENV: ${stringifyTryCatch(envConfig)}`,
            );

            const { UPDATE_DURATION } = envConfig.SYSTEM_ENV;
            this.RUN_DURATION = UPDATE_DURATION;

            await this.heartBeatService.setup();

            await this.databaseService.setup();

            await this.web3Service.setup();

            await this.contractService.setup();

            await this.eventProcessor.setup();

            await this.bootupEventCollectService.setup();

            await this.processCheckService.setup();

            return true;
        } catch (err: any) {
            const error: Error = err;
            console.log("main setup error: ", error);
            return false;
        }
    };

    update = async () => {
        while (true) {
            {
                const curTime = new Date().getTime();
                const sleepDur = this.nextRunTime - curTime;
                await sleep(sleepDur);
                this.nextRunTime = new Date().getTime() + this.RUN_DURATION;
            }

            try {
                await this.eventProcessor.update();

                await this.bootupEventCollectService.update();

                await this.processCheckService.update();

                await this.systemLogService.update();

                await this.heartBeatService.update();
            } catch (err: any) {
                const error: Error = err;
                console.error("error in update: ", error);
                await this.addUpdateLog("error", error.message);
            }
        }
    };
}
