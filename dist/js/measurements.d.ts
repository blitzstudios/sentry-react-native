import { Hub } from '@sentry/core';
import { Transaction } from '@sentry/tracing';
import { CustomSamplingContext, TransactionContext } from '@sentry/types';
/**
 * Adds React Native's extensions. Needs to be called after @sentry/tracing's extension methods are added
 */
export declare function _addTracingExtensions(): void;
export declare type StartTransactionFunction = (this: Hub, transactionContext: TransactionContext, customSamplingContext?: CustomSamplingContext) => Transaction;
//# sourceMappingURL=measurements.d.ts.map