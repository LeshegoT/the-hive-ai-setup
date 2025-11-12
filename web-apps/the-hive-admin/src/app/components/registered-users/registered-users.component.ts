import { Component, EventEmitter, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { LevelUpService } from '../../services/level-up.service';
import { TableService } from '../../services/table.service';
import { RegisteredUser } from '../../shared/interfaces';
import { Location } from '@angular/common';

@Component({
    selector: 'registered-users',
    templateUrl: './registered-users.component.html',
    styleUrls: ['./registered-users.component.css'],
    standalone: false
})

export class RegisteredUsers implements OnInit, AfterViewInit {

  @Output() showSnackBar: EventEmitter<string> = new EventEmitter();
  @ViewChild(MatSort) levelUpSort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  levelUpDetails;
  levelUpId$;
  registeredUsersData = new MatTableDataSource<RegisteredUser[]>();
  registeredUsersDataKeys: (keyof RegisteredUser)[] = ['upn', 'bbdUserName', 'displayName', 'jobTitle', 'office'];
  registeredUsersColumn: string[] = [
    'Hero',
    'User Name',
    'Full Name',
    'Job Title',
    'Office',
  ];

  constructor(
    private route: ActivatedRoute,
    private levelUpService: LevelUpService,
    public tableService: TableService,
    private snackBar: MatSnackBar,
    private location: Location
  ) { }

  ngOnInit() {
    this.setRegisteredUsersData();
  }

  ngAfterViewInit() {
    this.registeredUsersData.sort = this.levelUpSort;
    this.registeredUsersData.paginator = this.paginator;
  }

  applyFilter(filterValue: string) {
    this.registeredUsersData.filter = filterValue.trim().toLowerCase();
  }

  setRegisteredUsersData() {
    this.levelUpId$ = this.route.paramMap.pipe(map((params: ParamMap) => params.get('levelUpId')));

    this.levelUpId$.pipe(switchMap((id) => this.levelUpService.getLevelUp(id))).subscribe((levelUpData) => {
      this.levelUpDetails = levelUpData;
      if (!this.levelUpDetails.users) {
        this.snackBar.open('Failed to load registered users.', '', { duration: 3000 });
      } else {
        this.registeredUsersData.data = this.levelUpDetails.users;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
