import { TestBed } from '@angular/core/testing';

import { UserProgressService } from './user-progress.service';
import { AppModule } from '../app.module';

describe('UserProgressService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
  );

  it('should be created', () => {
    const service: UserProgressService = TestBed.get(UserProgressService);
    expect(service).toBeTruthy();
  });
});
