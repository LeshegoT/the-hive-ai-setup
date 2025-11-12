import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  router: Router;
  constructor(private injector: Injector, private zone: NgZone) {}

  handleError(error: any): void {
    this.router = this.injector.get(Router);
    // the error can be log into a database, custom server log file directory etc
    if (error instanceof HttpErrorResponse) {
      const err: HttpErrorResponse = error;
        console.error(err.error);
        console.error(err.message);
        console.error(error.status);
        console.error(error.statusText);
        console.error(JSON.stringify(error));
    } else {
      console.error(error);
    }
  }
}
