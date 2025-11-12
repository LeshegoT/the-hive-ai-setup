import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { map, Observable, startWith } from 'rxjs';
import { GuidesService } from '../../services/guides.service';
import { HeroesService } from '../../services/heroes.service';
import { TableService } from '../../services/table.service';
import { Guide, Hero } from '../../shared/interfaces';

type GuideStatus = 'active' | 'pending-delete';

@Component({
    selector: 'app-reassign-guides-heroes',
    imports: [
        MatCardModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        CdkDropListGroup,
        CdkDropList,
        CdkDrag,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        AsyncPipe,
        MatIconModule
    ],
    templateUrl: './reassign-guides-heroes.component.html',
    styleUrl: './reassign-guides-heroes.component.css'
})
export class ReassignGuidesHeroesComponent implements OnInit {

  @ViewChild('guideSort') guideSort: MatSort;
  @ViewChild('guidePaginator') guidePaginator: MatPaginator;

  guides: Guide[] = [];
  guidesColumns = ['userPrincipleName', 'guideStatus', 'heroes', 'specialisations'];

  sourceGuide: Guide;
  targetGuide: Guide;

  sourceGuideHeroes: Hero[];
  targetGuideHeroes: Hero[];

  sourceGuideForm = new FormControl<string | Guide>('');
  sourceGuideFilteredOptions: Observable<Guide[]>;

  targetGuideForm = new FormControl<string | Guide>('');
  targetGuideFilteredOptions: Observable<Guide[]>;

  constructor(private guidesService: GuidesService,
              private heroesService: HeroesService,
              public tableService: TableService,
              private snackBar: MatSnackBar) {}

  ngOnInit(): void {
      this.fetchGuides();
  }

  fetchGuides() {
    this.guidesService.getAllGuides().subscribe((guides) => {
      this.guides = guides;
      this.sourceGuideFilteredOptions = this.sourceGuideForm.valueChanges.pipe(
        startWith(''),
        map(value => {
          const guidePrincipleName = typeof value === 'string' ? value : value?.userPrincipleName;
          return this.guideOptionsFilter(guidePrincipleName, 'pending-delete');
        })
      );

      this.targetGuideFilteredOptions = this.targetGuideForm.valueChanges.pipe(
        startWith(''),
        map(value => {
          const guidePrincipleName = typeof value === 'string' ? value : value?.userPrincipleName;
          return this.guideOptionsFilter(guidePrincipleName, 'active');
        })
      )
    });
  }

  reassignHero(event: CdkDragDrop<Hero[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const heroToReassign: Hero = event.previousContainer.data[event.previousIndex];
      if (event.previousContainer.data == this.sourceGuideHeroes) {
        heroToReassign.guideUserPrincipleName = this.targetGuide.userPrincipleName;
        this.heroesService.updateHerosGuide(heroToReassign).subscribe({
          next: (_res) => {
            this.snackBar.open("Guide successfully updated", 'Dismiss', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error, 'Dismiss', { duration: 3000 });
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex,
            );
          }
        });
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      } else {
        this.snackBar.open("Cannot reassign the hero to a guide with a status of 'pending-delete'.", 'Dismiss', { duration: 3000 });
      }
    }
  }

  setSourceGuide(event: MatAutocompleteSelectedEvent) {
    this.sourceGuide = event.option.value;
    this.sourceGuideForm.setValue('');
    this.guidesService.getGuidesHeroes(this.sourceGuide.userPrincipleName).subscribe((heroes) => {
      this.sourceGuideHeroes = heroes;
    });
  }

  setTargetGuide(event: MatAutocompleteSelectedEvent) {
    this.targetGuide = event.option.value;
    this.targetGuideForm.setValue('');
    this.guidesService.getGuidesHeroes(this.targetGuide.userPrincipleName).subscribe((heroes) => {
      this.targetGuideHeroes = heroes;
    });
  }

  private guideOptionsFilter(guidePrincipleName: string, status: GuideStatus): Guide[] {
    if (guidePrincipleName) {
      guidePrincipleName = guidePrincipleName.toLowerCase();
      return this.guides.filter(guide => guide.guideStatus == status && guide.userPrincipleName.includes(guidePrincipleName));
    } else {
      return this.guides.filter(guide => guide.guideStatus == status);
    }
  }
}
