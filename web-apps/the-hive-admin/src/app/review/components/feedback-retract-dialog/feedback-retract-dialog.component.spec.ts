import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackRetractDialogComponent } from './feedback-retract-dialog.component';

describe('FeedbackRetractDialogComponent', () => {
  let component: FeedbackRetractDialogComponent;
  let fixture: ComponentFixture<FeedbackRetractDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackRetractDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackRetractDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
