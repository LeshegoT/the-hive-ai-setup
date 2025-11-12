import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BbdUserName } from '@the-hive/lib-staff-shared';
import { catchError, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { BaseService } from './base.service';

export type GraphApiUser = {
  city: string;
  companyName: string;
  department: string;
  displayName: string;
  jobTitle: string;
  upn: string;
  bbdUserName: BbdUserName;
  entityAbbreviation: string;
  office: string;
}

export type GraphApiUserWithReviewer = GraphApiUser & {
  reviewer: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService extends BaseService {

  constructor(private inject: Injector, private httpClient: HttpClient, private auth: AuthService, private snackBar : MatSnackBar) {
    super(inject);
  }

  createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        return reader.result;
      },
      false
    );

    if (image) {
      return reader.readAsDataURL(image);
    }
  }

  getImageFromGraphAPI:  (graphAPI: string, person: string) => Promise<void | Blob> = async (graphAPI: string, person: string) => {
    return this.auth.getAccessTokenHeader().then((header) => {
      if (header && person) {
        let url;
        switch (person) {
          case 'me':
            url = `${graphAPI}me/photo/$value`;
            break;

          case 'System':
          case 'system':
            url = 'images/hive.svg';
            break;

          default:
            url = `${graphAPI}users/${person}/photo/$value`;
            break;
        }

        return this.httpClient
          .get(url, {
            headers: header,
            responseType: 'blob',
          })
          .toPromise()
          .catch(() => {
            // TODO: RE - this is sacrelege ... someone should be very very very embarrased about this.
            this.snackBar.dismiss();
          });
      } else {
        return undefined;
      }
    });
  };

  getImage: (string) => Promise<void | Blob> = async (person: string) =>
    this.msGraphApi
      .toPromise()
      .then((graphApi) => this.getImageFromGraphAPI(graphApi, person));

  searchForUserOnGraphAPI(searchTerm: string): Observable<GraphApiUser[]> {
    return combineLatest([this.msGraphApi, this.auth.getAccessTokenHeader()]).pipe(
      switchMap(([graphApiBaseUrl, authorizationHeader]) => {
        if (graphApiBaseUrl && authorizationHeader) {
          const urlSearchParameters = new URLSearchParams({
            "$filter": `userType eq 'Member' AND (startswith(displayName,'${searchTerm}') or startswith(givenName,'${searchTerm}') or startswith(surname,'${searchTerm}') or startswith(userPrincipalName,'${searchTerm}'))`,
            "$select": "city,companyName,department,displayName,jobTitle,userPrincipalName,onPremisesSamAccountName,officeLocation,companyName"
          });
          const url = `${graphApiBaseUrl}users?${urlSearchParameters.toString()}`;
          return this.httpClient.get(url, {
            headers: {
              ...authorizationHeader,
              ConsistencyLevel: "eventual"
            },
          }).pipe(
            map((response) => response["value"].map((user) => ({
              city: user.city,
              companyName: user.companyName,
              department: user.department,
              displayName: user.displayName,
              jobTitle: user.jobTitle,
              upn: user.userPrincipalName,
              bbdUserName: user.onPremisesSamAccountName,
              office: user.officeLocation,
              entityAbbreviation: user.companyName,
            })))
          );
        } else {
          return of(undefined);
        }
      }),
    );
  }

  getReviewerUPNForUserFromGraphAPI(upn: string): Observable<string> {
    return combineLatest([this.msGraphApi, this.auth.getAccessTokenHeader()]).pipe(
      switchMap(([graphApiBaseUrl, authorizationHeader]) => {
        if (graphApiBaseUrl && authorizationHeader && upn) {
          const managerUrl = `${graphApiBaseUrl}users/${upn}/manager`;
          return this.httpClient.get(managerUrl, {
            headers: {
              ...authorizationHeader,
              ConsistencyLevel: "eventual"
            },
          }).pipe(
            map((managerResponse) => managerResponse["userPrincipalName"] || ''),
            catchError(() => of(undefined))
          );
        } else {
          return of(undefined);
        }
      })
    );
  }
}
