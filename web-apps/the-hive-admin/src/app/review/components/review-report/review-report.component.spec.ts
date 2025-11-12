import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewReportComponent } from './review-report.component';

describe('ReviewReportComponent', () => {
  let component: ReviewReportComponent;
  let fixture: ComponentFixture<ReviewReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
