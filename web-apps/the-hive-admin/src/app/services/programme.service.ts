import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  constructor(private sharedService: SharedService) {}

  getAllProgrammes(): Observable<any> {
    return this.sharedService.get('programme');
  }
  updateProgramme(updatedProgramme): Observable<any> {
    return this.sharedService.patch('programme', { programme: updatedProgramme });
  }
  deleteProgramme(programmeID): Observable<any> {
    return this.sharedService.delete(`programme/${programmeID}`);
  }
  createProgramme(programme): Observable<any> {
    return this.sharedService.post('programme', programme);
  }
}
