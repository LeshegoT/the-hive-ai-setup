import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateProgrammeComponent } from './create-programme.component';

describe('CreateProgrammeComponent', () => {
  let component: CreateProgrammeComponent;
  let fixture: ComponentFixture<CreateProgrammeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateProgrammeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProgrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
