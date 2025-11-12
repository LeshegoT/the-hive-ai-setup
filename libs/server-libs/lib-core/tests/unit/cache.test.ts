import { describe, expect, test } from '@jest/globals';

import { cache, cacheUntilExpiry } from "../../src/cache";

describe("Cache result of synchronous function without expiry", () => {
    test('Cache should return the correct value, and return the same value when called twice', async  () => {
        const cacheName ="synchFunNoExp";
        const expected = "synchFunNoExp cached value";
        const cachedValue = cache(cacheName, () => {
            return expected;
        });
        if(cachedValue instanceof Promise){
            await cachedValue.then( (result) => expect(result).toBe(expected));
        } else {
            expect(cachedValue).toBe(expected)
        }

        const knownCachedValue = cache(cacheName, () => {
            throw Error("This function should not be called, the cache already contains this value")
        });
        if(knownCachedValue instanceof Promise){
            await knownCachedValue.then( (result) => expect(result).toBe(expected));
        } else {
            expect(knownCachedValue).toBe(expected)
        }
    });
});


describe("Cache result of asynchronous function without expiry", ()=>{
    test('Cache should return the correct value, and return the same value when called twice', async () => {
        const cacheName ="asynchFunNoExp";
        const expected = "asynchFunNoExp cached value"
        const cachedValue = cache(cacheName, async () => {
            return  new Promise((resolve) => {
                setTimeout( () => resolve(expected), 1000);
            });;
        });
        if(cachedValue instanceof Promise){
            await cachedValue.then( (result) => expect(result).toBe(expected));
        } else {
            expect(cachedValue).toBe(expected)
        }

        const knownCachedValue = cache(cacheName, async () => {
            return "This function should not be called, the cache already contains this value"
        });
        if(knownCachedValue instanceof Promise){
            await knownCachedValue.then( (result) => expect(result).toBe(expected));
        } else {
            expect(knownCachedValue).toBe(expected)
        }
    });
});

describe("Cache result of synchronous function with expiry", ()=>{
    test('Cache should return the correct value, and return the same value when called twice', async  () => {
        const cacheName ="synchFunWithExp";
        const expected = "synchFunWithExp cached value"
        const expires = new Date( (new Date()).getTime()+2000); // expire in 2 seconds

        const initializer = (date:Date) => {return ()=> ({ heldValue: expected, expiry: date})}
        const neverInitializer: (date:Date) => (()=> {heldValue:string, expiry: Date} ) = (date:Date) => {
          return () => {
            throw new Error(`This is an unexpected code execution path (${date.toISOString()}), this function should not have been be called, the cache already contains this value`);
          }
        }

        const cachedValue = cacheUntilExpiry(cacheName, initializer(expires));

        const result =  await cachedValue;
        expect(result?.heldValue).toBe(expected);
        expect(result?.expiry).toBe(expires);

        const knownCachedValue = cacheUntilExpiry(cacheName, neverInitializer(expires));

        const knownResult =  await knownCachedValue;
        expect(knownResult?.heldValue).toBe(expected);
        expect(knownResult?.expiry).toBe(expires);

        // wait 3 seconds for evition
        await new Promise<{heldValue:string, expiry: Date}>((resolve) => {
            setTimeout(resolve, 3000);
        });

        const newExpires = new Date( (new Date()).getTime()+2000); // expire in 2 seconds
        const afterTimeoutCachedValue = cacheUntilExpiry(cacheName, initializer(newExpires));

        const afterTimeoutResult =  await afterTimeoutCachedValue;
        expect(afterTimeoutResult?.heldValue).toBe(expected);
        expect(afterTimeoutResult?.expiry).toBe(newExpires);

    }, 6000);
});

describe("Cache result of asynchronous function with expiry", ()=>{
    test('Cache should return the correct value, and return the same value when called twice', async  () => {
        const cacheName ="asynchFunWithExp";
        const expected = "asynchFunWithExp cached value"
        const expires = new Date( (new Date()).getTime()+2000); // expire in 2 seconds

        const initializer =  (date:Date) => {
            return async () => new Promise<{heldValue:string, expiry: Date}>((resolve) => {
                setTimeout( () => resolve({heldValue:expected, expiry: date}), 1000);
            });
        };

        const neverInitializer : (date:Date) => (()=>Promise<{heldValue:string, expiry: Date}>) =  (date:Date) => {
            return async () => new Promise<{heldValue:string, expiry: Date}>((resolve,reject) => {
                setTimeout( () => reject(`This is an unexpected code execution path (${date.toISOString()}), this function should not have been be called, the cache already contains this value`), 1000);
            });
        };

        const cachedValue = cacheUntilExpiry(cacheName, initializer(expires));

        const result =  await cachedValue;
        expect(result?.heldValue).toBe(expected);
        expect(result?.expiry).toBe(expires);

        const knownCachedValue = cacheUntilExpiry(cacheName, neverInitializer(expires));

        const knownResult =  await knownCachedValue;
        expect(knownResult?.heldValue).toBe(expected);
        expect(knownResult?.expiry).toBe(expires);

        // wait 3 seconds for eviction
        await new Promise<{heldValue:string, expiry: Date}>((resolve) => {
            setTimeout(resolve, 3000);
        });

        const newExpires = new Date( (new Date()).getTime()+2000); // expire in 2 seconds
        const afterTimeoutCachedValue = cacheUntilExpiry(cacheName, initializer(newExpires));

        const afterTimeoutResult =  await afterTimeoutCachedValue;
        expect(afterTimeoutResult?.heldValue).toBe(expected);
        expect(afterTimeoutResult?.expiry).toBe(newExpires);
    }, 10000); // needed to add some extra timeout to this async test
});

