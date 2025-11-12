/** @format */
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTabsModule } from "@angular/material/tabs";
import { PlotlyModule } from "angular-plotly.js";
import * as PlotlyJS from "plotly.js-dist-min";
PlotlyModule.plotlyjs = PlotlyJS;

import { MatButtonModule } from "@angular/material/button";
import { BehaviorSubject, catchError, filter, finalize, map, Observable, of, startWith, switchMap } from "rxjs";
import { SelectCompanyEntitiesList } from "../../../components/select-company-entity-list/select-company-entity-list.component";
import { CompanyEntity } from "../../../services/company-entities.service";
import { SkillsService, StaffSummaryPanel } from "../../services/skills.service";
import { StaffOverviewSkillsComponent } from "../staff-overview-skills/staff-overview-skills.component";
import { AttributeTotals, AttributeType } from "@the-hive/lib-skills-shared";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

type SkillsLayoutConfiguration  = {
  values: number[];
  labels: string[];
  texttemplate: string;
  hole: number;
  marker: {
    colors: string[];
  };
  type: string;
}

type ExportStateKey = 'used' | 'notused' | `used_type_${AttributeType}`;


@Component({
    selector: "skills-dashboard",
    templateUrl: "./skills-dashboard.component.html",
    styleUrls: ["./skills-dashboard.component.css", "../../../../styles.css"],
    imports: [
        CommonModule,
        MatTabsModule,
        PlotlyModule,
        SelectCompanyEntitiesList,
        MatCardModule,
        MatExpansionModule,
        StaffOverviewSkillsComponent,
        MatProgressSpinnerModule,
        MatButtonModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsDashboardComponent implements OnInit {
  staffTrace$: Observable<SkillsLayoutConfiguration>;
  skillsLayoutConfiguration$: Observable<SkillsLayoutConfiguration>;
  selectedEntities$: BehaviorSubject<CompanyEntity[]> = new BehaviorSubject<CompanyEntity[]>(undefined);
  staffSummaryPanels$: Observable<StaffSummaryPanel[]>;
  staffNameSearchText: string;
  searchDate: Date;
  isExportingMap$ = new BehaviorSubject<Partial<Record<ExportStateKey, boolean>>>({});

  staffGraph = {
    layout: {
      title: "Staff Overview",
      autosize: true,
      legend: {
        itemclick: false,
        itemdoubleclick: false,
      },
    },
    config: {
      displayModeBar: false,
      responsive: true,
    },
  };

  layoutConfiguration = {
    layout: {
      title: "Skills Added",
      autosize: true,
      legend: {
        itemclick: false,
        itemdoubleclick: false,
      },
    },
    config: {
      displayModeBar: false,
      responsive: true,
    },
  }

  createStaffOverview(data: { usersWithSkillsProfiles: number; totalStaff: number }): SkillsLayoutConfiguration {
    return {
      values: [data.usersWithSkillsProfiles, data.totalStaff - data.usersWithSkillsProfiles],
      labels: ["Staff Who Have Used Skills", "Staff Who Have Not Used Skills"],
      texttemplate: "%{value}",
      hole: 0.4,
      marker: {
        colors: ["rgb(63, 81, 181)", "rgb(255, 127, 120)"],
      },
      type: "pie",
    };
  }

  createAttributeTotalsGraph(data: AttributeTotals) {
      return {
        values: [
          data.skill,
          data.qualification,
          data.certification,
          data.quality,
          data.industryKnowledge,
        ],
        labels: ["Skills", "Qualifications", "Certifications", "Qualities", "Industry Knowledge"],
        texttemplate: "%{value}",
        hole: 0.4,
        marker: {
          colors: [
        "rgb(63, 81, 181)",
        "rgb(255, 127, 120)",
        "rgb(179, 245, 188)",
        "rgb(209, 189, 255)",
        "rgb(252, 174, 124)",
          ],
        },
        type: "pie",
      };
    }

  private getExportStateKey(hasUsedSkills: boolean, attributeType?: AttributeType): ExportStateKey {
    return attributeType ? `used_type_${attributeType}` : (hasUsedSkills ? 'used' : 'notused');
  }

  exportEmployeesSkillsUsageStatisticsAsCSV(event, hasUsedSkills: boolean, attributeType? : AttributeType) {
    event.stopPropagation();
    const exportStateKey = this.getExportStateKey(hasUsedSkills, attributeType);
    if (!this.isExportingMap$.value[exportStateKey]) {
    this.isExportingMap$.next({ ...this.isExportingMap$.value, [exportStateKey]: true });
    const companyEntityIds = this.selectedEntities$.value.map((entity) => entity.companyEntityId).join(",");

    this.skillsService
      .getCSVOfSkillsUsers(hasUsedSkills, companyEntityIds, this.staffNameSearchText, this.searchDate, attributeType)
      .pipe(finalize(() => this.isExportingMap$.next({ ...this.isExportingMap$.value, [exportStateKey]: false })))
      .subscribe((csvBlob) => {
      const csvUrl = window.URL.createObjectURL(csvBlob);
      const aTag = document.createElement("a");
      let csvFilename;
      
      if (hasUsedSkills && attributeType) {
        csvFilename = `users_used_skills_without_${attributeType}.csv`;
      } else if (hasUsedSkills) {
        csvFilename = "users_used_skills.csv";
      } else {
        csvFilename = "users_not_used_skills.csv";
      }

      aTag.href = csvUrl;
      aTag.download = csvFilename;
      document.body.appendChild(aTag);
      aTag.click();
      document.body.removeChild(aTag);
      window.URL.revokeObjectURL(csvUrl);
    });
    } else {
      // prevent multiple concurrent exports for this specific button
    }
    
  }

  constructor(private skillsService: SkillsService) {}

  ngOnInit() {
    this.staffTrace$ = this.selectedEntities$.pipe(
      filter((selectedEntities) => selectedEntities !== undefined),
      switchMap((selectedEntities) => {
        startWith(undefined);
        if(selectedEntities.length === 0){
          return of(this.createStaffOverview({
            usersWithSkillsProfiles: 0,
            totalStaff: 0
          }));
        } else{
          return this.skillsService
          .getStaffWhoHaveUsedSkillsSummary(selectedEntities)
          .pipe(map((data) => this.createStaffOverview(data)),
          startWith(undefined));
        }
      }),
    );
    
    this.staffSummaryPanels$ = this.skillsService.
      retrieveStaffSummaryAttributeTypes()
      .pipe(
        catchError(() => {
          return of(undefined);
        })
      );

    this.skillsLayoutConfiguration$ = this.selectedEntities$.pipe(        
      filter((selectedEntities) => selectedEntities !== undefined),
      switchMap((selectedEntities) => {
       startWith(undefined);
       if(selectedEntities.length === 0){
          return of(this.createAttributeTotalsGraph({
            skill: 0,
            qualification: 0,
            certification: 0,
            quality: 0,
            industryKnowledge: 0
          }));
        } else {
          return this.skillsService
            .retrieveSummaryOfAttributesAdded(selectedEntities)
            .pipe(map((data) => this.createAttributeTotalsGraph(data)),
            startWith(undefined));

        }
      }),
    );
  }

  onSearchDateChange(searchDate: Date){
    this.searchDate = searchDate;
  }

  onStaffNameSearchTextChange(staffNameSearchText: string){
    this.staffNameSearchText = staffNameSearchText;
  }
}
