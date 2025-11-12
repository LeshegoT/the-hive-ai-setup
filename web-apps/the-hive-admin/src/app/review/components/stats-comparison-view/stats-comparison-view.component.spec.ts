import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatsComparisonViewComponent } from './stats-comparison-view.component';

describe('StatsComparisonViewComponent', () => {
  let component: StatsComparisonViewComponent;
  let fixture: ComponentFixture<StatsComparisonViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsComparisonViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsComparisonViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
