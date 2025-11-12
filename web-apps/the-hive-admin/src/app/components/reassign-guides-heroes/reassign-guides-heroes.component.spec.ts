import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReassignGuidesHeroesComponent } from './reassign-guides-heroes.component';

describe('ReassignGuidesHeroesComponent', () => {
  let component: ReassignGuidesHeroesComponent;
  let fixture: ComponentFixture<ReassignGuidesHeroesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReassignGuidesHeroesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReassignGuidesHeroesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
