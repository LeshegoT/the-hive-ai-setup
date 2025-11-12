import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContractsToDoComponent } from './to-do.tab';


describe('ContractsToDoComponent', () => {
  let component: ContractsToDoComponent;
  let fixture: ComponentFixture<ContractsToDoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractsToDoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractsToDoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
