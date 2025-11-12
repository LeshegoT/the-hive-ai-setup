import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  constructor(private sharedService: SharedService) {}

  getAllUnits(): Observable<any> {
    return this.sharedService.get('unit');
  }

  updateUnit(unitId: number, description: string): Observable<any> {
    return this.sharedService.patch(`unit/${unitId}`, { description });
  }

  deleteUnit(unitId: number): Observable<any> {
    return this.sharedService.delete(`unit/${unitId}`);
  }

  createUnit(unit): Observable<any> {
    const { name, description } = unit;
    return this.sharedService.post('unit', { unitName: name, description });
  }
}
