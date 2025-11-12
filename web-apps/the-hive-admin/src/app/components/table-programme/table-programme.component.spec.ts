import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TableProgrammeComponent } from './table-programme.component';

describe('TableProgrammeComponent', () => {
  let component: TableProgrammeComponent;
  let fixture: ComponentFixture<TableProgrammeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableProgrammeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableProgrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
