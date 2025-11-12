import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateSideQuestComponent } from './create-side-quest.component';

describe('CreateSideQuestComponent', () => {
  let component: CreateSideQuestComponent;
  let fixture: ComponentFixture<CreateSideQuestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSideQuestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSideQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
