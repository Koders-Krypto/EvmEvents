import { envConfig } from "../config/envConfig";
import { NFTLog, SystemLog } from "../types/types";
import { DatabaseWriterExecution } from "../utils/databaseWriterExecution";
import { COService } from "../utils/service";
import { DatabaseService } from "./databaseService";

export class SystemLogService implements COService {
    logList: SystemLog[];
    // nftLogWriteReadyList: string[];
    databaseWriter: DatabaseWriterExecution<SystemLog>;

    databaseService: DatabaseService;

    constructor(databaseService: DatabaseService) {
        this.databaseService = databaseService;
        this.logList = [];
    }

    setup = async () => {
        const { SYSLOG_DB_UPLOAD_DURATION } = envConfig.SYSTEM_ENV;
        console.log("system log upload duration: ", SYSLOG_DB_UPLOAD_DURATION);
        this.databaseWriter = new DatabaseWriterExecution<SystemLog>(
            "sysLogWriter",
            this.pushSysLogsToDatabase,
            this.addSystemLogInternal,
            SYSLOG_DB_UPLOAD_DURATION,
        );
    };

    addSystemLogInternal = async (systemLog: SystemLog) => {
        this.logList.push(systemLog);
    };

    addSystemLog = async (systemLog: SystemLog) => {
        this.databaseWriter.insert(systemLog);
    };

    pushSysLogsToDatabase = async () => {
        if (this.logList.length == 0) {
            return;
        }

        const resp = await this.databaseService.insertSystemLogs(this.logList);
        // console.log("system log database: ", resp);
        if (!resp.success) {
            console.error(
                "failed to push system logs to database: ",
                resp.data,
            );
            return;
        }

        this.logList = [];
    };

    getAllSysLogs = async () => {
        return await this.databaseService.getAllSysLogs();
    };

    update = async () => {
        await this.databaseWriter.execute();
    };
}
