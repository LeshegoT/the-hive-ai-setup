import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LevelUpService } from '../../services/level-up.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-level-up',
    templateUrl: './level-up.component.html',
    styleUrls: ['./level-up.component.css'],
    standalone: false
})
export class LevelUpComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  @ViewChild(MatSort) levelUpSort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  levelUpData = new MatTableDataSource();
  levelUpColumns = ['name', 'startDate', 'endDate', 'userCount', 'action'];

  constructor(private levelUpService: LevelUpService, public tableService: TableService) {}

  ngOnInit() {
    this.getLevelUps();
  }

  ngAfterViewInit() {
    this.levelUpData.sort = this.levelUpSort;
    this.levelUpData.paginator = this.paginator;
  }

  getLevelUps() {
    const levelUpsSubscription = this.levelUpService.getAllLevelUps().subscribe((levelUps) => {
      this.levelUpData.data = levelUps.reverse();
    });

    this.dataSubscription.add(levelUpsSubscription);
  }

  applyFilter(filterValue: string) {
    this.levelUpData.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
