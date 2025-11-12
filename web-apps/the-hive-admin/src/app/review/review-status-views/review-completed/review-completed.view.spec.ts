import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewCompletedComponent } from './review-completed.view';

describe('ReviewCompletedComponent', () => {
  let component: ReviewCompletedComponent;
  let fixture: ComponentFixture<ReviewCompletedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewCompletedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewCompletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
