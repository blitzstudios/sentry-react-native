import { __awaiter, __rest } from "tslib";
import { logger, normalize, SentryError } from '@sentry/utils';
import { NativeModules, Platform } from 'react-native';
import { isHardCrash } from './misc';
import { utf8ToBytes } from './vendor';
const RNSentry = NativeModules.RNSentry;
/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
    fetchModules() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const raw = yield RNSentry.fetchModules();
            if (raw) {
                return JSON.parse(raw);
            }
            return null;
        });
    },
    /**
     * Sending the envelope over the bridge to native
     * @param envelope Envelope
     */
    sendEnvelope(envelope) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                logger.warn('Event was skipped as native SDK is not enabled.');
                return;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            const [EOL] = utf8ToBytes('\n');
            const [envelopeHeader, envelopeItems] = envelope;
            const headerString = JSON.stringify(envelopeHeader);
            let envelopeBytes = utf8ToBytes(headerString);
            envelopeBytes.push(EOL);
            let hardCrashed = false;
            for (const rawItem of envelopeItems) {
                const [itemHeader, itemPayload] = this._processItem(rawItem);
                let bytesContentType;
                let bytesPayload = [];
                if (typeof itemPayload === 'string') {
                    bytesContentType = 'text/plain';
                    bytesPayload = utf8ToBytes(itemPayload);
                }
                else if (itemPayload instanceof Uint8Array) {
                    bytesContentType = typeof itemHeader.content_type === 'string'
                        ? itemHeader.content_type
                        : 'application/octet-stream';
                    bytesPayload = [...itemPayload];
                }
                else {
                    bytesContentType = 'application/json';
                    bytesPayload = utf8ToBytes(JSON.stringify(itemPayload));
                    if (!hardCrashed) {
                        hardCrashed = isHardCrash(itemPayload);
                    }
                }
                // Content type is not inside BaseEnvelopeItemHeaders.
                itemHeader.content_type = bytesContentType;
                itemHeader.length = bytesPayload.length;
                const serializedItemHeader = JSON.stringify(itemHeader);
                envelopeBytes.push(...utf8ToBytes(serializedItemHeader));
                envelopeBytes.push(EOL);
                envelopeBytes = envelopeBytes.concat(bytesPayload);
                envelopeBytes.push(EOL);
            }
            yield RNSentry.captureEnvelope(envelopeBytes, { store: hardCrashed });
        });
    },
    /**
     * Starts native with the provided options.
     * @param options ReactNativeOptions
     */
    initNativeSdk(originalOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign({ enableNative: true, autoInitializeNativeSdk: true }, originalOptions);
            if (!options.enableNative) {
                if (options.enableNativeNagger) {
                    logger.warn('Note: Native Sentry SDK is disabled.');
                }
                this.enableNative = false;
                return false;
            }
            if (!options.autoInitializeNativeSdk) {
                if (options.enableNativeNagger) {
                    logger.warn('Note: Native Sentry SDK was not initialized automatically, you will need to initialize it manually. If you wish to disable the native SDK and get rid of this warning, pass enableNative: false');
                }
                return false;
            }
            if (!options.dsn) {
                logger.warn('Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initalized.');
                return false;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            // filter out all the options that would crash native.
            /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            const { beforeSend, beforeBreadcrumb, integrations } = options, filteredOptions = __rest(options, ["beforeSend", "beforeBreadcrumb", "integrations"]);
            /* eslint-enable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
            const nativeIsReady = yield RNSentry.initNativeSdk(filteredOptions);
            this.nativeIsReady = nativeIsReady;
            return nativeIsReady;
        });
    },
    /**
     * Fetches the release from native
     */
    fetchNativeRelease() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeRelease();
        });
    },
    /**
     * Fetches the Sdk info for the native sdk.
     * NOTE: Only available on iOS.
     */
    fetchNativeSdkInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            if (this.platform !== 'ios') {
                return null;
            }
            return RNSentry.fetchNativeSdkInfo();
        });
    },
    /**
     * Fetches the device contexts. Not used on Android.
     */
    fetchNativeDeviceContexts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            if (this.platform !== 'ios') {
                // Only ios uses deviceContexts, return an empty object.
                return {};
            }
            return RNSentry.fetchNativeDeviceContexts();
        });
    },
    fetchNativeAppStart() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeAppStart();
        });
    },
    fetchNativeFrames() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            return RNSentry.fetchNativeFrames();
        });
    },
    /**
     * Triggers a native crash.
     * Use this only for testing purposes.
     */
    nativeCrash() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.crash();
    },
    /**
     * Sets the user in the native scope.
     * Passing null clears the user.
     */
    setUser(user) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        // separate and serialize all non-default user keys.
        let userKeys = null;
        let userDataKeys = null;
        if (user) {
            const { id, ip_address, email, username, segment } = user, otherKeys = __rest(user, ["id", "ip_address", "email", "username", "segment"]);
            const requiredUser = {
                id,
                ip_address,
                email,
                username,
                segment,
            };
            userKeys = this._serializeObject(requiredUser);
            userDataKeys = this._serializeObject(otherKeys);
        }
        RNSentry.setUser(userKeys, userDataKeys);
    },
    /**
     * Sets a tag in the native module.
     * @param key string
     * @param value string
     */
    setTag(key, value) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
        RNSentry.setTag(key, stringifiedValue);
    },
    /**
     * Sets an extra in the native scope, will stringify
     * extra value if it isn't already a string.
     * @param key string
     * @param extra any
     */
    setExtra(key, extra) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        // we stringify the extra as native only takes in strings.
        const stringifiedExtra = typeof extra === 'string' ? extra : JSON.stringify(extra);
        RNSentry.setExtra(key, stringifiedExtra);
    },
    /**
     * Adds breadcrumb to the native scope.
     * @param breadcrumb Breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.addBreadcrumb(Object.assign(Object.assign({}, breadcrumb), { 
            // Process and convert deprecated levels
            level: breadcrumb.level
                ? this._processLevel(breadcrumb.level)
                : undefined, data: breadcrumb.data
                ? normalize(breadcrumb.data)
                : undefined }));
    },
    /**
     * Clears breadcrumbs on the native scope.
     */
    clearBreadcrumbs() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.clearBreadcrumbs();
    },
    /**
     * Sets context on the native scope. Not implemented in Android yet.
     * @param key string
     * @param context key-value map
     */
    setContext(key, context) {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            throw this._NativeClientError;
        }
        RNSentry.setContext(key, context !== null ? normalize(context) : null);
    },
    /**
     * Closes the Native Layer SDK
     */
    closeNativeSdk() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                return;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                return;
            }
            return RNSentry.closeNativeSdk().then(() => {
                this.enableNative = false;
            });
        });
    },
    /**
     * Returns whether or not the last run resulted in a crash.
     */
    didCrashLastLaunch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                return false;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                return false;
            }
            const didCrashLastLaunch = yield RNSentry.didCrashLastLaunch();
            return didCrashLastLaunch;
        });
    },
    disableNativeFramesTracking() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return;
        }
        RNSentry.disableNativeFramesTracking();
    },
    enableNativeFramesTracking() {
        if (!this.enableNative) {
            return;
        }
        if (!this._isModuleLoaded(RNSentry)) {
            return;
        }
        RNSentry.enableNativeFramesTracking();
    },
    isNativeTransportAvailable() {
        return this.enableNative && this._isModuleLoaded(RNSentry);
    },
    captureScreenshot() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this._isModuleLoaded(RNSentry)) {
                throw this._NativeClientError;
            }
            try {
                const raw = yield RNSentry.captureScreenshot();
                return raw.map((item) => (Object.assign(Object.assign({}, item), { data: new Uint8Array(item.data) })));
            }
            catch (e) {
                logger.warn('Failed to capture screenshot', e);
                return null;
            }
        });
    },
    /**
     * Gets the event from envelopeItem and applies the level filter to the selected event.
     * @param data An envelope item containing the event.
     * @returns The event from envelopeItem or undefined.
     */
    _processItem(item) {
        const [itemHeader, itemPayload] = item;
        if (itemHeader.type == 'event' || itemHeader.type == 'transaction') {
            const event = this._processLevels(itemPayload);
            if (NATIVE.platform === 'android') {
                if ('message' in event) {
                    // @ts-ignore Android still uses the old message object, without this the serialization of events will break.
                    event.message = { message: event.message };
                }
                event.breadcrumbs = this._getBreadcrumbs(event);
            }
            return [itemHeader, event];
        }
        return item;
    },
    /**
     * Serializes all values of root-level keys into strings.
     * @param data key-value map.
     * @returns An object where all root-level values are strings.
     */
    _serializeObject(data) {
        const serialized = {};
        Object.keys(data).forEach((dataKey) => {
            const value = data[dataKey];
            serialized[dataKey] =
                typeof value === 'string' ? value : JSON.stringify(value);
        });
        return serialized;
    },
    /**
     * Convert js severity level in event.level and event.breadcrumbs to more widely supported levels.
     * @param event
     * @returns Event with more widely supported Severity level strings
     */
    _processLevels(event) {
        var _a;
        const processed = Object.assign(Object.assign({}, event), { level: event.level ? this._processLevel(event.level) : undefined, breadcrumbs: (_a = event.breadcrumbs) === null || _a === void 0 ? void 0 : _a.map((breadcrumb) => (Object.assign(Object.assign({}, breadcrumb), { level: breadcrumb.level
                    ? this._processLevel(breadcrumb.level)
                    : undefined }))) });
        return processed;
    },
    /**
     * Convert js severity level which has critical and log to more widely supported levels.
     * @param level
     * @returns More widely supported Severity level strings
     */
    _processLevel(level) {
        if (level == 'log') {
            return 'debug';
        }
        else if (level == 'critical') {
            return 'fatal';
        }
        return level;
    },
    /**
     * Checks whether the RNSentry module is loaded.
     */
    _isModuleLoaded(module) {
        return !!module;
    },
    _DisabledNativeError: new SentryError('Native is disabled'),
    _NativeClientError: new SentryError("Native Client is not available, can't start on native."),
    /**
     * Get breadcrumbs (removes breadcrumbs from handled exceptions on Android)
     *
     * We do this to avoid duplicate breadcrumbs on Android as sentry-android applies the breadcrumbs
     * from the native scope onto every envelope sent through it. This scope will contain the breadcrumbs
     * sent through the scope sync feature. This causes duplicate breadcrumbs.
     * We then remove the breadcrumbs in all cases but if it is handled == false,
     * this is a signal that the app would crash and android would lose the breadcrumbs by the time the app is restarted to read
     * the envelope.
     */
    _getBreadcrumbs(event) {
        let breadcrumbs = event.breadcrumbs;
        const hardCrashed = isHardCrash(event);
        if (NATIVE.platform === 'android'
            && event.breadcrumbs
            && !hardCrashed) {
            breadcrumbs = [];
        }
        return breadcrumbs;
    },
    enableNative: true,
    nativeIsReady: false,
    platform: Platform.OS,
};
//# sourceMappingURL=wrapper.js.map