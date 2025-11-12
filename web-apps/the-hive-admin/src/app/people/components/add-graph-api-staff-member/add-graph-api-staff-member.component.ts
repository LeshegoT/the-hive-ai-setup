import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, output, viewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Staff } from "@the-hive/lib-staff-shared";
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, filter, map, Observable, of, shareReplay, startWith, Subscription, switchMap } from "rxjs";
import { ErrorCardComponent } from "../../../components/error-card/error-card.component";
import { EnvironmentService } from "../../../services/environment.service";
import { GraphApiUser, GraphApiUserWithReviewer, ProfileService } from "../../../services/profile.service";
import { OnboardingStaffService } from "../onboarding/onboarding-staff.service";
import { StaffMemberSearchResultCardComponent } from "../staff-member-search-result-card/staff-member-search-result-card.component";

type SearchForUserResult =
  | { status: 'loading' }
  | { status: 'success'; graphOnlyUsers: GraphApiUser[], hiveUsers: Staff[] }
  | { status: 'error'; errorMessage: string };

type AddNewStaffMemberResult =
  | { status: "loading"; graphUser: GraphApiUser }
  | { status: "success"; graphUser: GraphApiUser }
  | { status: "error"; errorMessage: string; graphUser: GraphApiUser };

@Component({
    selector: 'app-add-graph-api-staff-member',
    templateUrl: './add-graph-api-staff-member.component.html',
    styleUrls: ['../../../shared/shared.css', './add-graph-api-staff-member.component.css'],
    imports: [
      MatFormFieldModule,
      MatProgressSpinnerModule,
      MatInputModule,
      ReactiveFormsModule,
      CommonModule,
      ErrorCardComponent,
      MatChipsModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatAutocompleteModule,
      StaffMemberSearchResultCardComponent
    ]
})
export class AddGraphApiStaffMemberComponent implements OnInit, OnDestroy {
  private onboardingStaffService = inject(OnboardingStaffService);
  private environmentService = inject(EnvironmentService);
  private profileService = inject(ProfileService);

  refreshParentComponent = output<void>({ alias: "refresh" });

  staffMemberSearchControlRestrictions = {
    minimumLength: 3,
    maximumLength: 100
  };

  staffMemberSearchControl = new FormControl("", [
    Validators.required,
    Validators.minLength(this.staffMemberSearchControlRestrictions.minimumLength),
    Validators.maxLength(this.staffMemberSearchControlRestrictions.maximumLength)
  ]);

  subscription: Subscription = new Subscription();
  searchForUserResult$: Observable<SearchForUserResult>;
  autocompleteTrigger = viewChild<MatAutocompleteTrigger>(MatAutocompleteTrigger);
  addNewStaffMember$ = new BehaviorSubject<GraphApiUserWithReviewer | undefined>(undefined);
  addNewStaffMemberResult$: Observable<AddNewStaffMemberResult>;

  ngOnInit(): void {
    this.searchForUserResult$ = this.staffMemberSearchControl.valueChanges.pipe(
      filter(() => this.staffMemberSearchControl.valid),
      distinctUntilChanged(),
      debounceTime(this.environmentService.getConfiguratonValues().SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS),
      switchMap(searchTerm => this.searchForUser(searchTerm)),
      shareReplay(1)
    );

    this.addNewStaffMemberResult$ = this.addNewStaffMember$.pipe(
      switchMap(graphUser => {
        if (!graphUser) {
          return of(undefined);
        } else {
          return this.onboardingStaffService.addNewStaffMember(graphUser).pipe(
            map(() => ({ status: "success", graphUser } as const)),
            startWith({ status: "loading", graphUser } as const),
            catchError(errorMessage => of({ status: "error", errorMessage, graphUser } as const))
          );
        }
      }),
      shareReplay(1)
    );

    this.subscription.add(this.addNewStaffMemberResult$.subscribe(result => {
      if (result?.status === "success") {
        this.refreshSearchResults();
        this.clearSearchResults();
        this.refreshParentComponent.emit();
      } else if (result?.status === "error") {
        this.autocompleteTrigger()?.closePanel();
      } else if (result?.status === "loading") {
        this.autocompleteTrigger()?.openPanel();
      } else {
        // no action needed when there is no result status to handle yet
      }
    }));
  }

  searchForUser(searchTerm: string): Observable<SearchForUserResult> {
    return this.onboardingStaffService.getStaffByStaffFilter({
      upn: searchTerm,
      displayName: searchTerm,
    }).pipe(
      map(hiveUsers => hiveUsers.filter(user => user.staffStatus === 'active' || user.staffStatus === 'onboarding')),
      switchMap((hiveUsers) => {
        return this.profileService.searchForUserOnGraphAPI(searchTerm).pipe(
          map(graphUsers => graphUsers.filter(user => !hiveUsers.some(hiveUser => hiveUser.upn.toLowerCase() === user.upn.toLowerCase()))),
          map((graphOnlyUsers) => ({ status: 'success', graphOnlyUsers, hiveUsers } as const)),
        )
      }),
      startWith({ status: 'loading' } as const),
      catchError((errorMessage: string) => of({ status: 'error', errorMessage: `Failed to search for staff members: ${errorMessage}` } as const))
    );
  }

  retrySearchForUsers(): void {
    this.staffMemberSearchControl.setValue(this.staffMemberSearchControl.value ?? "", { emitEvent: true });
    this.autocompleteTrigger()?.openPanel();
  }

  addGraphApiUserToHive(graphUser: GraphApiUser): void {
    this.subscription.add(this.profileService.getReviewerUPNForUserFromGraphAPI(graphUser.upn).pipe(
      map(reviewerUPN => ({ ...graphUser, reviewer: reviewerUPN }))
    ).subscribe(graphUserWithReviewer => this.addNewStaffMember$.next(graphUserWithReviewer)));
  }

  refreshSearchResults(): void {
    this.staffMemberSearchControl.setValue(this.staffMemberSearchControl.value ?? "", { emitEvent: true });
    this.refreshParentComponent.emit();
  }

  clearSearchResults(): void {
    this.staffMemberSearchControl.setValue("", { emitEvent: false });
    this.staffMemberSearchControl.markAsPristine();
    this.staffMemberSearchControl.markAsUntouched();
    this.staffMemberSearchControl.updateValueAndValidity();
    this.autocompleteTrigger()?.closePanel();
  }

  generateSupportEmailForSearchForUser(errorMessage: string) {
    const subject = encodeURIComponent(`Error searching for Azure AD staff members`);
    const body = encodeURIComponent(`Hi, \n\nI was trying to search for staff members on the People Onboarding tab, but it failed with the following error: ${errorMessage}. \n\nPlease can you assist? \n\nKind regards,`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  generateSupportEmailForAddNewStaffMember(errorMessage: string, graphUser: GraphApiUser) {
    const subject = encodeURIComponent(`Error adding ${graphUser.displayName} to the Hive`);
    const body = encodeURIComponent(`Hi, \n\nI was trying to add ${graphUser.displayName} to the Hive on the People Onboarding tab, but it failed with the following error: ${errorMessage}. Here is the staff member's details: ${JSON.stringify(graphUser)}. \n\nPlease can you assist? \n\nKind regards,`);
    return `mailto:reviews-support@bbd.co.za?subject=${subject}&body=${body}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
