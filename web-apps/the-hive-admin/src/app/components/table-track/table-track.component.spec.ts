import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableTrackComponent } from './table-track.component';

describe('TableTrackComponent', () => {
  let component: TableTrackComponent;
  let fixture: ComponentFixture<TableTrackComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableTrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
