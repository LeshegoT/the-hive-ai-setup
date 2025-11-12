import { Component, OnInit, ViewChild, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { QuestService } from '../../services/quest.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { GuidesService } from '../../services/guides.service';
import { TableService } from '../../services/table.service';

@Component({
    selector: 'app-all-heroes',
    templateUrl: './all-heroes.component.html',
    styleUrls: ['./all-heroes.component.css'],
    standalone: false
})
export class AllHeroesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() guide: string;

  private dataSubscription: Subscription = new Subscription();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) heroSort: MatSort;

  allHeroData = new MatTableDataSource();
  filteredData = new MatTableDataSource();
  allHeroColumns = [
    'heroUserPrincipleName',
    'specialisation',
    'goal',
    'comment',
    'guideUserPrincipleName',
    'startDate',
    'endDate',
    'lastHeroActivityDate',
    'pointsTotal',
  ];
  filters = {
    name: { value: '' },
    progress: { value: '' },
    expired: { value: '' },
  };

  constructor(private questService: QuestService, private guidesService: GuidesService, public tableService: TableService) {}

  ngOnInit() {
    this.getQuests();
  }

  ngAfterViewInit() {
    this.filteredData.sort = this.heroSort;
    this.filteredData.paginator = this.paginator;
  }

  getQuests() {
    const quests$ = this.guide
      ? this.guidesService.getGuidesHeroes(this.guide)
      : this.questService.allQuests();

    const allQuestSubscription = quests$.subscribe((quests) => {
      for (const quest of quests) {
        new Date(quest.endDate) < new Date()
          ? (quest.expired = 'expired')
          : (quest.expired = 'unexpired');
      }

      this.allHeroData.data = quests;
      this.filteredData.data = quests;
    });

    this.dataSubscription.add(allQuestSubscription);
  }

  encode(upn) {
    return btoa(upn);
  }

  applyFilter() {
    this.filteredData.data = this.allHeroData.data;
    this.filteredData.filter = '';

    if (this.filters['name'].value !== '') {
      this.filteredData.filter = this.filters['name'].value;
      this.filteredData.data = this.filteredData.filteredData;
    }

    if (this.filters['progress'].value !== '') {
      this.filteredData.filter = this.filters['progress'].value;
      this.filteredData.data = this.filteredData.filteredData;
    }

    if (this.filters['expired'].value !== '') {
      this.filteredData.filter = this.filters['expired'].value;
      this.filteredData.data = this.filteredData.filteredData;
    }
  }

  filterName(filterValue: string) {
    this.filters['name'].value = filterValue.trim().toLowerCase();
    this.applyFilter();
  }

  filterInProgress(checked: boolean) {
    checked
      ? (this.filters['progress'].value = 'in-progress')
      : (this.filters['progress'].value = '');
    this.applyFilter();
  }

  filterUnexpired(checked: boolean) {
    checked
      ? (this.filters['expired'].value = 'unexpired')
      : (this.filters['expired'].value = '');
    this.applyFilter();
  }

  updateCommentCheckEmpty(questId, newComment: string) {
    if (newComment) {
      this.updateComment(questId, newComment);
    }
  }

  updateComment(questId, newComment: string) {
    const updateCommentSubcription = this.questService
      .updateAdminQuestComment(questId, newComment)
      .subscribe();
    this.dataSubscription.add(updateCommentSubcription);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
