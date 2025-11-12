import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LevelUpDetailsComponent } from './level-up-details.component';

describe('LevelUpDetailsComponent', () => {
  let component: LevelUpDetailsComponent;
  let fixture: ComponentFixture<LevelUpDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LevelUpDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LevelUpDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
