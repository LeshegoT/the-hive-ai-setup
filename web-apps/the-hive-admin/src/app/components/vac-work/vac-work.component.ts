import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { VacWorkService } from '../../services/vac-work.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-vac-work',
    templateUrl: './vac-work.component.html',
    styleUrls: ['./vac-work.component.css'],
    standalone: false
})
export class VacWorkComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) reportSort: MatSort;
  peopleData = new MatTableDataSource();
  reportColumns = [
    'applicationId',
    'name',
    'idNumber',
    'email',
    'phone',
    'university',
    'degree',
    'status',
    'applicationDate',
    'documents',
  ];
  constructor(
    private vacWorkService: VacWorkService,
    private snackBar: MatSnackBar,
    public tableService: TableService
  ) {}

  ngOnInit() {
    this.getApplications();
  }

  getApplications() {
    const applicationsSubscription = this.vacWorkService.getApplications().subscribe((data) => {
      this.peopleData.data = data;
      this.peopleData.paginator = this.paginator;
      this.peopleData.sort = this.reportSort;
    });
    this.dataSubscription.add(applicationsSubscription);
  }

  downloadFile(fileId: string, saveAsName: string) {
    if(!fileId){
      this.showMessage('No file to download');
      return;
    }
    const fileSubscription = this.vacWorkService.getAttachmentUrl(fileId).subscribe((data) => {
      const a = document.createElement('a');
      a.download = saveAsName;
      a.href = data.url;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(data.url);
      }, 0);
    });
    this.dataSubscription.add(fileSubscription);
  }

  showMessage(message: string) {
    this.snackBar.open(message, '', { duration: 2000 });
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
