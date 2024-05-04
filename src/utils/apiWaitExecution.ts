import { APICallReturn } from "../types/types";
import { MutexExecution } from "./mutexExecution";
import { sleep } from "./utils";

const SERVER_DOWN_CODES = [503, 522, 504];
const RETRY_WAIT_TIME = 500;
const MAX_RETRY_COUNT = 5;

export class APIRetryExecution<P, O, E = Error> extends MutexExecution<
    P,
    O,
    E
> {
    tryTimes: number;
    constructor(
        maxCapacity: number,
        executeFunc: (param: P) => Promise<APICallReturn<O, E>>,
        tryTimes: number = MAX_RETRY_COUNT,
    ) {
        super(maxCapacity, executeFunc);
        this.tryTimes = tryTimes;
    }

    async execute(param: P): Promise<APICallReturn<O, E>> {
        let retryCount = 0;
        while (true) {
            const resp = await super.execute(param);

            if (resp.success) {
                return resp;
            }
            if (!resp.statusCode) return resp;

            if (!SERVER_DOWN_CODES.indexOf(resp.statusCode)) return resp;

            retryCount++;

            if (retryCount == this.tryTimes && resp.success == false)
                return {
                    success: false,
                    data: resp.data,
                };

            await sleep(RETRY_WAIT_TIME);
        }
    }
}
