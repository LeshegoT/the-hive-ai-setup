import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, filter, map, of } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TopLevelTag, CanonicalNameDetails, RatificationCanonicalNameDetails, Staff, UserAttribute } from '@the-hive/lib-skills-shared';
import { TableService } from '../../../services/table.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CANCELLED_RATIFICATION_ACTION, CancelledRatificationAction, RATIFICATION_ACTION, RatificationAction } from '../../services/skills.service';
import { RatificationActionsComponent } from '../../../components/ratification-actions/ratification-actions.component';
import { AttributeRatificationTableService } from './attribute-ratification-table.service';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
import {  FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { EnvironmentService } from '../../../services/environment.service';
import { MatChip } from '@angular/material/chips';

export type SkillsEntityAndRatificationAction = {
  skillsEntity: CanonicalNameDetails,
  ratificationAction: RatificationAction
}
@Component({
  selector: 'app-attribute-ratification-table',
  templateUrl: './attribute-ratification-table.component.html',
  styleUrls: ['./attribute-ratification-table.component.css','../../../../styles.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    RatificationActionsComponent,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatChip
  ],
})
export class AttributeRatificationTableComponent implements OnInit, OnChanges {
    @Input() topLevelTag: TopLevelTag = undefined;
    @Input() selectedAttribute: CanonicalNameDetails = undefined;
    @Input() affectedStaffMembers:(Pick<Staff, 'upn' | 'displayName'> & UserAttribute)[];
    @Output() ratificationActionAndCanonicalNameDetails = new EventEmitter<SkillsEntityAndRatificationAction>();
    @Output() invokeAffectedStaffMembersView = new EventEmitter<CanonicalNameDetails>();
    pageSize$ = new BehaviorSubject<number>(10);
    pageIndex$ = new BehaviorSubject<number>(0);
    totalCount$ = new BehaviorSubject<number>(undefined);
    columns: string[] = ["canonicalName","actions"];
    ratificationAttributes$ = new BehaviorSubject<RatificationCanonicalNameDetails | BadRequestDetail>(undefined);
    attributeRatificationTable: MatTableDataSource<CanonicalNameDetails | BadRequestDetail> = undefined;
    editingRow: SkillsEntityAndRatificationAction = undefined;
    searchControl = new FormControl('');
    debounceTime: number;

    constructor(
      private tableService: TableService,
      private attributeRatificationTableService: AttributeRatificationTableService,
      private environmentService: EnvironmentService
    ){}

    ngOnChanges(changes: SimpleChanges) {
      if (changes['topLevelTag']) {
        this.resetTableState();
        this.retrieveUnratifiedAttributes();
      } else{
        // topLevelTag did not change, so we do not need to retrieve the canonicalNameDetails 
        // for the new topLevelTag
      }
    }

    ngOnInit() {
      this.pageSize$.next(this.tableService.getPageSize());
      this.resetTableState();
      this.retrieveUnratifiedAttributes();
      this.debounceTime =this.environmentService.getConfiguratonValues().SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
      this.searchControl.valueChanges.pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      ).subscribe(value => {
        this.searchAttribute(value);
      });
    }

    private resetTableState(): void {
      this.searchControl.setValue('');
      this.editingRow = undefined;
      this.attributeRatificationTable = undefined;
      this.ratificationAttributes$.next(undefined);
      this.pageIndex$.next(0);
      this.ratificationAttributes$
      .pipe(
        filter((attributes) => !!attributes),
        map((attributes) => {
          let data: (CanonicalNameDetails | BadRequestDetail)[];
          if (isError(attributes)) {
            data = [];
          } else if (attributes.canonicalNameDetails.length === 0 && this.searchControl.value) {
            data = [{message: `No ${this.topLevelTag.canonicalName}'s found matching the search text "${this.searchControl.value}"`}];
          } else {
            data = attributes.canonicalNameDetails;
            this.totalCount$.next(attributes.ratificationCount);
          }
          return new MatTableDataSource<CanonicalNameDetails | BadRequestDetail>(data);
        })
      )
      .subscribe((attributes) => this.attributeRatificationTable = attributes);
    }

    isError(attributes: BadRequestDetail | (CanonicalNameDetails | BadRequestDetail)[]): boolean { 
      return isError(attributes);
    }

    retrieveUnratifiedAttributes(searchText?:string): void {
      this.ratificationAttributes$.next(undefined);
      this.attributeRatificationTableService
        .retrieveUnratifiedAttributes(this.topLevelTag, this.pageIndex$.value, this.pageSize$.value, searchText)
        .pipe(catchError((error) => of({ message: error })))
        .subscribe((unratifiedAttributes) => this.ratificationAttributes$.next(unratifiedAttributes));
    }

    pageChanged(event: PageEvent) {
      this.pageIndex$.next(event.pageIndex);
      const oldPageSize = this.pageSize$.value;
      this.pageSize$.next(event.pageSize);
      const newPageSize = this.pageSize$.value;
      if(!this.ratificationAttributes$.value || isError(this.ratificationAttributes$.value) || newPageSize >= oldPageSize){
        this.retrieveUnratifiedAttributes(this.searchControl.value);
      } else {
        const filteredCanonicalNameDetails = this.ratificationAttributes$.value.canonicalNameDetails
          .filter((_, index) => index < newPageSize);
        
        const updatedAttributes: RatificationCanonicalNameDetails = {
          canonicalNameDetails: filteredCanonicalNameDetails,
          ratificationCount: this.ratificationAttributes$.value.ratificationCount
        };
        this.ratificationAttributes$.next(updatedAttributes);
      }
    }

    updateRatificationActionForAttribute(ratificationAction: RatificationAction, row: CanonicalNameDetails | BadRequestDetail){
      if(!isError(row)){
        this.editingRow = {
          skillsEntity: row,
          ratificationAction
        }
        this.ratificationActionAndCanonicalNameDetails.emit(this.editingRow);
      } else{
        // This row is an error, so no ratification actions can be performed on it
      }
    }

    isSelectedRow(row: CanonicalNameDetails | BadRequestDetail): boolean {
      return !isError(row) && this.editingRow?.skillsEntity.standardizedName === row.standardizedName;
    }

    onActionCompleted(completedAction: SkillsEntityAndRatificationAction | CancelledRatificationAction){
      if(completedAction === CANCELLED_RATIFICATION_ACTION){
        this.editingRow = undefined;
      } else if(isError(this.ratificationAttributes$.value)){
        this.retrieveUnratifiedAttributes();
      } else if(completedAction.ratificationAction === RATIFICATION_ACTION.accept || completedAction.ratificationAction === RATIFICATION_ACTION.reject || completedAction.ratificationAction === RATIFICATION_ACTION.merge){
        if(this.ratificationAttributes$.value.canonicalNameDetails.length <= 1){
          this.pageIndex$.next(this.pageIndex$.value + 1);
          this.retrieveUnratifiedAttributes();
        } else{
          const filteredCanonicalNameDetails = this.ratificationAttributes$.value.canonicalNameDetails
            .filter((attribute) => 
              !isError(attribute) &&
              attribute.standardizedName !== completedAction.skillsEntity.standardizedName
            );
          
          const updatedAttributes: RatificationCanonicalNameDetails = {
            canonicalNameDetails: filteredCanonicalNameDetails,
            ratificationCount: this.ratificationAttributes$.value.ratificationCount - 1
          };
          
          this.ratificationAttributes$.next(updatedAttributes);
        }
      } else{
        const updatedCanonicalNameDetails = this.ratificationAttributes$.value.canonicalNameDetails
          .map((attribute) => 
            !isError(attribute) &&
            attribute.standardizedName === completedAction.skillsEntity.standardizedName ? 
              completedAction.skillsEntity : attribute);
        
        const updatedAttributes: RatificationCanonicalNameDetails = {
          canonicalNameDetails: updatedCanonicalNameDetails,
          ratificationCount: this.ratificationAttributes$.value.ratificationCount
        };
        
        this.ratificationAttributes$.next(updatedAttributes);
      }
    }

    searchAttribute(newSearchText: string): void {
      this.pageIndex$.next(0);
      this.retrieveUnratifiedAttributes(newSearchText);
    }

    generateSupportEmail(badRequestDetail: BadRequestDetail): string {
      const subject = encodeURIComponent('Error on Ratification page');
      const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
      return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
    }
}