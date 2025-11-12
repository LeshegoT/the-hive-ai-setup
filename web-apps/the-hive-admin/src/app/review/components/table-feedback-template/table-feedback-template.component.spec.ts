import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableFeedbackTemplateComponent } from './table-feedback-template.component';

describe('TableFeedbackTemplateComponent', () => {
  let component: TableFeedbackTemplateComponent;
  let fixture: ComponentFixture<TableFeedbackTemplateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableFeedbackTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableFeedbackTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
