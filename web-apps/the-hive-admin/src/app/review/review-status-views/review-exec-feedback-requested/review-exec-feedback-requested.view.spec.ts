import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewExecFeedbackRequestedComponent } from './review-exec-feedback-requested.view';

describe('ReviewExecFeedbackRequestedComponent', () => {
  let component: ReviewExecFeedbackRequestedComponent;
  let fixture: ComponentFixture<ReviewExecFeedbackRequestedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewExecFeedbackRequestedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewExecFeedbackRequestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
