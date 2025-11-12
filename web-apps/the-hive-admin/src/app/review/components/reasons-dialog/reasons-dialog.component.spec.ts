import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReasonsDialogComponent } from './reasons-dialog.component';

describe('ReviewDeleteDialogComponent', () => {
  let component: ReasonsDialogComponent;
  let fixture: ComponentFixture<ReasonsDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReasonsDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
