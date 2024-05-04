// export class AsyncExecution {
//     funcToRun: () => Promise<any>;

//     constructor(duration: number, funcToRun: () => Promise<any>) {
//         this.funcToRun = funcToRun;
//     }

//     execute = async () => {
//         if (
//             this.lastInvokeTime.getTime() + this.duration >
//             new Date().getTime()
//         ) {
//             return;
//         }

//         this.lastInvokeTime = new Date();

//         await this.funcToRun();
//     };
// }
