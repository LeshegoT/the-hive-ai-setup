import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class RewardsService {
  constructor(private shared: SharedService) {}

  rewardBucks(upn: string, amount: number, awardedBy: string, reasonId: number): Observable<any> {
    return this.shared.post('awardBucks', { upn, amount, awardedBy, reasonId });
  }

  rewardBucksNewReason(upn: string, amount: number, awardedBy: string, newReason: string): Observable<any> {
    return this.shared.post('awardBucksNewReason', { upn, amount, awardedBy, newReason });
  }

  getRewardReasons(): Observable<any> {
    return this.shared.get('reasons');
  }
}
