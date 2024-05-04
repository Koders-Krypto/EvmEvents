export interface COService {
    setup: () => Promise<void>;

    update: () => Promise<void>;
}
