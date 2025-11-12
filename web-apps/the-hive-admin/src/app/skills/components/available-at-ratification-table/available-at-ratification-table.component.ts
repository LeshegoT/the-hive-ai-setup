import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, catchError, filter, map, of } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AttributeCanonicalNameDetailsWithInstitution, AttributeCanonicalNameDetailsWithInstitutionItem, CanonicalNameDetails } from '@the-hive/lib-skills-shared';
import { TableService } from '../../../services/table.service';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CANCELLED_RATIFICATION_ACTION, CancelledRatificationAction, RATIFICATION_ACTION, RatificationAction } from '../../services/skills.service';
import { RatificationActionsComponent } from '../../../components/ratification-actions/ratification-actions.component';
import { AvailableAtRatificationTableService } from './available-at-ratification-table.service';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
import { MatChip } from '@angular/material/chips';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EnvironmentService } from '../../../services/environment.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export type AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction = {
  attributeCanonicalNameDetailsWithInstitution: AttributeCanonicalNameDetailsWithInstitutionItem,
  ratificationAction: RatificationAction
}
@Component({
  selector: 'app-available-at-ratification-table',
  templateUrl: './available-at-ratification-table.component.html',
  styleUrls: ['../attribute-ratification-table/attribute-ratification-table.component.css', '../../../../styles.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    RatificationActionsComponent,
    MatChip,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
})
export class AvailableAtRatificationTableComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @Input() unratifiedAvailableAtCount: number = undefined;
    @Input() selectedAttribute: CanonicalNameDetails = undefined;
    @Output() ratificationActionAndCanonicalNameDetails = new EventEmitter<AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction>();
    @Output() invokeAffectedStaffMembersView = new EventEmitter<CanonicalNameDetails>();
    pageSize$ = new BehaviorSubject<number>(10);
    pageIndex$ = new BehaviorSubject<number>(0);
    columns: string[] = ["canonicalName", "institution", "actions"];
    availableAtRatificationAttributes$ = new BehaviorSubject<AttributeCanonicalNameDetailsWithInstitution | BadRequestDetail>(undefined);
    availableAtRatificationTable: MatTableDataSource<AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail> = undefined;
    editingRow: AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction = undefined;
    totalCount$ = new BehaviorSubject<number>(undefined);
    searchControl = new FormControl('');
    debounceTime: number;

    constructor(
      private tableService: TableService,
      private availableAtRatificationTableService: AvailableAtRatificationTableService,
      private environmentService: EnvironmentService,
    ){}

    ngOnInit() {
      this.pageSize$.next(this.tableService.getPageSize());
      this.editingRow = undefined;
      this.availableAtRatificationTable = undefined;
      this.pageIndex$.next(0);
      this.availableAtRatificationAttributes$
        .pipe(
          filter((attributes) => !!attributes),
          map((attributes) => {
            let data: (AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail)[];
            if (isError(attributes)) {
               this.totalCount$.next(0);
              data = [attributes];
            } else if (attributes.canonicalNameDetails.length === 0 && this.searchControl.value) {
              this.totalCount$.next(0);
              data = [{message: `No attributes found matching the search text "${this.searchControl.value}"`}];
            } else {
              data = attributes.canonicalNameDetails as (AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail)[];
              this.totalCount$.next(attributes.ratificationCount);
            }
            return new MatTableDataSource<AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail>(data);
          })
        )
        .subscribe((attributes) => this.availableAtRatificationTable = attributes);
      this.retrieveAttributesWithInstitution();
      this.debounceTime = this.environmentService.getConfiguratonValues().SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
      this.searchControl.valueChanges.pipe(
        map(value => value.trim()),
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      ).subscribe(() => {
        this.resetPagination();
        this.retrieveAttributesWithInstitution();
      });
    }

    isError(attributes: BadRequestDetail | AttributeCanonicalNameDetailsWithInstitution): boolean {
      return isError(attributes);
    }

    retrieveAttributesWithInstitution() {
      this.availableAtRatificationAttributes$.next(undefined);
      this.availableAtRatificationTableService
      .retrieveAttributeCanonicalNameDetailsWithInstitution(this.pageIndex$.value, this.pageSize$.value, this.searchControl.value)
      .pipe(catchError((error) => of({ message: error })))
      .subscribe((attributesWithInstitution) => this.availableAtRatificationAttributes$.next(attributesWithInstitution));
    }

    pageChanged(event: PageEvent) {
      this.pageIndex$.next(event.pageIndex);
      this.pageSize$.next(event.pageSize);
      this.retrieveAttributesWithInstitution();
    }

    updateRatificationActionForAvailableAt(ratificationAction: RatificationAction, row: AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail){
      if(!isError(row)){
        this.editingRow = {
          attributeCanonicalNameDetailsWithInstitution: row,
          ratificationAction
        }
        this.ratificationActionAndCanonicalNameDetails.emit(this.editingRow);
      } else{
        // This row is an error, so no ratification actions can be performed on it
      }
    }

    isSelectedRow(row: AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail): boolean {
      return !isError(row) && this.editingRow?.attributeCanonicalNameDetailsWithInstitution.standardizedName === row.standardizedName;
    }

    getInstitutionCanonicalName(
      attributeCanonicalNameDetailsWithInstitution: AttributeCanonicalNameDetailsWithInstitutionItem | BadRequestDetail,
    ): string | BadRequestDetail {
      if (isError(attributeCanonicalNameDetailsWithInstitution)) {
        return attributeCanonicalNameDetailsWithInstitution;
      } else{
        const availableAt = attributeCanonicalNameDetailsWithInstitution.availableAt;
        const firstAvailableAtInstitution = availableAt[0];
        if (isError(firstAvailableAtInstitution)) {
          return firstAvailableAtInstitution;
        } else{
          return firstAvailableAtInstitution.canonicalName;
        }
      }
    }

    onActionCompleted(completedAction: AttributeCanonicalNameDetailsWithInstitutionAndRatificationAction | CancelledRatificationAction){
      if(completedAction === CANCELLED_RATIFICATION_ACTION){
        this.editingRow = undefined;
      } else if(isError(this.availableAtRatificationAttributes$.value)){
        this.retrieveAttributesWithInstitution();
      } else if(completedAction.ratificationAction === RATIFICATION_ACTION.accept || completedAction.ratificationAction === RATIFICATION_ACTION.reject){
        this.retrieveAttributesWithInstitution();
      } else{
        const currentData = this.availableAtRatificationAttributes$.value;
        if (!isError(currentData)) {
          const updatedCanonicalNameDetails = currentData.canonicalNameDetails.map((attribute) => 
            !isError(attribute) &&
            attribute.standardizedName === completedAction.attributeCanonicalNameDetailsWithInstitution.standardizedName ? 
              completedAction.attributeCanonicalNameDetailsWithInstitution : attribute
          );
          
          this.availableAtRatificationAttributes$.next({
            ...currentData,
            canonicalNameDetails: updatedCanonicalNameDetails
          });
        }
      }
    }

    resetPagination() {
      this.pageIndex$.next(0);
      if (this.paginator) {
        this.paginator.firstPage();
      } else {
        // Paginator is not initialized yet; will use the pageIndex$ value once it becomes available.
      }
    }

    generateSupportEmail(badRequestDetail: BadRequestDetail): string {
      const subject = encodeURIComponent('Error on Ratification page');
      const body = encodeURIComponent(`Hi,\n\nI am getting this error on Ratification page: "${badRequestDetail.message}".`);
      return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
    }
}