import { TestBed } from '@angular/core/testing';

import { OrderItemsService } from './order-items.service';

describe('OrderItemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OrderItemsService = TestBed.get(OrderItemsService);
    expect(service).toBeTruthy();
  });
});
