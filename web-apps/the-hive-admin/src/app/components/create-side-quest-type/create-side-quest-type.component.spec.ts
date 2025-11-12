import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateSideQuestTypeComponent } from './create-side-quest-type.component';

describe('CreateSideQuestTypeComponent', () => {
  let component: CreateSideQuestTypeComponent;
  let fixture: ComponentFixture<CreateSideQuestTypeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSideQuestTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSideQuestTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
