import { APICallReturn } from "../types/types";
import STKETHKeyEncrypter from "@decloudlabs/stk-v2/lib/services/STKSecretKeyEncrypter";
import * as sigUtil from "@metamask/eth-sig-util";
import {
    SignTypedDataVersion,
    signTypedData,
    EthEncryptedData,
} from "@metamask/eth-sig-util";
import { ethers } from "ethers";
import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

export default class STKSecretKeyEncrypter extends STKETHKeyEncrypter {
    secretKey: string;
    signer: ethers.Wallet;

    constructor(secretKey: string, signer: ethers.Wallet) {
        super(secretKey);
        this.secretKey = secretKey;
        this.signer = signer;
    }
    async encrypt(data: string): Promise<APICallReturn<Uint8Array>> {
        const publicKey = await this.getEncryptionPublicKey();
        if (publicKey.success) {
            const result = sigUtil.encrypt({
                publicKey: publicKey.data,
                data: data,
                version: "x25519-xsalsa20-poly1305",
            });

            return {
                success: true,
                data: Uint8Array.from(
                    Buffer.from(JSON.stringify(result), "utf8"),
                ),
            };
        } else {
            return {
                success: false,
                data: Error("Failed to get encryption public key"),
            };
        }
    }

    async encryptWithPublicKey(
        data: string,
        publicKey: string,
    ): Promise<APICallReturn<Uint8Array>> {
        const result = await sigUtil.encrypt({
            publicKey: publicKey,
            data: data,
            version: "x25519-xsalsa20-poly1305",
        });

        return {
            success: true,
            data: Uint8Array.from(Buffer.from(JSON.stringify(result), "utf8")),
        };
    }

    async getEncryptionPublicKey(): Promise<APICallReturn<string>> {
        try {
            const skBuff = new Uint8Array(Buffer.from(this.secretKey, "hex"));
            const keyPair = nacl.box.keyPair.fromSecretKey(skBuff);

            return {
                success: true,
                data: naclUtil.encodeBase64(keyPair.publicKey),
            };
        } catch (e: any) {
            return {
                success: false,
                data: e,
            };
        }
    }
    async decrypt(data: Uint8Array): Promise<APICallReturn<string>> {
        try {
            const dec = new TextDecoder("utf-8");
            const encryptedAppString = dec.decode(data);

            let ethEncryptedData: EthEncryptedData =
                JSON.parse(encryptedAppString);

            const result = sigUtil.decrypt({
                encryptedData: ethEncryptedData,
                privateKey: this.secretKey,
            });
            return {
                success: true,
                data: result,
            };
        } catch (e: any) {
            return {
                success: false,
                data: e,
            };
        }
    }
    async sign(
        newTypedMessage: sigUtil.TypedMessage<sigUtil.MessageTypes>,
    ): Promise<APICallReturn<{ signature: string }>> {
        try {
            const signature = await this.signer.signMessage(
                JSON.stringify(newTypedMessage),
            );
            // const signature = signTypedData({
            //     privateKey: Buffer.from(this.secretKey, "hex"),
            //     data: newTypedMessage,
            //     version: SignTypedDataVersion.V4,
            // });

            return {
                success: true,
                data: { signature },
            };
        } catch (err: any) {
            return {
                success: false,
                data: err,
            };
        }
    }
}
