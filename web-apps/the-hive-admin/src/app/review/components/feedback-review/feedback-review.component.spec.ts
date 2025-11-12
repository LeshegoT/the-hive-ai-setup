import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackReviewComponent } from './feedback-review.component';

describe('FeedbackReviewComponent', () => {
  let component: FeedbackReviewComponent;
  let fixture: ComponentFixture<FeedbackReviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackReviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
