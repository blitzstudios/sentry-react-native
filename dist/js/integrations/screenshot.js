import { resolvedSyncPromise } from '@sentry/utils';
import { NATIVE } from '../wrapper';
/** Adds screenshots to error events */
export class Screenshot {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = Screenshot.id;
    }
    /**
     * If enabled attaches a screenshot to the event hint.
     */
    static attachScreenshotToEventHint(hint, { attachScreenshot }) {
        if (!attachScreenshot) {
            return resolvedSyncPromise(hint);
        }
        return NATIVE.captureScreenshot()
            .then((screenshots) => {
            if (screenshots !== null && screenshots.length > 0) {
                hint.attachments = [
                    ...screenshots,
                    ...((hint === null || hint === void 0 ? void 0 : hint.attachments) || []),
                ];
            }
            return hint;
        });
    }
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setupOnce() { }
}
/**
 * @inheritDoc
 */
Screenshot.id = 'Screenshot';
//# sourceMappingURL=screenshot.js.map