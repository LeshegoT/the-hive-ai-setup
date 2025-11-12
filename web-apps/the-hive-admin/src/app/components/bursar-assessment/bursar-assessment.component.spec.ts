import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BursarAssessmentComponent } from './bursar-assessment.component';

describe('BursarAssessmentComponent', () => {
  let component: BursarAssessmentComponent;
  let fixture: ComponentFixture<BursarAssessmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BursarAssessmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BursarAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
