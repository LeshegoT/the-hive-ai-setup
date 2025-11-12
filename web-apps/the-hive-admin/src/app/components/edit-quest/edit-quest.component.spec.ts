import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditQuestComponent } from './edit-quest.component';

describe('AssignGuideComponent', () => {
  let component: EditQuestComponent;
  let fixture: ComponentFixture<EditQuestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditQuestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
