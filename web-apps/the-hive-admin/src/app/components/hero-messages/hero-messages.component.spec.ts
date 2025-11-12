import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeroMessagesComponent } from './hero-messages.component';

describe('HeroMessagesComponent', () => {
  let component: HeroMessagesComponent;
  let fixture: ComponentFixture<HeroMessagesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HeroMessagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeroMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
