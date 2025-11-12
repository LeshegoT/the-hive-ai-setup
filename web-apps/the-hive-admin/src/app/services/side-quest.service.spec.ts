import { TestBed } from '@angular/core/testing';

import { SideQuestService } from './side-quest.service';

describe('SideQuestService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SideQuestService = TestBed.get(SideQuestService);
    expect(service).toBeTruthy();
  });
});
