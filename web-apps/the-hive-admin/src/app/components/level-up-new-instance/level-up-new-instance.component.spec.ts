import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LevelUpNewInstanceComponent } from './level-up-new-instance.component';

describe('LevelUpNewInstanceComponent', () => {
  let component: LevelUpNewInstanceComponent;
  let fixture: ComponentFixture<LevelUpNewInstanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LevelUpNewInstanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LevelUpNewInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
