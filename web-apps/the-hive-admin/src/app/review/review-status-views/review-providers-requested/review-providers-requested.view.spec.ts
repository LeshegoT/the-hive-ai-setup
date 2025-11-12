import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewProvidersRequestedComponent } from './review-providers-requested.view';

describe('ReviewProvidersRequestedComponent', () => {
  let component: ReviewProvidersRequestedComponent;
  let fixture: ComponentFixture<ReviewProvidersRequestedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewProvidersRequestedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewProvidersRequestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
