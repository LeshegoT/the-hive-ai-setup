import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackRetractionReason } from './feedback-retraction-reasons.component';

describe('FeedbackRetractionReason', () => {
  let component: FeedbackRetractionReason;
  let fixture: ComponentFixture<FeedbackRetractionReason>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FeedbackRetractionReason],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackRetractionReason);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
