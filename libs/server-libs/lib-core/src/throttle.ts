'use strict';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: () => void;
}

function defer(): Deferred {
  const deferred: Deferred = {
    promise: undefined,
    resolve: () => {return;},
    reject: () => {return;},
  };
  deferred.promise = new Promise<void>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

export function rateLimit(rateInMs: number) {
  if (rateInMs < 0) rateInMs = 0;
  function throttle(): Promise<void> {
    const deferred = defer();
    throttle.queue.push(deferred);

    return throttle.check().then(function () {
      return deferred.promise;
    });
  }

  throttle.currentlyActiveCheck = null;
  throttle.lastExecutionTime = 0;
  throttle.queue = [];

  throttle.resolveUniform = function (fnName, v) {
    throttle.queue.forEach(function (deferred) {
      return deferred[fnName](v);
    });
    throttle.queue = [];
  };

  throttle.resolveAll = function (v) {
    return throttle.resolveUniform('resolve', v);
  };

  throttle.rejectAll = function (v) {
    return throttle.resolveUniform('reject', v);
  };

  throttle.check = function () {
    if (throttle.currentlyActiveCheck || throttle.queue.length == 0) return throttle.currentlyActiveCheck;

    const waitingTime = rateInMs - (Date.now() - throttle.lastExecutionTime);
    return (throttle.currentlyActiveCheck = (waitingTime > 0 ? delay(waitingTime) : Promise.resolve()).then(
      function () {
        const now = Date.now();
        if (now - throttle.lastExecutionTime >= rateInMs) {
          throttle.lastExecutionTime = now;
          throttle.queue.shift()?.resolve();
        }

        throttle.currentlyActiveCheck = null;
        throttle.check();
      }
    ));
  };

  return throttle;
}
