import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewSearchBarComponent } from './review-search-bar.component';

describe('ReviewSearchBarComponent', () => {
  let component: ReviewSearchBarComponent;
  let fixture: ComponentFixture<ReviewSearchBarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewSearchBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
