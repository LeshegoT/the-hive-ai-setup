import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractsSearchBarComponent } from './contracts-search-bar.component';

describe('ContractsSearchBarComponent', () => {
  let component: ContractsSearchBarComponent;
  let fixture: ComponentFixture<ContractsSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractsSearchBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractsSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
