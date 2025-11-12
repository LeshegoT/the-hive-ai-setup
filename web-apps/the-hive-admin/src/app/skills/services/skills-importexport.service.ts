import { Injectable, Injector } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseService } from '../../services/base.service';
import { SharedService } from '../../services/shared.service';

@Injectable({
  providedIn: 'root',
})
export class SkillsImportExportService extends BaseService {
  constructor(
    private sharedService: SharedService,
    private readonly inject: Injector,
  ) {
    super(inject);
  }

  protected getUrl(url: string): Observable<string> {
    return this.apiUrl.pipe(map((apiUrl) => `${apiUrl}${url}`));
  }

  makeGraphExport(): Observable<any> {
    return this.sharedService.post(`skills/exports`, {});
  }

}
