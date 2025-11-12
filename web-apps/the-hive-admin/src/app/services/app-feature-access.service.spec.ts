import { TestBed } from '@angular/core/testing';

import { AppFeatureAccessService } from './app-feature-access.service';

describe('AppFeatureAccessService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AppFeatureAccessService = TestBed.get(AppFeatureAccessService);
    expect(service).toBeTruthy();
  });
});
