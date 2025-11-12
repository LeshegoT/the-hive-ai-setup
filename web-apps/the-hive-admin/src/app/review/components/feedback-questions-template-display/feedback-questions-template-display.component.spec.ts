import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackQuestionsTemplateDisplayComponent } from './feedback-questions-template-display.component';

describe('FeedbackQuestionsTemplateDisplayComponent', () => {
  let component: FeedbackQuestionsTemplateDisplayComponent;
  let fixture: ComponentFixture<FeedbackQuestionsTemplateDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackQuestionsTemplateDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackQuestionsTemplateDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
