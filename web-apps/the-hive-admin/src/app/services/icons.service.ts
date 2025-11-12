import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IconsService {

  constructor(private sharedService: SharedService) {}

  getAllIcons(): Observable<any> {
    return this.sharedService.get('icons');
  }
}
