import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RegisteredUsers } from './registered-users.component';

describe('RegisteredUsers', () => {
  let component: RegisteredUsers;
  let fixture: ComponentFixture<RegisteredUsers>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegisteredUsers ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisteredUsers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
