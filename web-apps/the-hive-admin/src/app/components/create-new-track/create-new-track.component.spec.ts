import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewTrackComponent } from './create-new-track.component';

describe('CreateNewTrackComponent', () => {
  let component: CreateNewTrackComponent;
  let fixture: ComponentFixture<CreateNewTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewTrackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
