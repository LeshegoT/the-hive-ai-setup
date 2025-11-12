import { TestBed } from '@angular/core/testing';

import { ContractOverviewsService } from './contracts-overview.service';

describe('ContractOverviewsService', () => {
  let service: ContractOverviewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContractOverviewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
