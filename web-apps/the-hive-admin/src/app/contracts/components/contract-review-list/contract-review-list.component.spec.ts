import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractReviewListComponent } from './contract-review-list.component';

describe('ContractReviewListComponent', () => {
  let component: ContractReviewListComponent;
  let fixture: ComponentFixture<ContractReviewListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractReviewListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractReviewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
