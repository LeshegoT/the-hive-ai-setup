import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewFeedbackRetractionReason } from './view-retracted-feedback.component';

describe('ReviewFeedbackRetractionReason', () => {
  let component: ReviewFeedbackRetractionReason;
  let fixture: ComponentFixture<ReviewFeedbackRetractionReason>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewFeedbackRetractionReason],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewFeedbackRetractionReason);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
