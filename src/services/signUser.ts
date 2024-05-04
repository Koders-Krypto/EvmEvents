import {
    TypedMessage,
    MessageTypes,
    SignTypedDataVersion,
    signTypedData,
} from "@metamask/eth-sig-util";
import { v4 } from "uuid";

const typedMessage = (
    timestamp: number,
    chainId: number,
): TypedMessage<MessageTypes> => {
    return {
        types: {
            EIP712Domain: [
                {
                    name: "name",
                    type: "string",
                },
                {
                    name: "version",
                    type: "string",
                },
                {
                    name: "chainId",
                    type: "uint256",
                },
            ],
            Auth: [
                {
                    name: "nonce",
                    type: "string",
                },
                {
                    name: "timestamp",
                    type: "uint256",
                },
            ],
        },
        domain: {
            name: "Stackos-dapp",
            version: "2",
            chainId,
        },
        primaryType: "Auth",
        message: {
            nonce: v4(),
            timestamp,
        },
    };
};

export async function signUser(provider, privateKey: string) {
    const { chainId } = await provider.getNetwork();
    const newTypedMessage = typedMessage(Date.now(), Number(chainId));
    try {
        const signature = signTypedData({
            privateKey: Buffer.from(privateKey, "hex"),
            data: newTypedMessage,
            version: SignTypedDataVersion.V4,
        });

        return {
            signature,
            message: newTypedMessage,
        };
    } catch (err) {
        //   await postLogs.error({
        //     ...loggingInfo,
        //     message: `Error : ${err.message}`,
        //   });
        console.error("signUserError: ", err);
    }
}
