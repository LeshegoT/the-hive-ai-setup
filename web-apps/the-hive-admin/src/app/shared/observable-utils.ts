import { catchError, map, Observable, of, startWith } from 'rxjs';

/**
 * Represents the three possible states of an asynchronous operation: loading, success, or error.
 *
 * @template T - The type of data returned on successful completion
 */
export type LoadingState<T> =
  | { status: 'loading' }
  | { status: 'success', data: T }
  | { status: 'error', errorMessage: string }

export type LoadingStateObservable<T> = Observable<LoadingState<T>>

/**
 * Wraps an Observable to automatically track its loading, success, and error states.
 * It initially emits `{ status: "loading" }` upon subscribing followed by the `{ status: "success" }` or `{ status: "error" }` depending on whether
 * the upstream observable has thrown an error or successfully emitted a value.
 *
 * @template T - The type of data emitted by the source observable
 * @param observable - The source Observable to wrap with loading state tracking
 * @returns An Observable that emits LoadingState objects representing the current state
 */
export const withObservableLoadingState = <T>(observable: Observable<T>): LoadingStateObservable<T> => observable.pipe(
  map(data => ({ status: 'success' as const, data })),
  catchError((errorMessage: string) => of({ status: 'error' as const, errorMessage })),
  startWith({ status: 'loading' as const})
);
