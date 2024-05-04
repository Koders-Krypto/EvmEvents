import { envConfig } from "../config/envConfig";
import { HeartBeat } from "../types/types";
import { DatabaseWriterExecution } from "../utils/databaseWriterExecution";
import { COService } from "../utils/service";
import { stringifyTryCatch } from "../utils/utils";
import { DatabaseService } from "./databaseService";
import { SystemLogService } from "./systemLogService";

export class HeartBeatService implements COService {
    databaseService: DatabaseService;
    databaseWriter: DatabaseWriterExecution<HeartBeat>;
    systemLogService: SystemLogService;

    constructor(
        databaseService: DatabaseService,
        systemLogService: SystemLogService,
    ) {
        this.databaseService = databaseService;
        this.systemLogService = systemLogService;
    }

    setup = async () => {
        const { HEARTBEAT_DURATION } = envConfig.SYSTEM_ENV;
        this.databaseWriter = new DatabaseWriterExecution<HeartBeat>(
            "heartBeat",
            this.pushHeartBeatToDatabase,
            null,
            HEARTBEAT_DURATION,
        );
    };

    pushHeartBeatToDatabase = async () => {
        const heartBeat: HeartBeat = {
            heartBeatTime: new Date(),
        };
        const resp = await this.databaseService.updateHeartBeat(heartBeat);
        if (!resp.success) {
            console.error("failed to push heartbeat to database: ", resp.data);
            await this.systemLogService.addSystemLog({
                timestamp: new Date(),
                operation: "heartBeatService",
                message: `${stringifyTryCatch(resp.data)}`,
                logType: "operation",
            });
        }
    };

    update = async () => {
        await this.databaseWriter.execute();
    };
}
