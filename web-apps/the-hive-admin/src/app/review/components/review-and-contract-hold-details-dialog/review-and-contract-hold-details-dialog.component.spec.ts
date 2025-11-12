import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewAndContractHoldDetailsDialogComponent } from './review-and-contract-hold-details-dialog.component';

describe('ReviewAndContractHoldDetailsDialogComponent', () => {
  let component: ReviewAndContractHoldDetailsDialogComponent;
  let fixture: ComponentFixture<ReviewAndContractHoldDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewAndContractHoldDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReviewAndContractHoldDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
