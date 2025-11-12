import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStaffContractComponent } from './create-staff-contract.component';

describe('CreateStaffContractComponent', () => {
  let component: CreateStaffContractComponent;
  let fixture: ComponentFixture<CreateStaffContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStaffContractComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateStaffContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
