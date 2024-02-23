import { BaseClient } from '@sentry/core';
import { ReactNativeBackend } from './backend';
import { NATIVE } from './wrapper';
/**
 * The Sentry React Native SDK Client.
 *
 * @see ReactNativeOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class ReactNativeClient extends BaseClient {
    /**
     * Creates a new React Native SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options) {
        super(ReactNativeBackend, options);
    }
    /**
     * If native client is available it will trigger a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash() {
        this._getBackend().nativeCrash();
    }
    /**
     * Returns whether or not the last run resulted in a crash.
     */
    didCrashLastLaunch() {
        return NATIVE.didCrashLastLaunch().then((result) => result);
    }
    /**
     *
     * @returns The last 100 breadcrumbs tracked on device.
     */
    getBreadcrumbs() {
        return NATIVE.getBreadcrumbs().then((result) => result);
    }
    /**
     * Clears all current breadcrumbs on the native client.
     */
    clearBreadcrumbs() {
        NATIVE.clearBreadcrumbs();
    }
    /**
     * @inheritDoc
     */
    close() {
        // As super.close() flushes queued events, we wait for that to finish before closing the native SDK.
        return super.close().then((result) => {
            return NATIVE.closeNativeSdk().then(() => result);
        });
    }
}
//# sourceMappingURL=client.js.map