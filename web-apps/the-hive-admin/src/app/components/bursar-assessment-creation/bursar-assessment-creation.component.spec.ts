import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BursarAssessmentCreationComponent } from './bursar-assessment-creation.component';

describe('BursarAssessmentCreationComponent', () => {
  let component: BursarAssessmentCreationComponent;
  let fixture: ComponentFixture<BursarAssessmentCreationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BursarAssessmentCreationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BursarAssessmentCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
