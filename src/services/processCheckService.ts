import { COService } from "../utils/service";
import { stringifyTryCatch } from "../utils/utils";
import { SystemLogService } from "./systemLogService";

export class ProcessCheckService implements COService {
    lastSendTime: Date;
    sendDuration: number;
    systemLogService: SystemLogService;

    constructor(systemLogService: SystemLogService) {
        this.systemLogService = systemLogService;
    }

    setup = async () => {
        this.lastSendTime = new Date();
        this.sendDuration = 60 * 60 * 1000;
    };
    update = async () => {
        if (
            new Date().getTime() <
            this.lastSendTime.getTime() + this.sendDuration
        ) {
            return;
        }

        this.lastSendTime = new Date();

        const usage = process.memoryUsage();

        console.log("usage: ", usage);

        await this.systemLogService.addSystemLog({
            timestamp: new Date(),
            operation: "processCheck",
            message: `${stringifyTryCatch(usage)}`,
            logType: "operation",
        });
    };
}
