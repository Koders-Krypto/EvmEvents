import { config } from "dotenv";

const DEFAULT_SYSTEM_ENV = {
    FIRST_RUN_BOOT_FLAG: false,
    BLOCK_TIME: 2,
    MAX_BLOCK_DIFF: 100000,

    SYSLOG_DB_UPLOAD_DURATION: 5000,
    PROCESSED_BLOCK_UPLOAD_DURATION: 1000,
    HEARTBEAT_DURATION: 15 * 1000,
    UPDATE_DURATION: 1000 / 10,

    LISTSERV_BLOCKADD_TIME: 20000,
};

export class ENVConfig {
    CLUSTER_OPERATOR_ADDRESS: string;
    CLUSTER_PRIVATE_KEY: string;

    JSON_RPC_URL: string;
    SOCKET_RPC_URL: string;

    MONGODB_URL: string;
    MONGODB_DBNAME: string;

    CONTRACT_ADDRESSES: {
        OrderPayment: string;
    };

    SYSTEM_ENV: {
        FIRST_RUN_BOOT_FLAG: boolean;
        BLOCK_TIME: number;
        MAX_BLOCK_DIFF: number;

        SYSLOG_DB_UPLOAD_DURATION: number;
        PROCESSED_BLOCK_UPLOAD_DURATION: number;
        HEARTBEAT_DURATION: number;
        UPDATE_DURATION: number;

        LISTSERV_BLOCKADD_TIME: number;
    };

    setSystemENV = (name: string, value: any) => {
        this.SYSTEM_ENV[name] = value;
    };

    setupENV = () => {
        config();
        this.CONTRACT_ADDRESSES = {
            OrderPayment: process.env.ORDER_PAYMENT_CONTRACT_ADDRESS,
        };

        this.CLUSTER_OPERATOR_ADDRESS = process.env.CLUSTER_OPERATOR_OP_ADDRESS;

        this.CLUSTER_PRIVATE_KEY = process.env.CLUSTER_OPERATOR_PRIVATE_KEY;
        // this.CLUSTER_UMBRAL_SECRET_KEY = libUtils.convertIntoUmbralSecretKey(
        //     Array.from(
        //         Buffer.from(process.env.CLUSTER_OPERATOR_SECRET_KEY, "hex"),
        //     ),
        // );

        this.JSON_RPC_URL = process.env.JSON_RPC_URL;
        this.SOCKET_RPC_URL = process.env.SOCKET_RPC_URL;

        this.MONGODB_URL = process.env.MONGODB_URL;
        this.MONGODB_DBNAME = process.env.MONGODB_DBNAME;

        this.SYSTEM_ENV = {
            ...DEFAULT_SYSTEM_ENV,
        };
    };
}

export const envConfig: ENVConfig = new ENVConfig();
