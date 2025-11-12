import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeedbackRetractionReasons } from '../components/feedback-retraction-reasons/feedback-retraction-reasons.component';
import { SharedService } from '../../services/shared.service';

@Injectable({
  providedIn: 'root',
})
export class FeedbackRetractionReasonsService {
  constructor(private sharedService: SharedService) {}

  getRetractedReasons(): Observable<any> {
    return this.sharedService.get(`/retraction`);
  }

  getFeedbackRetractionReasonsWithTags(): Observable<any> {
    return this.sharedService.get(`/feedbacks/retracted`);
  }

  createNewFeedbackRetractionReason(retractData: FeedbackRetractionReasons): Observable<any> {
    return this.sharedService.post(`retraction`, retractData);
  }
  updateFeedbackRetractionReason(retractionReasonID, retractionReason): Observable<any> {
    return this.sharedService.patch(`retraction/${retractionReasonID}`, retractionReason);
  }
  deleteFeedbackRetrationReason(retractionReasonID): Observable<any> {
    return this.sharedService.delete(`retraction/${retractionReasonID}`);
  }
}
