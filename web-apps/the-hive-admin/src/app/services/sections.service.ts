import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class SectionsService {

  constructor(private sharedService: SharedService) {}

  getAllSections(): Observable<any> {
    return this.sharedService.get('sections');
  }
  
  getSuggestedSections(): Observable<any> {
    return this.sharedService.get('suggestedSections');
  }
}
