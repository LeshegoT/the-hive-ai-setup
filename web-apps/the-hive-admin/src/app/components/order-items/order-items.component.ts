import { Component, OnInit, ViewChild, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { OrderItemsFilterParameters } from '../../shared/interfaces';
import { OrderItemsService } from '../../services/order-items.service';
import { TableService } from '../../services/table.service';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface PageInformation {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

@Component({
    selector: 'app-order-items',
    templateUrl: './order-items.component.html',
    styleUrls: ['./order-items.component.css'],
    standalone: false
})
export class OrderItemsComponent implements OnInit, OnChanges {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(StaffFilterComponent) staffFilterComponent;
  filterParameters: OrderItemsFilterParameters;
  orderItemStatuses: Observable<any>;
  orderItemData = new MatTableDataSource();
  orderItemColumns = ['orderId' , 'displayName', 'itemName', 'variantName', 'itemQuantity', 'orderDate', 'city', 'itemStatus'];
  selectedOrderItemStatus: number;

  currentPageInfo: PageInformation = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: undefined,
    resultSetSize: undefined,
  };

  constructor(
    public tableService: TableService,
    public orderItemsService: OrderItemsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadStatuses();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.orderItemData.data = [];
    this.loadData();
    this.loadStatuses();
  }

  loadStatuses() {
    this.orderItemsService.getOrderItemStatuses().subscribe((response) => {
      this.orderItemStatuses = response;
    });
  }

  loadData() {
    this.orderItemData.data = undefined;
    this.orderItemsService
      .getOrderItems(this.currentPageInfo.pageNumber, this.currentPageInfo.pageSize, this.filterParameters)
      .subscribe(
        (response) => {
          this.currentPageInfo = response.pageInfo;
          this.orderItemData.data = response.data;
          this.orderItemData.sort = this.sort;
        },
        (err) => {
          this.orderItemData.data = [];
        }
      );
  }

  pageChanged(event: PageEvent) {
    this.currentPageInfo.pageSize = event.pageSize;
    this.currentPageInfo.pageNumber = event.pageIndex + 1;
    this.loadData();
  }

  resetPageInfo() {
    this.currentPageInfo = {
      pageNumber: 1,
      pageSize: 10,
      totalPages: undefined,
      resultSetSize: undefined,
    };
  }

  selectStaff() {
    this.resetPageInfo();
    const upn = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    this.filterParameters = {
      userPrincipleName: upn,
    };
    this.loadData();
  }

  clearFilter() {
    this.resetPageInfo();
    this.filterParameters = {};
    this.loadData();
  }

  updateOrderItem(orderItem) {
    this.orderItemsService
      .updateOrderItem({
        id: orderItem.orderItemId,
        orderItemStatusId: orderItem.orderItemStatusId,
      })
      .subscribe(
        (result) => {
          this.showSnackBar('Update Successful');
        },
        (err) => {
          this.showSnackBar('Update Failed: ' + err);
        }
      );
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'Dismiss', { duration: 3000 });
  }
}
