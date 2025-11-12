import { TestBed } from '@angular/core/testing';

import { ProgrammeService } from './programme.service';
import { AppModule } from '../app.module';

describe('ProgrammeService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppModule],
    })
  );

  it('should be created', () => {
    const service: ProgrammeService = TestBed.get(ProgrammeService);
    expect(service).toBeTruthy();
  });
});
