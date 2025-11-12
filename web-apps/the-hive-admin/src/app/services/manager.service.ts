import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';
import { Person } from '../shared/interfaces';

@Injectable({
    providedIn: 'root',
  })
  export class ManagerService {
    constructor(private sharedService: SharedService) {}
    
    getManagers(): Observable<Person[]> {
        return this.sharedService.get('/managers');
      }
  }