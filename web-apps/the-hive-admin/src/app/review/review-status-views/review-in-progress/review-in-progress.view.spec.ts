import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewInProgressComponent } from './review-in-progress.view';

describe('ReviewInProgressComponent', () => {
  let component: ReviewInProgressComponent;
  let fixture: ComponentFixture<ReviewInProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewInProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewInProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
