import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllHeroesComponent } from './all-heroes.component';

describe('AllHeroesComponent', () => {
  let component: AllHeroesComponent;
  let fixture: ComponentFixture<AllHeroesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AllHeroesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllHeroesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
