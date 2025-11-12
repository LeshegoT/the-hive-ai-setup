import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewProvidersAssignedComponent } from './review-providers-assigned.view';

describe('ReviewProvidersAssignedComponent', () => {
  let component: ReviewProvidersAssignedComponent;
  let fixture: ComponentFixture<ReviewProvidersAssignedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewProvidersAssignedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewProvidersAssignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
