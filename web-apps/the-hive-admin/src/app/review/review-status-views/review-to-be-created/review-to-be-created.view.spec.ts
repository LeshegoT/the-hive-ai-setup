import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewToBeCreatedComponent } from './review-to-be-created.view';

describe('ReviewToBeCreatedComponent', () => {
  let component: ReviewToBeCreatedComponent;
  let fixture: ComponentFixture<ReviewToBeCreatedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewToBeCreatedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewToBeCreatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
