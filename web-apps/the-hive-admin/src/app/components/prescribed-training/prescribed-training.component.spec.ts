import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrescribedTrainingComponent } from './prescribed-training.component';

describe('PrescribedTrainingComponent', () => {
  let component: PrescribedTrainingComponent;
  let fixture: ComponentFixture<PrescribedTrainingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrescribedTrainingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescribedTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
