import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractOverviewFilter } from './contracts-overview-filter.component';

describe('ContractOverviewFilter', () => {
  let component: ContractOverviewFilter;
  let fixture: ComponentFixture<ContractOverviewFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractOverviewFilter]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractOverviewFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
