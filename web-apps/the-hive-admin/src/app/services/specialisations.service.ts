import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpecialisationsService {
  constructor(private sharedService: SharedService) {}

  getSpecialisations(): Observable<any> {
    return this.sharedService.get('specialisations');
  }

  getGuidepecialisations(guide: string): Observable<any> {
    return this.sharedService.get(`guideSpecialisations/${guide}`);
  }

  addSpecialisations(guide: string, specialisations: any[]) {
    return this.sharedService.post('addSpecialisations', { guide, specialisations });
  }

  setQuestSpecialisation(questId, specialisationId) {
    return this.sharedService.post('setQuestSpecialisation', { questId, specialisationId });
  }
}
