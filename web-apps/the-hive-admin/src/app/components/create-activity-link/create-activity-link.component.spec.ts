import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateActivityLinkComponent } from './create-activity-link.component';

describe('CreateActivityLinkComponent', () => {
  let component: CreateActivityLinkComponent;
  let fixture: ComponentFixture<CreateActivityLinkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateActivityLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateActivityLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
