import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HrRepSelectionDialogComponent } from './hr-rep-selection-dialog.component';

describe('HrRepSelectionDialogComponent', () => {
  let component: HrRepSelectionDialogComponent;
  let fixture: ComponentFixture<HrRepSelectionDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HrRepSelectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrRepSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
