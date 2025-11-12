import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditSpecialisationsComponent } from './edit-specialisations.component';

describe('EditSpecialisationsComponent', () => {
  let component: EditSpecialisationsComponent;
  let fixture: ComponentFixture<EditSpecialisationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSpecialisationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpecialisationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
