import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable,from, iif } from 'rxjs';
import { AuthService } from './auth.service';
import { flatMap, map, tap } from 'rxjs/operators';
import { BaseService } from './base.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService extends BaseService {
  constructor(private inject: Injector, private http: HttpClient, private authService: AuthService) {
    super(inject);
  }

  protected prepend(url: string, prependApi: boolean): Observable<string> {
    return iif(() => prependApi, this.apiUrl.pipe(map((apiUrl) => `${apiUrl}${url}`)), of(url));
  }

  get(url: string, prependApi = true): Observable<any> {
    return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) =>
        this.authService.getHeaders().pipe(
          flatMap((headers) => this.http.get<any>(theUrl, { headers }))
        )
      )
    );
  }

  getBlob(url: string, prependApi = true): Observable<Blob> {
    return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) => 
        this.authService.getHeaders().pipe(
          flatMap((headers) =>
            this.http.get(theUrl, {
              headers,
              responseType: 'blob'
            })
          )
        )
      )
    );
  }  

  post(url: string, body: any, prependApi = true): Observable<any> {
    return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) =>
        this.authService.getHeaders().pipe(
          flatMap((headers) => this.http.post<any>(theUrl, body, { headers }))
        )
      )
    );
  }

  put(url: string, body: any, prependApi = true): Observable<any> {
    return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) =>
        this.authService.getHeaders().pipe(
          flatMap((headers) => this.http.put<any>(theUrl, body, { headers }))
        )
      )
    );
  }

  patch(url: string, body: any, prependApi = true): Observable<any> {
    return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) =>
        this.authService.getHeaders().pipe(
          flatMap((headers) => this.http.patch<any>(theUrl, body, { headers }))
        )
      )
    );
  }

  delete(url: string, prependApi = true, body: any = undefined): Observable<any> {
    if(body){
      return this.prepend(url, prependApi).pipe(
      flatMap((theUrl) =>
        this.authService.getHeaders().pipe(
          flatMap((headers) => this.http.patch<any>(theUrl, body, { headers }))
        )
      )
    );
    }
    else{
      return this.prepend(url, prependApi).pipe(
        flatMap((theUrl) =>
          this.authService.getHeaders().pipe(
            flatMap((headers) => this.http.delete<any>(theUrl, { headers }))
          )
        )
      );
    }
  }
}
