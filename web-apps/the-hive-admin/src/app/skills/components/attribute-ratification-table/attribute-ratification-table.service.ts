import { Injectable } from '@angular/core';
import { RatificationCanonicalNameDetails, TopLevelTag } from '@the-hive/lib-skills-shared';
import { SharedService } from '../../../services/shared.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AttributeRatificationTableService {
    private cancel$ = new Subject<void>();

    constructor(private sharedService: SharedService) {}
    retrieveUnratifiedAttributes(topLevelTag: TopLevelTag, pageIndex: number, pageLength: number, searchText?:string): Observable<RatificationCanonicalNameDetails> {
        this.cancel$.next();
        const params = new URLSearchParams({
            startIndex: (pageIndex * pageLength).toString(),
            pageLength: pageLength.toString(),
            ...(searchText && {searchText: searchText.trim()})
        });
        return this.sharedService.get(
            `skills/unratified/${topLevelTag.standardizedName}?${params.toString()}`
        ).pipe(takeUntil(this.cancel$));
    }
}
