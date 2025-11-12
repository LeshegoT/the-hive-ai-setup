import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InterceptorService {
  constructor(private snackBar: MatSnackBar) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg =  '';
        if (error.error instanceof ErrorEvent) {
          errorMsg = `Error: ${error.error.message}`;
        } else {
          if(error.error && error.error.message){
            errorMsg = error.error.message;
          } else {
            errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
          }
        }
        this.snackBar.open(errorMsg, 'Dismiss');
        return throwError(errorMsg);
      })
    );
  }
}
