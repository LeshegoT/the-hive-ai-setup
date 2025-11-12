/** @format */
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTabsModule } from "@angular/material/tabs";
import { RatificationSummary, TopLevelTag } from "@the-hive/lib-skills-shared";
import { PlotlyModule } from "angular-plotly.js";
import * as PlotlyJS from "plotly.js-dist-min";
import { forkJoin, map, Observable } from "rxjs";
import { SkillsService } from "../../services/skills.service";
PlotlyModule.plotlyjs = PlotlyJS;

@Component({
    selector: "skills-atc-overview",
    templateUrl: "./skills-atc-overview.component.html",
    styleUrls: ["./skills-atc-overview.component.css", "../../../../styles.css"],
    imports: [CommonModule, MatTabsModule, PlotlyModule, MatCardModule, MatExpansionModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsATCOverviewComponent implements OnInit {
  ratificationTrace$: Observable<{
    values: number[];
    labels: string[];
    texttemplate: string;
    hole: number;
    marker: { colors: string[] };
    type: string;
  }>;
  ratificationGraph = {
    layout: {
      title: "Unratified Attributes",
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
  constructor(private skillsService: SkillsService) {}

  createUnratifiedAttributeGraph(ratificationSummary: RatificationSummary[], topLevelTags: TopLevelTag[]) {
    return {
      values: topLevelTags.map(topLevelTag => ratificationSummary.find(ratificationSummaryItem => ratificationSummaryItem.standardizedName.includes(topLevelTag.standardizedName)).count),
      labels: topLevelTags.map(topLevelTag => topLevelTag.canonicalName),
      texttemplate: "%{value}",
      hole: 0.4,
      marker: {
        colors: [
          "rgb(63, 81, 181)",
          "rgb(255, 127, 120)",
          "rgb(179, 245, 188)",
          "rgb(255, 230, 153)",
          "rgb(209, 189, 255)",
          "rgb(252, 174, 124)",
        ],
      },
      type: "pie",
    };
  }

  ngOnInit() {
    this.ratificationTrace$ = forkJoin({
      topLevelTags: this.skillsService.retrieveTopLevelTags(),
      ratificationSummary: this.skillsService.getUnratifiedAttributesSummary()
    }).pipe(
      map(({ ratificationSummary, topLevelTags }) =>
        this.createUnratifiedAttributeGraph(ratificationSummary, topLevelTags)
      )
    );
  }
}
