import { Injectable } from '@angular/core';
import { FeedbackService } from './feedback.service';
import { ReviewStatus} from '../../shared/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ReviewStatusService {
  private reviewStatuses: Observable<ReviewStatus[]>;

  constructor(private feedbackService: FeedbackService) {
    this.reviewStatuses = this.setReviewStatuses();
  }

  getReviewStatuses(): Observable<ReviewStatus[]> {
    return this.reviewStatuses;
  }

  getStartStatus(): Observable<ReviewStatus | undefined> {
    return this.reviewStatuses.pipe(map((statuses) => statuses.find((status) => status.startingStatus)));
  }

  getCancelStatus(): Observable<ReviewStatus | undefined> {
    return this.reviewStatuses.pipe(map((statuses) => statuses.find((status) => status.cancellationStatus)));
  }

  private setReviewStatuses(): Observable<ReviewStatus[]> {
    return this.feedbackService.getReviewStatusesWithProgressions().pipe(
      map((statusesMap) => {
        const statuses = statusesMap.map(([key, value]) => value);

        return statuses.map((status) => ({
          ...status,
          allowedToProgressTo: status.allowedToProgressTo.map(
            (progressionId) => statuses.find(status => status.statusId === progressionId)
          ),
        }));
      })
    );
 }
}
