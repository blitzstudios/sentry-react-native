import { User } from '@sentry/types';
/** Requires all the keys defined on User interface to be present on an object */
export declare type RequiredKeysUser = {
    [P in keyof Required<User>]: User[P] | undefined;
};
//# sourceMappingURL=user.d.ts.map