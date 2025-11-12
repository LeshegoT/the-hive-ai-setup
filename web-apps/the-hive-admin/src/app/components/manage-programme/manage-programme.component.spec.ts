import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManageProgrammeComponent} from './manage-programme.component';

describe('ManageProgrammeComponent', () => {
  let component: ManageProgrammeComponent;
  let fixture: ComponentFixture<ManageProgrammeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ManageProgrammeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageProgrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
