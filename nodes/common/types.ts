export type WorkerInput<T> = {
    type: "apply";
    uniforms: T;
};

export type WorkerOutput<T> =
    | {
        type: "ready";
    }
    | {
        type: "complete";
        output: T;
    }
    | {
        type: "error";
        message: string;
    };

export type WorkerScope<TInput, TOutput> = {
    addEventListener(
        type: "message",
        listener: (event: MessageEvent<WorkerInput<TInput>>) => void,
    ): void;
    postMessage(message: WorkerOutput<TOutput>, transfer?: Transferable[]): void;
};