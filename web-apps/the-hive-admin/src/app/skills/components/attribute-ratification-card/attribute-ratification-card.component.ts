/** @format */
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { BehaviorSubject, filter, Observable, of, switchMap } from "rxjs";
import { LoadingIndicatorComponent } from "../../../components/loading-indicator/loading-indicator.component";
import { IndustryKnowledge, Quality, Skill, SkillsService } from "../../services/skills.service";
import { UserAttribute } from "@the-hive/lib-skills-shared";
import { Staff } from "@the-hive/lib-staff-shared";

enum LoadingState {
  Approve = "Approve",
  Reject = "Reject",
  None = undefined,
}
@Component({
    selector: "app-attribute-ratification-card",
    templateUrl: "./attribute-ratification-card.component.html",
    styleUrls: ["./attribute-ratification-card.component.css"],
    imports: [
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatInputModule,
        LoadingIndicatorComponent,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatTableModule,
    ]
})
export class AttributeRatificationCardComponent implements OnInit {
  @Input() attribute: Skill | Quality | IndustryKnowledge;
  @Output() reloadAttributes = new EventEmitter<void>();
  loading$: BehaviorSubject<LoadingState> = new BehaviorSubject(LoadingState.None);
  attributeNameControl: FormControl;
  loadingState = LoadingState;
  users$: Observable<(UserAttribute & Pick<Staff, 'upn' | 'displayName'>)[]>;

  constructor(private skillService: SkillsService) {}

  ngOnInit() {
    this.attributeNameControl = new FormControl(this.attribute.canonicalName, [Validators.required]);
    this.loading$
      .asObservable()
      .pipe(
        switchMap((loading) => {
          if (loading === LoadingState.Approve) return this.skillService.ratifyAttribute(this.attribute.standardizedName, this.attribute.canonicalName);
          else if (loading === LoadingState.Reject)
            return this.skillService.rejectNewUserAttribute(this.attribute.standardizedName);
          else return of(undefined);
        }),
        filter((result) => result !== undefined),
      )
      .subscribe({
        next: () => {
          this.reloadAttributes.emit();
        },
        error: () => {
          this.loading$.next(LoadingState.None);
        },
      });
  }

  approveAttribute() {
    this.loading$.next(LoadingState.Approve);
  }

  rejectAttribute() {
    this.loading$.next(LoadingState.Reject);
  }

  async fetchUsersForAttribute(): Promise<void> {
    this.users$ = this.skillService.getUsersForAttribute(this.attribute.standardizedName);
  }
}
