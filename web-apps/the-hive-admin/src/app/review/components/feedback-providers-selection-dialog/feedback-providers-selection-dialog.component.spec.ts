import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FeedbackProvidersSelectionDialogComponent } from './feedback-providers-selection-dialog.component';

describe('FeedbackProvidersSelectionDialogComponent', () => {
  let component: FeedbackProvidersSelectionDialogComponent;
  let fixture: ComponentFixture<FeedbackProvidersSelectionDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackProvidersSelectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackProvidersSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
