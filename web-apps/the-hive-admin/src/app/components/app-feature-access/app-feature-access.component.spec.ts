import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppFeatureAccessComponent } from './app-feature-access.component';

describe('AppFeatureAccessComponent', () => {
  let component: AppFeatureAccessComponent;
  let fixture: ComponentFixture<AppFeatureAccessComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppFeatureAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppFeatureAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
