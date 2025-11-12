import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewToDOComponent } from './to-do.tab';

describe('ReviewToDoComponent', () => {
  let component: ReviewToDOComponent;
  let fixture: ComponentFixture<ReviewToDOComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewToDOComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewToDOComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
