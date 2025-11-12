import { TestBed } from '@angular/core/testing';

import { ProfileService } from './profile.service';
import { AppModule } from '../app.module';

describe('ProfileService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
  );

  it('should be created', () => {
    const service: ProfileService = TestBed.get(ProfileService);
    expect(service).toBeTruthy();
  });
});
