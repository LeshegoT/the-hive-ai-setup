import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Contracts } from './contracts.page';

describe('Contracts', () => {
  let component: Contracts;
  let fixture: ComponentFixture<Contracts>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Contracts ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Contracts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
