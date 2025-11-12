import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModifyFeedbackTemplateComponent } from './modify-feedback-template.component';

describe('ModifyFeedbackTemplateComponent', () => {
  let component: ModifyFeedbackTemplateComponent;
  let fixture: ComponentFixture<ModifyFeedbackTemplateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifyFeedbackTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyFeedbackTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});