import type { Exception } from '@sentry/browser';
import { defaultStackParser, eventFromException } from '@sentry/browser';
import type { Client, Event, EventHint } from '@sentry/core';
import { Platform } from 'react-native';

import { createReactNativeRewriteFrames } from '../../src/js/integrations/rewriteframes';
import { isExpo, isHermesEnabled } from '../../src/js/utils/environment';
import { mockFunction } from '../testutils';

jest.mock('../../src/js/utils/environment');
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

describe('RewriteFrames', () => {
  const HINT = {};
  const ATTACH_STACKTRACE = true;

  const exceptionFromError = async (options: {
    message: string;
    name: string;
    stack: string;
  }): Promise<Exception | undefined> => {
    const error = new Error(options.message);
    error.stack = options.stack;
    const event = await eventFromException(defaultStackParser, error, HINT, ATTACH_STACKTRACE);
    createReactNativeRewriteFrames().processEvent?.(event, {} as EventHint, {} as Client);
    const exception = event.exception?.values?.[0];
    return exception;
  };

  const processEvent = (event: Event): Event | undefined | null | PromiseLike<Event | null> => {
    return createReactNativeRewriteFrames().processEvent?.(event, {} as EventHint, {} as Client);
  };

  beforeEach(() => {
    mockFunction(isExpo).mockReturnValue(false);
    mockFunction(isHermesEnabled).mockReturnValue(false);
    jest.resetAllMocks();
  });

  it('should not change cocoa frames', async () => {
    const EXPECTED_SENTRY_COCOA_EXCEPTION = {
      type: 'Error',
      value: 'Objective-c error message.',
      stacktrace: {
        frames: [
          {
            platform: 'cocoa',
            package: 'CoreFoundation',
            function: '__exceptionPreprocess',
            instruction_addr: '0000000180437330',
          },
          {
            platform: 'cocoa',
            package: 'libobjc.A.dylib',
            function: 'objc_exception_throw',
            instruction_addr: '0000000180051274',
          },
          {
            platform: 'cocoa',
            package: 'RNTester',
            function: '-[RCTSampleTurboModule getObjectThrows:]',
            instruction_addr: '0000000103535900',
          },
        ],
      },
    };

    const SENTRY_COCOA_EXCEPTION_EVENT: Event = {
      exception: {
        values: [JSON.parse(JSON.stringify(EXPECTED_SENTRY_COCOA_EXCEPTION))],
      },
    };

    const event = processEvent(SENTRY_COCOA_EXCEPTION_EVENT) as Event;
    expect(event.exception?.values?.[0]).toEqual(EXPECTED_SENTRY_COCOA_EXCEPTION);
  });

  it('should not change jvm frames', async () => {
    const EXPECTED_SENTRY_JVM_EXCEPTION = {
      type: 'java.lang.RuntimeException',
      value: 'Java error message.',
      stacktrace: {
        frames: [
          {
            platform: 'java',
            module: 'com.example.modules.Crash',
            filename: 'Crash.kt',
            lineno: 10,
            function: 'getDataCrash',
          },
          {
            platform: 'java',
            module: 'com.facebook.jni.NativeRunnable',
            filename: 'NativeRunnable.java',
            lineno: 2,
            function: 'run',
          },
        ],
      },
    };

    const SENTRY_JVM_EXCEPTION_EVENT: Event = {
      exception: {
        values: [JSON.parse(JSON.stringify(EXPECTED_SENTRY_JVM_EXCEPTION))],
      },
    };

    const event = processEvent(SENTRY_JVM_EXCEPTION_EVENT) as Event;
    expect(event.exception?.values?.[0]).toEqual(EXPECTED_SENTRY_JVM_EXCEPTION);
  });

  it('should parse exceptions for react-native-v8', async () => {
    const REACT_NATIVE_V8_EXCEPTION = {
      message: 'Manually triggered crash to test Sentry reporting',
      name: 'Error',
      stack: `Error: Manually triggered crash to test Sentry reporting
          at Object.onPress(index.android.bundle:2342:3773)
          at s.touchableHandlePress(index.android.bundle:214:2048)
          at s._performSideEffectsForTransition(index.android.bundle:198:9608)
          at s._receiveSignal(index.android.bundle:198:8309)
          at s.touchableHandleResponderRelease(index.android.bundle:198:5615)
          at Object.y(index.android.bundle:93:571)
          at P(index.android.bundle:93:714)`,
    };
    const exception = await exceptionFromError(REACT_NATIVE_V8_EXCEPTION);

    expect(exception).toEqual({
      value: 'Manually triggered crash to test Sentry reporting',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          {
            filename: 'app:///index.android.bundle',
            function: 'P',
            lineno: 93,
            colno: 714,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'Object.y',
            lineno: 93,
            colno: 571,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 's.touchableHandleResponderRelease',
            lineno: 198,
            colno: 5615,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 's._receiveSignal',
            lineno: 198,
            colno: 8309,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 's._performSideEffectsForTransition',
            lineno: 198,
            colno: 9608,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 's.touchableHandlePress',
            lineno: 214,
            colno: 2048,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'Object.onPress',
            lineno: 2342,
            colno: 3773,
            in_app: true,
          },
        ],
      },
    });
  });

  it('should parse exceptions for react-native Expo bundles on ios', async () => {
    mockFunction(isExpo).mockReturnValue(true);
    Platform.OS = 'ios';

    const REACT_NATIVE_EXPO_EXCEPTION = {
      message: 'Test Error Expo',
      name: 'Error',
      stack: `onPress@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:595:658
          value@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:221:7656
          onResponderRelease@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:221:5666
          p@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:96:385
          forEach@[native code]`,
    };
    const exception = await exceptionFromError(REACT_NATIVE_EXPO_EXCEPTION);

    expect(exception).toEqual({
      value: 'Test Error Expo',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          { filename: '[native code]', function: 'forEach', in_app: true },
          {
            filename: 'app:///main.jsbundle',
            function: 'p',
            lineno: 96,
            colno: 385,
            in_app: true,
          },
          {
            filename: 'app:///main.jsbundle',
            function: 'onResponderRelease',
            lineno: 221,
            colno: 5666,
            in_app: true,
          },
          {
            filename: 'app:///main.jsbundle',
            function: 'value',
            lineno: 221,
            colno: 7656,
            in_app: true,
          },
          {
            filename: 'app:///main.jsbundle',
            function: 'onPress',
            lineno: 595,
            colno: 658,
            in_app: true,
          },
        ],
      },
    });
  });

  it('should parse exceptions for react-native Expo bundles on android', async () => {
    mockFunction(isExpo).mockReturnValue(true);
    Platform.OS = 'android';

    const REACT_NATIVE_EXPO_EXCEPTION = {
      message: 'Test Error Expo',
      name: 'Error',
      stack: `onPress@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:595:658
          value@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:221:7656
          onResponderRelease@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:221:5666
          p@/data/user/0/com.sentrytest/files/.expo-internal/bundle-613EDD44F3305B9D75D4679663900F2BCDDDC326F247CA3202A3A4219FD412D3:96:385
          forEach@[native code]`,
    };
    const exception = await exceptionFromError(REACT_NATIVE_EXPO_EXCEPTION);

    expect(exception).toEqual({
      value: 'Test Error Expo',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          { filename: '[native code]', function: 'forEach', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'p',
            lineno: 96,
            colno: 385,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'onResponderRelease',
            lineno: 221,
            colno: 5666,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 221,
            colno: 7656,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'onPress',
            lineno: 595,
            colno: 658,
            in_app: true,
          },
        ],
      },
    });
  });

  it('should parse React Native errors on Android', async () => {
    const ANDROID_REACT_NATIVE = {
      message: 'Error: test',
      name: 'Error',
      stack:
        'Error: test\n' +
        'at render(/home/username/sample-workspace/sampleapp.collect.react/src/components/GpsMonitorScene.js:78:24)\n' +
        'at _renderValidatedComponentWithoutOwnerOrContext(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1050:29)\n' +
        'at _renderValidatedComponent(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:1075:15)\n' +
        'at renderedElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:484:29)\n' +
        'at _currentElement(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js:346:40)\n' +
        'at child(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactReconciler.js:68:25)\n' +
        'at children(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/shared/stack/reconciler/ReactMultiChild.js:264:10)\n' +
        'at this(/home/username/sample-workspace/sampleapp.collect.react/node_modules/react-native/Libraries/Renderer/src/renderers/native/ReactNativeBaseComponent.js:74:41)\n',
    };
    const exception = await exceptionFromError(ANDROID_REACT_NATIVE);

    expect(exception).toEqual({
      value: 'Error: test',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          {
            filename: 'app:///ReactNativeBaseComponent.js',
            function: 'this',
            lineno: 74,
            colno: 41,
            in_app: true,
          },
          {
            filename: 'app:///ReactMultiChild.js',
            function: 'children',
            lineno: 264,
            colno: 10,
            in_app: true,
          },
          {
            filename: 'app:///ReactReconciler.js',
            function: 'child',
            lineno: 68,
            colno: 25,
            in_app: true,
          },
          {
            filename: 'app:///ReactCompositeComponent.js',
            function: '_currentElement',
            lineno: 346,
            colno: 40,
            in_app: true,
          },
          {
            filename: 'app:///ReactCompositeComponent.js',
            function: 'renderedElement',
            lineno: 484,
            colno: 29,
            in_app: true,
          },
          {
            filename: 'app:///ReactCompositeComponent.js',
            function: '_renderValidatedComponent',
            lineno: 1075,
            colno: 15,
            in_app: true,
          },
          {
            filename: 'app:///ReactCompositeComponent.js',
            function: '_renderValidatedComponentWithoutOwnerOrContext',
            lineno: 1050,
            colno: 29,
            in_app: true,
          },
          {
            filename: 'app:///GpsMonitorScene.js',
            function: 'render',
            lineno: 78,
            colno: 24,
            in_app: true,
          },
        ],
      },
    });
  });

  it('should parse React Native errors on Android Production', async () => {
    const ANDROID_REACT_NATIVE_PROD = {
      message: 'Error: test',
      name: 'Error',
      stack:
        'value@index.android.bundle:12:1917\n' +
        'onPress@index.android.bundle:12:2336\n' +
        'touchableHandlePress@index.android.bundle:258:1497\n' +
        '[native code]\n' +
        '_performSideEffectsForTransition@index.android.bundle:252:8508\n' +
        '[native code]\n' +
        '_receiveSignal@index.android.bundle:252:7291\n' +
        '[native code]\n' +
        'touchableHandleResponderRelease@index.android.bundle:252:4735\n' +
        '[native code]\n' +
        'u@index.android.bundle:79:142\n' +
        'invokeGuardedCallback@index.android.bundle:79:459\n' +
        'invokeGuardedCallbackAndCatchFirstError@index.android.bundle:79:580\n' +
        'c@index.android.bundle:95:365\n' +
        'a@index.android.bundle:95:567\n' +
        'v@index.android.bundle:146:501\n' +
        'g@index.android.bundle:146:604\n' +
        'forEach@[native code]\n' +
        'i@index.android.bundle:149:80\n' +
        'processEventQueue@index.android.bundle:146:1432\n' +
        's@index.android.bundle:157:88\n' +
        'handleTopLevel@index.android.bundle:157:174\n' +
        'index.android.bundle:156:572\n' +
        'a@index.android.bundle:93:276\n' +
        'c@index.android.bundle:93:60\n' +
        'perform@index.android.bundle:177:596\n' +
        'batchedUpdates@index.android.bundle:188:464\n' +
        'i@index.android.bundle:176:358\n' +
        'i@index.android.bundle:93:90\n' +
        'u@index.android.bundle:93:150\n' +
        '_receiveRootNodeIDEvent@index.android.bundle:156:544\n' +
        'receiveTouches@index.android.bundle:156:918\n' +
        'value@index.android.bundle:29:3016\n' +
        'index.android.bundle:29:955\n' +
        'value@index.android.bundle:29:2417\n' +
        'value@index.android.bundle:29:927\n' +
        '[native code]',
    };
    const exception = await exceptionFromError(ANDROID_REACT_NATIVE_PROD);

    expect(exception).toEqual({
      value: 'Error: test',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          { filename: '[native code]', function: '?', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 29,
            colno: 927,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 29,
            colno: 2417,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: '?',
            lineno: 29,
            colno: 955,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 29,
            colno: 3016,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'receiveTouches',
            lineno: 156,
            colno: 918,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: '_receiveRootNodeIDEvent',
            lineno: 156,
            colno: 544,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'u',
            lineno: 93,
            colno: 150,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'i',
            lineno: 93,
            colno: 90,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'i',
            lineno: 176,
            colno: 358,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'batchedUpdates',
            lineno: 188,
            colno: 464,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'perform',
            lineno: 177,
            colno: 596,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'c',
            lineno: 93,
            colno: 60,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'a',
            lineno: 93,
            colno: 276,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: '?',
            lineno: 156,
            colno: 572,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'handleTopLevel',
            lineno: 157,
            colno: 174,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 's',
            lineno: 157,
            colno: 88,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'processEventQueue',
            lineno: 146,
            colno: 1432,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'i',
            lineno: 149,
            colno: 80,
            in_app: true,
          },
          { filename: '[native code]', function: 'forEach', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'g',
            lineno: 146,
            colno: 604,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'v',
            lineno: 146,
            colno: 501,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'a',
            lineno: 95,
            colno: 567,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'c',
            lineno: 95,
            colno: 365,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'invokeGuardedCallbackAndCatchFirstError',
            lineno: 79,
            colno: 580,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'invokeGuardedCallback',
            lineno: 79,
            colno: 459,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'u',
            lineno: 79,
            colno: 142,
            in_app: true,
          },
          { filename: '[native code]', function: '?', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'touchableHandleResponderRelease',
            lineno: 252,
            colno: 4735,
            in_app: true,
          },
          { filename: '[native code]', function: '?', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: '_receiveSignal',
            lineno: 252,
            colno: 7291,
            in_app: true,
          },
          { filename: '[native code]', function: '?', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: '_performSideEffectsForTransition',
            lineno: 252,
            colno: 8508,
            in_app: true,
          },
          { filename: '[native code]', function: '?', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'touchableHandlePress',
            lineno: 258,
            colno: 1497,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'onPress',
            lineno: 12,
            colno: 2336,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 12,
            colno: 1917,
            in_app: true,
          },
        ],
      },
    });
  });

  it('should parse React Native errors on Android Hermes', async () => {
    mockFunction(isHermesEnabled).mockReturnValue(true);

    const ANDROID_REACT_NATIVE_HERMES = {
      message: 'Error: lets throw!',
      name: 'Error',
      stack:
        'at onPress (address at index.android.bundle:1:452701)\n' +
        'at anonymous (address at index.android.bundle:1:224280)\n' +
        'at _performSideEffectsForTransition (address at index.android.bundle:1:230843)\n' +
        'at _receiveSignal (native)\n' +
        'at touchableHandleResponderRelease (native)\n' +
        'at onResponderRelease (native)\n' +
        'at apply (native)\n' +
        'at b (address at index.android.bundle:1:74037)\n' +
        'at apply (native)\n' +
        'at k (address at index.android.bundle:1:74094)\n' +
        'at apply (native)\n' +
        'at C (address at index.android.bundle:1:74126)\n' +
        'at N (address at index.android.bundle:1:74267)\n' +
        'at A (address at index.android.bundle:1:74709)\n' +
        'at forEach (native)\n' +
        'at z (address at index.android.bundle:1:74642)\n' +
        'at anonymous (address at index.android.bundle:1:77747)\n' +
        'at _e (address at index.android.bundle:1:127755)\n' +
        'at Ne (address at index.android.bundle:1:77238)\n' +
        'at Ue (address at index.android.bundle:1:77571)\n' +
        'at receiveTouches (address at index.android.bundle:1:122512)\n' +
        'at apply (native)\n' +
        'at value (address at index.android.bundle:1:33176)\n' +
        'at anonymous (address at index.android.bundle:1:31603)\n' +
        'at value (address at index.android.bundle:1:32776)\n' +
        'at value (address at index.android.bundle:1:31561)',
    };
    const exception = await exceptionFromError(ANDROID_REACT_NATIVE_HERMES);

    expect(exception).toEqual({
      value: 'Error: lets throw!',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 1,
            colno: 31562,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 1,
            colno: 32777,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'anonymous',
            lineno: 1,
            colno: 31604,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'value',
            lineno: 1,
            colno: 33177,
            in_app: true,
          },
          {
            filename: 'native',
            function: 'apply',
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'receiveTouches',
            lineno: 1,
            colno: 122513,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'Ue',
            lineno: 1,
            colno: 77572,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'Ne',
            lineno: 1,
            colno: 77239,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: '_e',
            lineno: 1,
            colno: 127756,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'anonymous',
            lineno: 1,
            colno: 77748,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'z',
            lineno: 1,
            colno: 74643,
            in_app: true,
          },
          {
            filename: 'native',
            function: 'forEach',
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'A',
            lineno: 1,
            colno: 74710,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'N',
            lineno: 1,
            colno: 74268,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'C',
            lineno: 1,
            colno: 74127,
            in_app: true,
          },
          { filename: 'native', function: 'apply', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'k',
            lineno: 1,
            colno: 74095,
            in_app: true,
          },
          { filename: 'native', function: 'apply', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: 'b',
            lineno: 1,
            colno: 74038,
            in_app: true,
          },
          { filename: 'native', function: 'apply', in_app: true },
          { filename: 'native', function: 'onResponderRelease', in_app: true },
          { filename: 'native', function: 'touchableHandleResponderRelease', in_app: true },
          { filename: 'native', function: '_receiveSignal', in_app: true },
          {
            filename: 'app:///index.android.bundle',
            function: '_performSideEffectsForTransition',
            lineno: 1,
            colno: 230844,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'anonymous',
            lineno: 1,
            colno: 224281,
            in_app: true,
          },
          {
            filename: 'app:///index.android.bundle',
            function: 'onPress',
            lineno: 1,
            colno: 452702,
            in_app: true,
          },
        ],
      },
    });
  });

  it('InternalBytecode should be flaged as not InApp', async () => {
    mockFunction(isHermesEnabled).mockReturnValue(true);

    const IOS_REACT_NATIVE_HERMES = {
      message: 'Error: lets throw!',
      name: 'Error',
      stack:
        'at anonymous (/Users/username/react-native/sdks/hermes/build_iphonesimulator/lib/InternalBytecode/InternalBytecode.js:139:27)',
    };

    const exception = await exceptionFromError(IOS_REACT_NATIVE_HERMES);

    expect(exception).toEqual({
      value: 'Error: lets throw!',
      type: 'Error',
      mechanism: {
        handled: true,
        type: 'generic',
      },
      stacktrace: {
        frames: [
          {
            filename: 'app:///InternalBytecode.js',
            function: 'anonymous',
            lineno: 139,
            colno: 27,
            in_app: false,
          },
        ],
      },
    });
  });
});
