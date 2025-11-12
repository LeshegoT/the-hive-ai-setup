import { TestBed } from '@angular/core/testing';

import { AccessManagementService } from './access-management.service';

describe('AccessManagementService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AccessManagementService = TestBed.get(AccessManagementService);
    expect(service).toBeTruthy();
  });
});
