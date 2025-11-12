import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatePickerComponent } from './date-picker.component';
import { MaterialModule } from '../../../material.module';
import { AppModule } from '../../../app.module';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, AppModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create a new formcontrol', () => {
    expect(component.date).toBeTruthy();
  });
});
