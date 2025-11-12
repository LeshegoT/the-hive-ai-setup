import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableLevelUpComponent } from './table-level-up.component';

describe('TableLevelUpComponent', () => {
  let component: TableLevelUpComponent;
  let fixture: ComponentFixture<TableLevelUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableLevelUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableLevelUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
