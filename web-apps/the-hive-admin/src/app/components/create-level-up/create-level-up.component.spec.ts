import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateLevelUpComponent } from './create-level-up.component';

describe('CreateLevelUpComponent', () => {
  let component: CreateLevelUpComponent;
  let fixture: ComponentFixture<CreateLevelUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateLevelUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateLevelUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
