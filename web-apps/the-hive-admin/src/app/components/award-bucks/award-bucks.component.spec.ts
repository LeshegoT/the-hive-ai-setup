import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AwardBucksComponent } from './award-bucks.component';

describe('AwardBucksComponent', () => {
  let component: AwardBucksComponent;
  let fixture: ComponentFixture<AwardBucksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AwardBucksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AwardBucksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
