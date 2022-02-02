import { Integration } from "@sentry/types";
/** ReactNativeErrorHandlers Options */
interface ReactNativeErrorHandlersOptions {
    onerror: boolean;
    onunhandledrejection: boolean;
    patchGlobalPromise: boolean;
}
/** ReactNativeErrorHandlers Integration */
export declare class ReactNativeErrorHandlers implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /** ReactNativeOptions */
    private readonly _options;
    /** Constructor */
    constructor(options?: Partial<ReactNativeErrorHandlersOptions>);
    /**
     * @inheritDoc
     */
    setupOnce(): void;
    /**
     * Handle Promises
     */
    private _handleUnhandledRejections;
    /**
     * Polyfill the global promise instance with one we can be sure that we can attach the tracking to.
     *
     * In newer RN versions >=0.63, the global promise is not the same reference as the one imported from the promise library.
     * This is due to a version mismatch between promise versions.
     * Originally we tried a solution where we would have you put a package resolution to ensure the promise instances match. However,
     * - Using a package resolution requires the you to manually troubleshoot.
     * - The package resolution fix no longer works with 0.67 on iOS Hermes.
     */
    private _polyfillPromise;
    /**
     * Attach the unhandled rejection handler
     */
    private _attachUnhandledRejectionHandler;
    /**
     * Checks if the promise is the same one or not, if not it will warn the user
     */
    private _checkPromiseAndWarn;
    /**
     * Handle errors
     */
    private _handleOnError;
}
export {};
//# sourceMappingURL=reactnativeerrorhandlers.d.ts.map