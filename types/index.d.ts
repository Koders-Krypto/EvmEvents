declare module '@decloudlabs/event-listener-service' {
	export function setupListenerService(
		callFunc: (nftEvent: NFTEvent) => Promise<APICallReturn<number[]>>
	): Promise<any>;
}
