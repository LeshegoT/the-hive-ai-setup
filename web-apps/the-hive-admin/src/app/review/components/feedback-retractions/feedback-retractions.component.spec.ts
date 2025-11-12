import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackRetractionsComponent } from './feedback-retractions.component';

describe('FeedbackRetractionsComponent', () => {
  let component: FeedbackRetractionsComponent;
  let fixture: ComponentFixture<FeedbackRetractionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackRetractionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackRetractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
