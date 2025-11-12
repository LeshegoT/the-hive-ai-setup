import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private pageSize = 20;
  private pageSizeOptions = [5, 10, 25, 50];
  private showFirstLastButtons = true;
  private hidePageSize = false;
  constructor() {}

  getPageSize(): number {
    return this.pageSize;
  }

  getPageSizeOptions(): number[] {
    return this.pageSizeOptions;
  }

  getShowFirstLastButtons(): boolean {
    return this.showFirstLastButtons;
  }

  getHidePageSize(): boolean{
    return this.hidePageSize;
  }
}
