import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContractsOverviewComponent } from './contracts-overview.tab';


describe('ContractsOverviewComponent', () => {
  let component: ContractsOverviewComponent;
  let fixture: ComponentFixture<ContractsOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractsOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
