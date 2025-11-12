import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeContractorsPermanentComponent } from './make-contractors-permanent.component';

describe('MakeContractorsPermanentComponent', () => {
  let component: MakeContractorsPermanentComponent;
  let fixture: ComponentFixture<MakeContractorsPermanentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MakeContractorsPermanentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MakeContractorsPermanentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
