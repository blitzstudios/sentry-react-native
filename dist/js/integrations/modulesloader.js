import { __awaiter } from "tslib";
import { NATIVE } from '../wrapper';
/** Loads runtime JS modules from prepared file. */
export class ModulesLoader {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = ModulesLoader.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce(addGlobalEventProcessor) {
        let isSetup = false;
        let modules;
        addGlobalEventProcessor((event) => __awaiter(this, void 0, void 0, function* () {
            if (!isSetup) {
                modules = yield NATIVE.fetchModules();
                isSetup = true;
            }
            if (modules) {
                event.modules = Object.assign(Object.assign({}, event.modules), modules);
            }
            return event;
        }));
    }
}
/**
 * @inheritDoc
 */
ModulesLoader.id = 'ModulesLoader';
//# sourceMappingURL=modulesloader.js.map