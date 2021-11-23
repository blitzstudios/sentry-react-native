import { Integration } from "@sentry/types";
/** ReactNativeErrorHandlers Options */
interface ReactNativeErrorHandlersOptions {
    onerror: boolean;
    onunhandledrejection: boolean;
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
    constructor(options?: ReactNativeErrorHandlersOptions);
    /**
     * @inheritDoc
     */
    setupOnce(): void;
    /**
     * Handle Promises
     */
    private _handleUnhandledRejections;
    /**
     * Gets the promise rejection handlers, tries to get React Native's default one but otherwise will default to console.logging unhandled rejections.
     */
    private _getPromiseRejectionTrackingOptions;
    /**
     * Checks if the promise is the same one or not, if not it will warn the user
     */
    private _checkPromiseVersion;
    /**
     * Handle errors
     */
    private _handleOnError;
}
export {};
//# sourceMappingURL=reactnativeerrorhandlers.d.ts.map