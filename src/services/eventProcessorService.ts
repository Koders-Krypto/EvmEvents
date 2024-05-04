// import { listenerService } from "./services/listenerService";
import { EthersListenerService } from "./ethersListenerService";

import express from "express";
import { exit } from "process";
import { Main } from "./mainService";
// import { APIRouterService } from "./express/modules/apiRouter";
import { APICallReturn, BaseParam, EventFormatMap } from "../types/types";
// import { NFTEventRouter } from "./express/modules/nftEvent.ts/nftEventRouter";
import bodyParser from "body-parser";

export const setupListenerService = async (
    callFunc: (nftEvent: BaseParam) => Promise<APICallReturn<number[]>>,
    contractABI: any,
    eventFormatMap: EventFormatMap,
) => {
    const main = new Main(callFunc, contractABI, eventFormatMap);

    const setup = async () => {
        const resp = await main.setup();
        if (resp) {
            main.update();
        } else {
            console.log();
            exit(0);
        }
    };

    setup().then((res) => {
        const ethersListenerService = new EthersListenerService(
            main.web3Service,
            main.contractService,
            main.eventProcessor,
            main.systemLogService,
            main.bootupEventCollectService,
        );
        ethersListenerService.startListeners();
    });

    process.on("uncaughtException", async (caughtException) => {
        console.log("inside uncaught exception: " + caughtException);
        try {
            await main.systemLogService.addSystemLog({
                timestamp: new Date(),
                operation: "main.update",
                message: caughtException.message + ": " + caughtException.stack,
                logType: "error",
            });
            await main.systemLogService.pushSysLogsToDatabase();

            exit(0);
        } catch (err) {
            console.error("failed to push system logs to database: ", err);
        }
    });
};
