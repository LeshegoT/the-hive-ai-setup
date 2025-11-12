import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateLevelUpActivityTypeComponent } from './create-level-up-activity-type.component';

describe('CreateLevelUpActivityTypeComponent', () => {
  let component: CreateLevelUpActivityTypeComponent;
  let fixture: ComponentFixture<CreateLevelUpActivityTypeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateLevelUpActivityTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateLevelUpActivityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
