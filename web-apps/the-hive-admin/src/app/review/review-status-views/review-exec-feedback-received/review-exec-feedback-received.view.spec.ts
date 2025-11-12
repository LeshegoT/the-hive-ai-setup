import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewExecFeedbackReceivedComponent } from './review-exec-feedback-received.view';

describe('ReviewExecFeedbackReceivedComponent', () => {
  let component: ReviewExecFeedbackReceivedComponent;
  let fixture: ComponentFixture<ReviewExecFeedbackReceivedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewExecFeedbackReceivedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewExecFeedbackReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
