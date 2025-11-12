import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewReportDownloadedComponent } from './review-report-downloaded.component';

describe('ReviewReportDownloadedComponent', () => {
  let component: ReviewReportDownloadedComponent;
  let fixture: ComponentFixture<ReviewReportDownloadedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewReportDownloadedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewReportDownloadedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
