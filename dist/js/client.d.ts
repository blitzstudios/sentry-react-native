import { BaseClient } from '@sentry/core';
import { Breadcrumb } from '@sentry/types';
import { ReactNativeBackend } from './backend';
import { ReactNativeOptions } from './options';
/**
 * The Sentry React Native SDK Client.
 *
 * @see ReactNativeOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export declare class ReactNativeClient extends BaseClient<ReactNativeBackend, ReactNativeOptions> {
    /**
     * Creates a new React Native SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options: ReactNativeOptions);
    /**
     * If native client is available it will trigger a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash(): void;
    /**
     * Returns whether or not the last run resulted in a crash.
     */
    didCrashLastLaunch(): PromiseLike<boolean>;
    /**
     *
     * @returns The last 100 breadcrumbs tracked on device.
     */
    getBreadcrumbs(): PromiseLike<Breadcrumb[]>;
    /**
     * Clears all current breadcrumbs on the native client.
     */
    clearBreadcrumbs(): void;
    /**
     * @inheritDoc
     */
    close(): PromiseLike<boolean>;
}
//# sourceMappingURL=client.d.ts.map