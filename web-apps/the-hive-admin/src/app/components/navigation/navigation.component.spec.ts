import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { MaterialModule } from '../../../material.module';
import { AppModule } from '../../../app.module';

xdescribe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, AppModule],
      declarations: []
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
