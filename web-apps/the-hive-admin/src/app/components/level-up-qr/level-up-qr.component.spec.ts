import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LevelUpQrComponent } from './level-up-qr.component';

describe('LevelUpQrComponent', () => {
  let component: LevelUpQrComponent;
  let fixture: ComponentFixture<LevelUpQrComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LevelUpQrComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LevelUpQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
