import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrescribedTrainingDialogComponent } from './prescribed-training-dialog.component';

describe('PrescribedTrainingDialogComponent', () => {
  let component: PrescribedTrainingDialogComponent;
  let fixture: ComponentFixture<PrescribedTrainingDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescribedTrainingDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescribedTrainingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
