import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GuideMonitorComponent } from './guide-monitor.component';

describe('GuideMonitorComponent', () => {
  let component: GuideMonitorComponent;
  let fixture: ComponentFixture<GuideMonitorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GuideMonitorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuideMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
