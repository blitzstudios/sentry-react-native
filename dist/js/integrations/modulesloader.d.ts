import { EventProcessor, Integration } from '@sentry/types';
/** Loads runtime JS modules from prepared file. */
export declare class ModulesLoader implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    /**
     * @inheritDoc
     */
    setupOnce(addGlobalEventProcessor: (e: EventProcessor) => void): void;
}
//# sourceMappingURL=modulesloader.d.ts.map