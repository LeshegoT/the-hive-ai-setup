import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatsIndividualViewComponent } from './stats-individual-view.tab';

describe('StatsIndividualViewComponent', () => {
  let component: StatsIndividualViewComponent;
  let fixture: ComponentFixture<StatsIndividualViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsIndividualViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsIndividualViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
