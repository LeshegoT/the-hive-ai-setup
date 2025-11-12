import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManageRestrictionsComponent } from './manage-restrictions.component';

describe('ManageRestrictionsComponent', () => {
  let component: ManageRestrictionsComponent;
  let fixture: ComponentFixture<ManageRestrictionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageRestrictionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageRestrictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
