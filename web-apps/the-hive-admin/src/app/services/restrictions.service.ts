import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { RestrictionsFormat } from "../shared/interfaces";

@Injectable({
  providedIn: 'root'
})
export class RestrictionsService {

  constructor(private sharedService: SharedService) { }

  restrictTrack(trackId : number, restrictions : RestrictionsFormat): Observable<any>{

      return this.sharedService.post('restrictContent', { trackId, restrictions});
  }

  getAllRestrictions(): Observable<any> {
    return this.sharedService.get('restrictions');
  }
}
