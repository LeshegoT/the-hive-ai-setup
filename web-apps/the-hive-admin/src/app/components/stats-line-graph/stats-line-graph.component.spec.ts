import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatsLineGraphComponent } from './stats-line-graph.component';

describe('StatsLineGraphComponent', () => {
  let component: StatsLineGraphComponent;
  let fixture: ComponentFixture<StatsLineGraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsLineGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsLineGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
