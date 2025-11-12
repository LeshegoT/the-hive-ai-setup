import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableCourseComponent } from './table-course.component';

describe('TableCourseComponent', () => {
  let component: TableCourseComponent;
  let fixture: ComponentFixture<TableCourseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCourseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
