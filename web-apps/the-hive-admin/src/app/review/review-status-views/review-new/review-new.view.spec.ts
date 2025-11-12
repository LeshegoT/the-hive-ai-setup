import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewNewComponent } from './review-new.view';

describe('ReviewNewComponent', () => {
  let component: ReviewNewComponent;
  let fixture: ComponentFixture<ReviewNewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewNewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
