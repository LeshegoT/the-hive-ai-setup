import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManageUnitsComponent } from './manage-units.component';

describe('ManageUnitsComponent', () => {
  let component: ManageUnitsComponent;
  let fixture: ComponentFixture<ManageUnitsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageUnitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
