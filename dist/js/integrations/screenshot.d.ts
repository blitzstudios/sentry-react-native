import { EventHint, Integration } from '@sentry/types';
/** Adds screenshots to error events */
export declare class Screenshot implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * If enabled attaches a screenshot to the event hint.
     */
    static attachScreenshotToEventHint(hint: EventHint, { attachScreenshot }: {
        attachScreenshot?: boolean;
    }): PromiseLike<EventHint>;
    /**
     * @inheritDoc
     */
    setupOnce(): void;
}
//# sourceMappingURL=screenshot.d.ts.map