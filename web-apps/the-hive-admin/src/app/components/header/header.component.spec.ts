import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { MaterialModule } from '../../material.module';
import { AppModule } from '../../app.module';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, AppModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check iconName', () => {
    expect(component.iconName).toBe('');
  });

  it('should check title', () => {
    expect(component.title).toBe('');
  });

  it('should check Logo path', () => {
    expect(component.LOGO_PATH).toEqual('../../../assets/images/logos/');
  });
});
