import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffContractListComponent } from './staff-contract-list.component';

describe('StaffContractListComponent', () => {
  let component: StaffContractListComponent;
  let fixture: ComponentFixture<StaffContractListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffContractListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StaffContractListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
