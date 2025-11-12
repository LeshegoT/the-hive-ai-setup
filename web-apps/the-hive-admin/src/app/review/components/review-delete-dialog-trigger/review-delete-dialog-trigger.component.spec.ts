import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewDeleteDialogTriggerComponent } from './review-delete-dialog-trigger.component';

describe('ReviewDeleteDialogTriggerComponent', () => {
  let component: ReviewDeleteDialogTriggerComponent;
  let fixture: ComponentFixture<ReviewDeleteDialogTriggerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewDeleteDialogTriggerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewDeleteDialogTriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
