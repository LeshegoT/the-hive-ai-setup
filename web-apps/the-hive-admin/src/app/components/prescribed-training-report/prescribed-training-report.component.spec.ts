import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrescribedTrainingReportComponent } from './prescribed-training-report.component';

describe('PrescribedTrainingReportComponent', () => {
  let component: PrescribedTrainingReportComponent;
  let fixture: ComponentFixture<PrescribedTrainingReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescribedTrainingReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescribedTrainingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
