import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrCommentsDialogComponent } from './hr-comments-dialog.component';

describe('HrCommentsDialogComponent', () => {
  let component: HrCommentsDialogComponent;
  let fixture: ComponentFixture<HrCommentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrCommentsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrCommentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
