import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewReportDialogComponent } from './review-report-dialog.component';

describe('ReviewReportDialogComponent', () => {
  let component: ReviewReportDialogComponent;
  let fixture: ComponentFixture<ReviewReportDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewReportDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
