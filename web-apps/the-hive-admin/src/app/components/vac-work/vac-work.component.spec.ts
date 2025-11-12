import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VacWorkComponent } from './vac-work.component';

describe('VacWorkComponent', () => {
  let component: VacWorkComponent;
  let fixture: ComponentFixture<VacWorkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VacWorkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VacWorkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
