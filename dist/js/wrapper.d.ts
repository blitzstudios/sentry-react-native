import { Breadcrumb, Envelope, EnvelopeItem, Event, Package, SeverityLevel, User } from '@sentry/types';
import { Platform } from 'react-native';
import { NativeAppStartResponse, NativeDeviceContextsResponse, NativeFramesResponse, NativeReleaseResponse, SentryNativeBridgeModule } from './definitions';
import { ReactNativeOptions } from './options';
export interface Screenshot {
    data: Uint8Array;
    contentType: string;
    filename: string;
}
interface SentryNativeWrapper {
    enableNative: boolean;
    nativeIsReady: boolean;
    platform: typeof Platform.OS;
    _NativeClientError: Error;
    _DisabledNativeError: Error;
    _processItem(envelopeItem: EnvelopeItem): EnvelopeItem;
    _processLevels(event: Event): Event;
    _processLevel(level: SeverityLevel): SeverityLevel;
    _serializeObject(data: {
        [key: string]: unknown;
    }): {
        [key: string]: string;
    };
    _isModuleLoaded(module: SentryNativeBridgeModule | undefined): module is SentryNativeBridgeModule;
    _getBreadcrumbs(event: Event): Breadcrumb[] | undefined;
    isNativeTransportAvailable(): boolean;
    initNativeSdk(options: ReactNativeOptions): PromiseLike<boolean>;
    didCrashLastLaunch(): PromiseLike<boolean>;
    closeNativeSdk(): PromiseLike<void>;
    sendEnvelope(envelope: Envelope): Promise<void>;
    captureScreenshot(): Promise<Screenshot[] | null>;
    fetchNativeRelease(): PromiseLike<NativeReleaseResponse>;
    fetchNativeDeviceContexts(): PromiseLike<NativeDeviceContextsResponse>;
    fetchNativeAppStart(): PromiseLike<NativeAppStartResponse | null>;
    fetchNativeFrames(): PromiseLike<NativeFramesResponse | null>;
    fetchNativeSdkInfo(): PromiseLike<Package | null>;
    disableNativeFramesTracking(): void;
    enableNativeFramesTracking(): void;
    addBreadcrumb(breadcrumb: Breadcrumb): void;
    setContext(key: string, context: {
        [key: string]: unknown;
    } | null): void;
    clearBreadcrumbs(): void;
    setExtra(key: string, extra: unknown): void;
    setUser(user: User | null): void;
    setTag(key: string, value: string): void;
    nativeCrash(): void;
    fetchModules(): Promise<Record<string, string> | null>;
}
/**
 * Our internal interface for calling native functions
 */
export declare const NATIVE: SentryNativeWrapper;
export {};
//# sourceMappingURL=wrapper.d.ts.map