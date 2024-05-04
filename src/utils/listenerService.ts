export interface ListenerService {
    createListeners: () => Promise<void>;
    startListeners: () => Promise<void>;
}
