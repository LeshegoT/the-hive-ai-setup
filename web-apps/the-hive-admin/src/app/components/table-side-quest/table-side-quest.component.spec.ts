import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableSideQuestComponent } from './table-side-quest.component';

describe('TableSideQuestComponent', () => {
  let component: TableSideQuestComponent;
  let fixture: ComponentFixture<TableSideQuestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableSideQuestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableSideQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
