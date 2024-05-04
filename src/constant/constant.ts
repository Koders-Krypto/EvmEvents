export const NFT_EVENT_ID_MAP = {
    CREATE_APP: 0,
    UPDATE_APP: 1,
    DELETE_APP: 2,
    BALANCE_ADDED: 3,
    BALANCE_WITHDRAWN: 4,
    CRON_TIMEOUT: 5,
    UPDATE_BATCH: 6,
};

export const EXECUTION_QUEUE_SLEEP_TIME = 1000 / 60;

export const SERVER_DOWN_CODES = [503, 522, 504];

// Constants
// resource types values
export const RESOURCE_TYPE_CONFIGURATION = {
    CPU_Standard: {
        CPU: 100,
        Memory: 100,
    },
    CPU_Intensive: {
        CPU: 200,
        Memory: 200,
    },
    GPU_Standard: {
        CPU: 500,
        Memory: 500,
    },
};

// resource types
export const RESOURCE_TYPE_ID_MAP = {
    0: "CPU_Standard",
    1: "CPU_Intensive",
    2: "GPU_Standard",
    3: "Storage",
    4: "Bandwidth",
};

// resource type categories
export const RESOURCE_TYPE_CATEGORIES = {
    cpuInstance: [0, 1, 2],
    storageInstance: [3],
    bandwidthInstance: [4],
};
