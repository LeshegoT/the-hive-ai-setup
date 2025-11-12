import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableCourseProgressComponent } from './table-course-progress.component';
import { MaterialModule } from '../../../material.module';
import { AppModule } from '../../../app.module';

describe('TableCourseProgressComponent', () => {
  let component: TableCourseProgressComponent;
  let fixture: ComponentFixture<TableCourseProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, AppModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCourseProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
