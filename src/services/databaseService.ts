import { envConfig } from "../config/envConfig";
import {
    APICallReturn,
    AppStatusLog,
    BlockNumber,
    HeartBeat,
    LastBalanceScanTime,
    NFTTrack,
    NFTTrackMap,
    SystemLog,
} from "../types/types";
import { NFTLog } from "../types/types";
import {
    BulkWriteResult,
    Collection,
    Db,
    DeleteResult,
    FindCursor,
    InsertManyResult,
    InsertOneResult,
    MongoClient,
    UpdateResult,
    WithId,
} from "mongodb";
import { apiCallWrapper } from "../utils/utils";
import { SystemLogService } from "./systemLogService";

export class DatabaseService {
    client: MongoClient;
    database: Db;
    collection: {
        processedBlocks: Collection<BlockNumber>;
        systemLogs: Collection<SystemLog>;
        heartBeat: Collection<HeartBeat>;
    };

    setup = async () => {
        await this.setupDatabase();
    };

    startTransaction = () => {
        const session = this.client.startSession();

        session.startTransaction({
            readConcern: { level: "snapshot" },
            writeConcern: { w: "majority" },
        });

        return () =>
            apiCallWrapper<any, any>(session.commitTransaction(), (res) => res);
    };

    saveProcessedBlocks = async (
        blockList: BlockNumber[],
    ): Promise<APICallReturn<number>> => {
        const options = { ordered: true };
        const result = await apiCallWrapper<
            InsertManyResult<BlockNumber>,
            number
        >(
            this.collection.processedBlocks.insertMany(blockList, options),
            (res) => (res.acknowledged ? res.insertedCount : 0),
        );

        return result;
    };

    getMaxProcessedBlock = async (): Promise<
        APICallReturn<BlockNumber | null>
    > => {
        const cursor = this.collection.processedBlocks
            .find({})
            .sort({ blockNumber: -1 });

        const result = await apiCallWrapper<WithId<BlockNumber>, BlockNumber>(
            cursor.next(),
            (res) => res,
        );

        return result;
    };

    insertSystemLogs = async (
        systemLogList: SystemLog[],
    ): Promise<APICallReturn<number>> => {
        const options = { ordered: true };
        const result = await apiCallWrapper<
            InsertManyResult<SystemLog>,
            number
        >(
            this.collection.systemLogs.insertMany(systemLogList, options),
            (res) => (res.acknowledged ? res.insertedCount : 0),
        );

        return result;
    };

    getAllSysLogs = async (): Promise<APICallReturn<SystemLog[]>> => {
        const cursor = this.collection.systemLogs
            .find<SystemLog>({})
            .sort({ timestamp: 1 });

        const result = await apiCallWrapper<SystemLog[], SystemLog[]>(
            cursor.toArray(),
            (res) => res,
        );

        return result;
    };

    updateHeartBeat = async (
        heartBeat: HeartBeat,
    ): Promise<APICallReturn<string>> => {
        const result = await apiCallWrapper<UpdateResult<HeartBeat>, string>(
            this.collection.heartBeat.updateOne(
                {},
                {
                    $set: heartBeat,
                },
                {
                    upsert: true,
                },
            ),
            (res) => "",
        );

        return result;
    };

    getHeartBeat = async (): Promise<APICallReturn<HeartBeat>> => {
        const result = await apiCallWrapper<WithId<HeartBeat>, HeartBeat>(
            this.collection.heartBeat.findOne({}),
            (res) => res,
        );

        return result;
    };

    setupDatabase = async () => {
        const { MONGODB_URL, MONGODB_DBNAME } = envConfig;
        const { BLOCK_TIME, MAX_BLOCK_DIFF } = envConfig.SYSTEM_ENV;

        const client = await MongoClient.connect(MONGODB_URL);
        console.log(`created database client: ${MONGODB_URL}`);

        const database = client.db(MONGODB_DBNAME);
        console.log(`connected to database: ${MONGODB_DBNAME}`);

        const processedBlocks =
            database.collection<BlockNumber>("processedBlocks");

        {
            const indexExists = await processedBlocks.indexExists(
                "createTime_1",
            );
            console.log("processedblocks index: ", indexExists);

            if (!indexExists) {
                await processedBlocks.createIndex(
                    { createTime: 1 },
                    {
                        expireAfterSeconds:
                            BLOCK_TIME * MAX_BLOCK_DIFF + 60 * 60 * 24,
                    },
                );
            }
        }

        const systemLogs = database.collection<SystemLog>("systemLogs");

        const lastBalanceScanTime = database.collection<LastBalanceScanTime>(
            "lastBalanceScanTime",
        );

        const heartBeat = database.collection<HeartBeat>("heartBeat");

        this.collection = {
            processedBlocks,
            systemLogs,
            heartBeat,
        };
        this.client = client;
        this.database = database;

        console.log(`database setup done`);
    };
}
