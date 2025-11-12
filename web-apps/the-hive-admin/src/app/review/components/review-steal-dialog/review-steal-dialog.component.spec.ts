import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewStealDialogComponent } from './review-steal-dialog.component';

describe('ReviewDeleteDialogComponent', () => {
  let component: ReviewStealDialogComponent;
  let fixture: ComponentFixture<ReviewStealDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewStealDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewStealDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
