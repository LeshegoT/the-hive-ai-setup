import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContractsOverviewList } from './contracts-overview-list.component';


describe('ContractsOverviewList', () => {
  let component: ContractsOverviewList;
  let fixture: ComponentFixture<ContractsOverviewList>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractsOverviewList ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractsOverviewList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});