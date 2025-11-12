import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QuestionEditorComponent } from './question-editor.component';

describe('QuestionEditorComponent', () => {
  let component: QuestionEditorComponent;
  let fixture: ComponentFixture<QuestionEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestionEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
