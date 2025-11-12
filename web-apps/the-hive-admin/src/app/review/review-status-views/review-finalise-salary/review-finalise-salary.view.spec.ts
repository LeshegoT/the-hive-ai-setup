import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewFinaliseSalaryComponent } from './review-finalise-salary.view';

describe('ReviewFinaliseSalaryComponent', () => {
  let component: ReviewFinaliseSalaryComponent;
  let fixture: ComponentFixture<ReviewFinaliseSalaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewFinaliseSalaryComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewFinaliseSalaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
