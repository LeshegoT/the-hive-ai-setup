import { Injectable } from '@angular/core';
import { AttributeCanonicalNameDetailsWithInstitution } from '@the-hive/lib-skills-shared';
import { SharedService } from '../../../services/shared.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AvailableAtRatificationTableService {
    private cancel$ = new Subject<void>();
    constructor(private sharedService: SharedService) {}

    retrieveAttributeCanonicalNameDetailsWithInstitution(pageIndex: number, pageSize: number, searchText?: string): Observable<AttributeCanonicalNameDetailsWithInstitution> {
        this.cancel$.next();
        const params = new URLSearchParams({
            startIndex: (pageIndex * pageSize).toString(),
            pageLength: pageSize.toString(),
            ...(searchText && { searchText: searchText.trim() })
        });
        return this.sharedService.get(`/skills/unratified/available-at?${params.toString()}`).pipe(
            takeUntil(this.cancel$)
        );
    }
}
