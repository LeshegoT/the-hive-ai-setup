import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BursarAssessmentViewComponent } from './bursar-assessment-view.component';

describe('BursarAssessmentViewComponent', () => {
  let component: BursarAssessmentViewComponent;
  let fixture: ComponentFixture<BursarAssessmentViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BursarAssessmentViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BursarAssessmentViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
