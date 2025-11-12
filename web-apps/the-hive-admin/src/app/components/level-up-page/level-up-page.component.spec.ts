import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelUpPageComponent } from './level-up-page.component';

describe('LevelUpPageComponent', () => {
  let component: LevelUpPageComponent;
  let fixture: ComponentFixture<LevelUpPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LevelUpPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelUpPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
