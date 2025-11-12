import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewProcessFinalizedComponent } from './review-process-finalized.view';

describe('ReviewProcessFinalizedComponent', () => {
  let component: ReviewProcessFinalizedComponent;
  let fixture: ComponentFixture<ReviewProcessFinalizedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewProcessFinalizedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewProcessFinalizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
