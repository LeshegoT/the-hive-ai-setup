import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackAssignmentComponent } from './feedback-assignment.component';

describe('FeedbackAssignmentComponent', () => {
  let component: FeedbackAssignmentComponent;
  let fixture: ComponentFixture<FeedbackAssignmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackAssignmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
