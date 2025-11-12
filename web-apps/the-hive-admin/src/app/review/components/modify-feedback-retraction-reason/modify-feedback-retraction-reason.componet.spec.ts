import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModifyFeedbackReasonComponent } from './modify-feedback-retraction-reason.componet';

describe('ModifyFeedbackReasonComponent', () => {
  let component: ModifyFeedbackReasonComponent;
  let fixture: ComponentFixture<ModifyFeedbackReasonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ModifyFeedbackReasonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyFeedbackReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
