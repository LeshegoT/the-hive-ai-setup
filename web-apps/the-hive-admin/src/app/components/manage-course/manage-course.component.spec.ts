import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManageCourseComponent } from './manage-course.component';

describe('ManageCourseComponent', () => {
  let component: ManageCourseComponent;
  let fixture: ComponentFixture<ManageCourseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageCourseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
