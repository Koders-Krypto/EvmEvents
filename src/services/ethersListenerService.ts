// import { ContractEventPayload, SocketProvider, ethers } from "ethers";
import WebSocket from "ws";
import { NFTEventProcessor } from "../events/eventProcessor";
import { envConfig } from "../config/envConfig";
import { SystemLogService } from "./systemLogService";
import { Web3Service } from "../config/ethersConfig";
import { ContractService } from "./contractService";
import { BootEventCollectService } from "./bootEventCollectService";
import domain, { Domain } from "domain";
import { sleep } from "../utils/utils";
import { ListenerService } from "../utils/listenerService";

export class EthersListenerService implements ListenerService {
    web3Service: Web3Service;
    contractService: ContractService;
    eventProcessor: NFTEventProcessor;
    systemLogService: SystemLogService;
    bootupEventCollectService: BootEventCollectService;

    socketDomain: Domain;
    startFlag = true;
    errorCount = 0;
    startSetTime = new Date();
    domainErrorTime = new Date();

    constructor(
        web3Service: Web3Service,
        contractService: ContractService,
        eventProcessor: NFTEventProcessor,
        systemLogService: SystemLogService,
        bootupEventCollectService: BootEventCollectService,
    ) {
        this.web3Service = web3Service;
        this.contractService = contractService;
        this.eventProcessor = eventProcessor;
        this.systemLogService = systemLogService;
        this.bootupEventCollectService = bootupEventCollectService;
    }

    getEventParam = (args, contractPayload) => {
        const filter = contractPayload.topics[0];
        const { blockNumber } = contractPayload;

        console.log("filter: ", this.eventProcessor.filterToParamMap);
        if (this.eventProcessor.filterToParamMap[filter]) {
            return this.eventProcessor.filterToParamMap[filter](
                blockNumber,
                args,
            );
        }

        return null;
    };

    createListeners = async () => {
        try {
            // const { SUBNET_ID } = envConfig;
            const { LISTSERV_BLOCKADD_TIME } = envConfig.SYSTEM_ENV;
            let firstPingReceived = false;

            let timeToWriteBlock = new Date();

            const httpProvider = this.web3Service.getHTTPProvider();

            // const { AppDeployment, SubscriptionBalance } = this.contractService;
            const { OrderPayment } = this.contractService;

            console.log("createListeners");

            OrderPayment.on("*", async (contractPayload) => {
                console.log(
                    "contract payload: ",
                    contractPayload,
                    firstPingReceived,
                );
                if (!firstPingReceived) return;

                try {
                    const { args } = contractPayload;
                    const paymentReceived = this.getEventParam(
                        args,
                        contractPayload,
                    );
                    console.log("paymentReceived: ", paymentReceived);
                    if (!paymentReceived) return;
                    await this.eventProcessor.collectEvents(false, [
                        paymentReceived,
                    ]);
                } catch (err) {
                    const error: Error = err;
                    console.log("error: ", error);
                    await this.systemLogService.addSystemLog({
                        timestamp: new Date(),
                        operation: "listenerService",
                        message: error.message,
                        logType: "error",
                    });
                }
            });

            httpProvider.on("block", async (blockNumber) => {
                const curTime = new Date();
                // console.log("received block: ", blockNumber);

                if (firstPingReceived == false) {
                    firstPingReceived = true;
                    console.log("first ping received");
                    this.bootupEventCollectService.startBootup();
                    return;
                }

                if (
                    timeToWriteBlock.getTime() + LISTSERV_BLOCKADD_TIME <
                    curTime.getTime()
                ) {
                    await this.eventProcessor.collectBlock(blockNumber, false);
                    timeToWriteBlock = new Date();
                }
            });
        } catch (err) {
            const error: Error = err;
            console.log("error in socket service: ", error);
        }
    };

    startListeners = async () => {
        this.socketDomain = domain.create();
        console.log("outside domain");
        this.socketDomain.on("error", function (er) {
            if (this.domainErrorTime.getTime() > new Date().getTime()) return;

            this.errorCount += 1;
            console.log("domain errored out: ", this.errorCount);
            this.domainErrorTime = new Date(new Date().getTime() + 15000);

            setTimeout(function () {
                console.log("set the start flag to true");
                this.startFlag = true;
            }, 15000);
        });

        this.socketDomain.run(async () => {
            console.log("domain running");
            let nextRunTime = new Date().getTime();
            const RUN_DURATION = 1000;

            while (true) {
                {
                    const curTime = new Date().getTime();
                    const sleepDur = nextRunTime - curTime;
                    await sleep(sleepDur);
                    nextRunTime = new Date().getTime() + RUN_DURATION;
                }

                if (this.startFlag == true) {
                    if (
                        this.startSetTime.getTime() - new Date().getTime() <
                        10000
                    ) {
                        this.startSetTime = new Date();
                        this.startFlag = false;
                        this.createListeners();
                    }

                    console.log("inside true start flag: ", this.errorCount);
                    this.errorCount -= 1;
                }
            }
        });
    };
}
