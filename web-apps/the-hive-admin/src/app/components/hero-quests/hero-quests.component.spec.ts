import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeroQuestsComponent } from './hero-quests.component';

describe('HeroQuestsComponent', () => {
  let component: HeroQuestsComponent;
  let fixture: ComponentFixture<HeroQuestsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HeroQuestsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeroQuestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
