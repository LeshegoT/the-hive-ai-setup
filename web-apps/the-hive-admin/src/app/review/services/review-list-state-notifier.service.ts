import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewListStateNotifierService {

  private reviewListStateChange = new Subject<void>();

  notifyReviewListStateChange() {
    this.reviewListStateChange.next();
  }

  onReviewListStateChange(): Observable<void> {
    return this.reviewListStateChange.asObservable();
  }
}
