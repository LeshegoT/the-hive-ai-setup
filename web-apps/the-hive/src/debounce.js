export function debounce(callable, debounceTime) {
  let timeoutId;
  let pendingCallable;

  return {
    resolvePending: () => {
      clearTimeout(timeoutId);
      if (pendingCallable) {
        pendingCallable = undefined;
        return callable();
      } else {
        return undefined;
      }
    },

    debounced: (...args) => {
      clearTimeout(timeoutId);
      return new Promise((resolve, reject) => {
        pendingCallable = () => {
          try {
            const returnValue = callable(...args);
            if (returnValue instanceof Promise) {
              returnValue.then(resolve).catch(reject);
            } else {
              resolve(returnValue);
            }
          } catch (error) {
            reject(error);
          }

          pendingCallable = undefined;
        };

        timeoutId = setTimeout(pendingCallable, debounceTime);
      });
    },
  };
}
