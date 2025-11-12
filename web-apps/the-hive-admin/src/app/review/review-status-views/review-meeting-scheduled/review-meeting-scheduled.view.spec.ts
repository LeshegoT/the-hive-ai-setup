import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewMeetingScheduledComponent } from './review-meeting-scheduled.view';

describe('ReviewMeetingScheduledComponent', () => {
  let component: ReviewMeetingScheduledComponent;
  let fixture: ComponentFixture<ReviewMeetingScheduledComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewMeetingScheduledComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewMeetingScheduledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
