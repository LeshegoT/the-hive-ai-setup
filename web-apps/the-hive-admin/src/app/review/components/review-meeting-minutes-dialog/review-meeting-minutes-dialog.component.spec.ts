import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewMeetingMinutesDialogComponent } from './review-meeting-minutes-dialog.component';

describe('ReviewMeetingMinutesDialogComponent', () => {
  let component: ReviewMeetingMinutesDialogComponent;
  let fixture: ComponentFixture<ReviewMeetingMinutesDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewMeetingMinutesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewMeetingMinutesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
