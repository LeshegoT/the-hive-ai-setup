import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedService } from './shared.service';
import { OrderItemsFilterParameters } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class OrderItemsService {
  constructor(private sharedService: SharedService) {}

  getOrderItems(
    currentPage: number,
    currentPageSize: number,
    filterParameters: OrderItemsFilterParameters
  ): Observable<any> {
    const queryFilterParameters = this.createParameterQuery(filterParameters);
    return this.sharedService.get(`/orderItems/?page=${currentPage}&size=${currentPageSize}${queryFilterParameters}`);
  }

  updateOrderItem(orderItemData: { id: number; orderItemStatusId: number }): Observable<any> {
    return this.sharedService.patch(`/orderItems/${orderItemData.id}`, orderItemData);
  }

  getOrderItemStatuses(): Observable<any> {
    return this.sharedService.get(`/orderItemStatuses/`);
  }

  createParameterQuery(filterParameters: OrderItemsFilterParameters) {
    let filterQuery = '';

    for (const property in filterParameters) {
      if (filterParameters[property] && filterParameters[property] != '') {
        filterQuery += `&${property}=${filterParameters[property]}`;
      }
    }

    return filterQuery;
  }
}
