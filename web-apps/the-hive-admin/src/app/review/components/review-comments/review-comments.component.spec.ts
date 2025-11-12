import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewCommentsComponent } from './review-comments.component';

describe('ReviewCommentsComponent', () => {
  let component: ReviewCommentsComponent;
  let fixture: ComponentFixture<ReviewCommentsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewCommentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
