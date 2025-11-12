import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeStaffToContractorComponent } from './change-staff-to-contractor.component';

describe('ChangeStaffToContractorComponent', () => {
  let component: ChangeStaffToContractorComponent;
  let fixture: ComponentFixture<ChangeStaffToContractorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeStaffToContractorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeStaffToContractorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
