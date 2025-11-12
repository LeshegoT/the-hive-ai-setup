import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewAndContractRecommendationDeleteDialogComponent } from './review-and-contract-recommendation-delete-dialog.component';

describe('ReviewAndContractRecommendationDeleteDialogComponent', () => {
  let component: ReviewAndContractRecommendationDeleteDialogComponent;
  let fixture: ComponentFixture<ReviewAndContractRecommendationDeleteDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewAndContractRecommendationDeleteDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewAndContractRecommendationDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
