import { EXECUTION_QUEUE_SLEEP_TIME } from "../constant/constant";
import { APICallReturn } from "../types/types";
import Mutex from "./mutex";
import { sleep } from "./utils";

interface Executable {
    status: "idle" | "running" | "success" | "fail";
    message?: string;
}

export class MutexExecution<P, O, E = Error> {
    curCount: number;
    maxCapacity: number;
    mutex: Mutex;
    executeFunc: (param: P) => Promise<APICallReturn<O, E>>;

    constructor(
        maxCapacity: number,
        executeFunc: (param: P) => Promise<APICallReturn<O, E>>,
    ) {
        this.maxCapacity = maxCapacity;
        this.curCount = 0;
        this.mutex = new Mutex();
        this.executeFunc = executeFunc;
    }

    async execute(param: P): Promise<APICallReturn<O, E>> {
        while (true) {
            await this.mutex.lock();
            if (this.curCount < this.maxCapacity) {
                this.curCount += 1;
                await this.mutex.release();
                break;
            }
            await this.mutex.release();

            await sleep(EXECUTION_QUEUE_SLEEP_TIME);
        }

        let retVal: APICallReturn<O, E>;
        try {
            retVal = await this.executeFunc(param);
        } catch (err) {
            const error: E = err;
            retVal = {
                success: false,
                data: error,
            };
        }

        await this.mutex.lock();
        this.curCount -= 1;
        await this.mutex.release();

        return retVal;
    }

    setMaxCapacity = (maxCapacity: number) => {
        this.maxCapacity = maxCapacity;
    };
}
