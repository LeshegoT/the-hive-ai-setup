import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StaffFilterComponent } from './staff-filter.component';

describe('StaffFilterComponent', () => {
  let component: StaffFilterComponent;
  let fixture: ComponentFixture<StaffFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
