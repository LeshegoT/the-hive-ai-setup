import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class VacWorkService {
  constructor(private sharedService: SharedService) {}

  getApplications(): Observable<any> {
    return this.sharedService.get('vacWorkApplications');
  }

  getAttachmentUrl(fileId: string): Observable<any> {
    return this.sharedService.get(`vacWorkAttachment/${fileId}`);
  }
}
