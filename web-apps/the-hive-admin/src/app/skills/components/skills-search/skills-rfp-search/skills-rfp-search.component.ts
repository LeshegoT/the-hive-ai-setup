/**@format */
import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Attribute, AttributeType, EntityCount, StandardizedName, CanonicalNameDetails } from "@the-hive/lib-skills-shared";
import { forkJoin } from 'rxjs';
import { SelectCompanyEntities } from "../../../../components/select-company-entity/select-company-entity.component";
import { SelectOffices } from '../../../../components/select-office/select-office.component';
import { Office } from '../../../../services/offices-service';
import { CompanyEntity } from "../../../../services/company-entities.service";
import { EnvironmentService } from "../../../../services/environment.service";
import { FileService } from "../../../../services/file.service";
import { SkillsService } from "../../../services/skills.service";
import { SkillsSearchBarComponent } from '../../skills-search-bar/skills-search-bar.component';
import { SkillsSearchSharedFiltersService } from '../../../services/skills-search-shared-filters.service';

type AttributeList = {
  attributeType: AttributeType;
  standardizedName: StandardizedName;
  canonicalName: string;
  staffCount: number;
  displayedSkillPath: string;
} & EntityCount;

@Component({
    selector: "skills-rfp-search",
    templateUrl: "./skills-rfp-search.component.html",
    styleUrls: ["./skills-rfp-search.component.css"],
    imports: [
        CommonModule,
        MatSnackBarModule,
        MatTableModule,
        MatCardModule,
        MatIcon,
        MatButtonModule,
        ReactiveFormsModule,
        FormsModule,
        MatAutocompleteModule,
        MatInputModule,
        SelectCompanyEntities,
        SelectOffices,
        SkillsSearchBarComponent,
    ]
})

export class RFPSearchComponent implements AfterViewInit {
  searchedValue:string = undefined;
  snackBarDuration: number;
  minimumSearchCharacters: number = undefined;
  attributeList = new MatTableDataSource<
    AttributeList
  >([]);
  standardColumns = ["name", "type", "staffCount"];
  selectedEntities: CompanyEntity[] = [];
  selectedOffices: Office[] = [];
  displayedColumns = [...this.standardColumns];
  errorMessage: string = undefined;
  @ViewChild(SelectCompanyEntities) selectCompanyEntitiesComponent: SelectCompanyEntities;
  @ViewChild(SelectOffices) selectOfficeComponent: SelectOffices;

  constructor(
    private readonly skillsService: SkillsService,
    private readonly fileService: FileService,
    private readonly matSnackBar: MatSnackBar,
    private readonly environmentService: EnvironmentService,
    private readonly skillsSearchSharedFiltersService: SkillsSearchSharedFiltersService
  ) {
    this.snackBarDuration = this.environmentService.getConfiguratonValues().SNACKBAR_DURATION;
    this.minimumSearchCharacters = this.environmentService.getConfiguratonValues().SKILL_MIN_SEARCH_CHARACTERS;
  }

  ngAfterViewInit() {
    this.skillsSearchSharedFiltersService.selectedCompanyEntities.subscribe(selectedCompanyEntities => {
      this.selectCompanyEntitiesComponent.setSelectedEntities(selectedCompanyEntities);
      this.selectedEntities = selectedCompanyEntities;
    });
    this.skillsSearchSharedFiltersService.selectedOffices.subscribe(selectedOffices => {
      this.selectOfficeComponent.setSelectedOffices(selectedOffices);
      this.selectedOffices = selectedOffices;
    });
  }

  private updateAttributeList(standardizedName: StandardizedName) {
    this.errorMessage = undefined;
    if (this.hasSelectedOffices()) {
    this.skillsService.getAttributeSummary(standardizedName, this.selectedOffices).subscribe({
      next: (attributeSummary) => {
        const attribute = this.createAttributeFromSummary(attributeSummary);
        
        if (this.attributeList.data.some((attributeInList) => attributeInList.standardizedName === attribute.standardizedName)) {
          this.matSnackBar.open(`${attribute.canonicalName} is already in the list`, "Dismiss", {
            duration: this.snackBarDuration,
          });
        } else {
          this.attributeList.data = [...this.attributeList.data, attribute];
        }
      },
      error: (error) => {
        this.matSnackBar.open(`Something went wrong while fetching the attribute summary for ${this.searchedValue}.`,
          "Dismiss", {
            duration: this.snackBarDuration,
          });
        this.errorMessage = error
      },
    });
    } else {
      //The form validation on the office entity selection already shows an error message if no offices are selected
    }
  }

  private createAttributeFromSummary(attributeSummary: Attribute & EntityCount): AttributeList {
    return {
      standardizedName: attributeSummary.standardizedName,
      canonicalName: attributeSummary.canonicalName,
      staffCount: this.calculateStaffCount(attributeSummary),
      attributeType: attributeSummary.attributeType,
      BBD: attributeSummary.BBD,
      BBi: attributeSummary.BBi,
      BBn: attributeSummary.BBn,
      BBu: attributeSummary.BBu,
      GNC: attributeSummary.GNC,
      ILI: attributeSummary.ILI,
      IND: attributeSummary.IND,
      BBs: attributeSummary.BBs,
      displayedSkillPath: attributeSummary.skillPath
        .filter((pathElement) => pathElement.standardizedName !== attributeSummary.standardizedName)
        .map((pathElement) => pathElement.canonicalName)
        .join(" / "),
    };
  }

  retrieveAttributeList():void{
    this.errorMessage = undefined;
    if (this.hasSelectedOffices()) {
    const attributes = this.attributeList.data.map(attribute => 
      this.skillsService.getAttributeSummary(attribute.standardizedName, this.selectedOffices)
    );
    if (attributes.length > 0) {
      forkJoin(attributes).subscribe({
        next: (attributeSummaries) => {
          const updatedAttributes = attributeSummaries.map(summary => 
            this.createAttributeFromSummary(summary)
          );
          this.attributeList.data = updatedAttributes;
        },
        error: (error) => {
          this.errorMessage = error
        }
      });
    } else {
      //no attributes have been found
    }
    } else {
      //The results do not need to be refreshed if no offices are selected
    }
  }

  onSearchOptionSelected(selectedAttribute: CanonicalNameDetails) {
    this.searchedValue = selectedAttribute.canonicalName;
    this.selectOfficeComponent.validateSelection();
    this.updateAttributeList(selectedAttribute.standardizedName);
  }

  get generateSupportEmail(): string {
    const subject = encodeURIComponent('Error on RFP page');
    const body = encodeURIComponent(
      `Hi,\n\nI am getting an error on RFP search when searching for "${this.searchedValue}".`
    );
    return `mailto:skills-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  removeItem(index: number) {
    const updatedList = [...this.attributeList.data];
    updatedList.splice(index, 1);
    this.attributeList.data = updatedList;
  }

  resetAttributeList() {
    this.attributeList.data = [];
  }

  generateReport() {
    const csvColumns = this.displayedColumns.filter((column) => column !== "controls");
    this.fileService.generateCSVFile(csvColumns, this.attributeList.data.map(attribute => ({...attribute, name: attribute.canonicalName, type:attribute.attributeType})), "Summary Export");
  }

  calculateStaffCount(attributeSummary) {
    return this.selectedEntities.reduce((sum, entity) => sum + (attributeSummary[entity.abbreviation] || 0), 0);
  }

  onOfficeSelected(offices: Office[]):void {
    this.skillsSearchSharedFiltersService.setSelectedOffices(offices);
    if (this.attributeList.data.length > 0) {
      this.retrieveAttributeList();
    } else {
      //an attribute has not been searched for or no matching results were found
    }
  }

  setSelectedEntities(selectedEntities: CompanyEntity[]) {
    this.skillsSearchSharedFiltersService.setSelectedEntities(selectedEntities);
    this.displayedColumns = [
      ...this.standardColumns,
      ...this.selectedEntities.map((entity) => entity.abbreviation),
      "controls",
    ];
    this.attributeList.data = this.attributeList.data.map((attribute) => ({
      ...attribute,
      staffCount: this.calculateStaffCount(attribute),
    }));
  }

  private hasSelectedOffices(): boolean {
    return this.selectedOffices && this.selectedOffices.length > 0;
  }
}