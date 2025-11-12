import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDropDownOptionsComponent } from './filter-drop-down-options.component';

describe('FilterDropDownOptionsComponent', () => {
  let component: FilterDropDownOptionsComponent;
  let fixture: ComponentFixture<FilterDropDownOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterDropDownOptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterDropDownOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
