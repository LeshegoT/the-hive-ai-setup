import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { LevelUpService } from '../../services/level-up.service';
import { map, switchMap } from 'rxjs/operators';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '../../services/file.service';
import { Subscription, interval } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { StaffFilterComponent, IconType } from '../staff-filter/staff-filter.component';

const NOT_ACTIVE_STAGE = 1;
const IDEATION_STAGE = 2;
const VOTING_STAGE = 3;
const FORMATION_STAGE = 4;
const COMPLETED_STAGE = 5;

@Component({
    selector: 'app-level-up-details',
    templateUrl: './level-up-details.component.html',
    styleUrls: ['./level-up-details.component.css'],
    standalone: false
})
export class LevelUpDetailsComponent implements OnInit, OnDestroy {
  gradsWithRepeatedMembers = [];
  repeatedCombinations = [];
  formationForm: UntypedFormGroup;
  newIdeaForm: UntypedFormGroup;
  levelUpDetails;
  toolTipContent;
  newFacilitators : string[] = [];
  addingNewIdea = false;
  formationStages;
  currentFormationStage: number;
  ideasLimit: number;
  errorMessage: string;
  private dataSubscription: Subscription = new Subscription();
  private refreshSubscription: Subscription;
  activityColumns = [
    'levelUpActivityType',
    'activityDate',
    'durationInMinutes',
    'qr-code-link',
    'attendance-register-link',
  ];
  ideasColumns = ['title', 'description', 'actions'];
  syndicateAssignments = [];
  connectedTo = [];
  nudgeClicked = false;

  @ViewChild(StaffFilterComponent) staffFilterComponent;
  searchLabel = 'Facilitator';
  searchType: IconType = 'search';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private levelUpService: LevelUpService,
    private fileService: FileService,
    private authService: AuthService
  ) {

    this.formationForm = this.formBuilder.group({
      numberOfGroups: ['', [Validators.required, Validators.min(1)]],
      choicesAllowed: ['', [Validators.required, Validators.min(1)]],
      ideasLimit: ['', [Validators.required, Validators.min(1)]],
      currentStage: ['', Validators.required],
      allowConflictingGroups: [false],
    });
    this.newIdeaForm = this.formBuilder.group({
      newTitle: [''],
      newDescription: [''],
    });
  }

  drop(event: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  ngOnInit() {
    const levelUpId$ = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id')));
    this.levelUpService.getSyndicateFormationStages().subscribe((s) => {
      this.formationStages = s;
    });

    levelUpId$.pipe(switchMap((id) => this.levelUpService.getLevelUp(id))).subscribe((r) => {
      this.levelUpDetails = r;
      this.SetFormationFormValues(r.formation);
      if (r.formation.currentStage === COMPLETED_STAGE) {
        this.GetSyndicateFormations();
      }
      this.getRepeatedGradGroups(this.levelUpDetails.levelUp.levelUpId);
      this.refreshSubscription = interval(2000).subscribe(() => {
        this.refreshLevelUpDetails();
      });
    });
  }

  getRepeatedGradGroups(levelUp) {
    this.levelUpService.getGradsInPreviousGroupsTogether(levelUp).subscribe((data) => {
      this.gradsWithRepeatedMembers = data;
    });
  }

  getRepeatedCombinations(upn,idea) {
    this.levelUpService.getGradFormerTeam(upn,idea).subscribe((data) => {
      this.repeatedCombinations = data;
      if(this.repeatedCombinations.length>0){
        this.toolTipContent = this.repeatedCombinations.reduce((pre,curr) => {
          return pre + '\n' + curr;
        })
      }
      else{
        this.toolTipContent = '';
      }
    });
  }

  saveFacilitators() {
    this.newFacilitators.push(this.staffFilterComponent.selectedUserPrinciple.userPrincipleName);

    if(!this.newFacilitators.length) return;

    const saveSubscription = this.levelUpService
      .saveFacilitators(this.newFacilitators, this.levelUpDetails.levelUp.levelUpId)
      .subscribe(() => {
        const updateSubscription = this.levelUpService
          .getLevelUpFacilitators(this.levelUpDetails.levelUp.levelUpId)
          .subscribe((facilitators) => (this.levelUpDetails.facilitators = facilitators));

        this.dataSubscription.add(updateSubscription);
      });

    this.dataSubscription.add(saveSubscription);

    this.newFacilitators = [];
  }

  removeFacilitator(upn) {
    if (this.levelUpDetails.facilitators.length <= 1) {
      this.snackBar.open('Cannot remove, levelup needs at least one facilitator', '', { duration: 1000 });
      return;
    }

    const removeSubscription = this.levelUpService
      .removeFacilitator(upn, this.levelUpDetails.levelUp.levelUpId)
      .subscribe(() => {
        const updateSubscription = this.levelUpService
          .getLevelUpFacilitators(this.levelUpDetails.levelUp.levelUpId)
          .subscribe((facilitators) => (this.levelUpDetails.facilitators = facilitators));

        this.dataSubscription.add(updateSubscription);
      });

    this.dataSubscription.add(removeSubscription);
  }

  UpdateFormation(syndicateFormationId, levelUpId) {

    if (this.formationForm.invalid) {

      let errorMessage = 'Please correct the following fields: ';
      const formControls = this.formationForm.controls;

      if (formControls['choicesAllowed'].invalid) {
        errorMessage += 'Choices Allowed, ';
      }
      if (formControls['ideasLimit'].invalid) {
        errorMessage += 'Ideas Limit, ';
      }
      if (formControls['numberOfGroups'].invalid) {
        errorMessage += 'Number of Groups, ';
      }
      if (formControls['currentStage'].invalid) {
        errorMessage += 'Formation Stage, ';
      }

      this.snackBar.open(errorMessage.slice(0, -2), '', { duration: 3000 });
      return;
    }
    
    const form = { ...this.formationForm.value, syndicateFormationId, levelUpId };
    this.levelUpService.updateFormation(form).subscribe((response) => {
      this.snackBar.open(`Syndicate formation updated successfully!`, '', { duration: 1500 });
      this.SetFormationFormValues(response);
    });
  }

  SetFormationFormValues(formation) {
    this.formationForm.controls['ideasLimit'].setValue(formation.ideasLimit);
    this.formationForm.controls['choicesAllowed'].setValue(formation.choicesAllowed);
    this.formationForm.controls['numberOfGroups'].setValue(formation.numberOfGroups);
    this.formationForm.controls['allowConflictingGroups'].setValue(!!formation.allowConflictingGroups);

    if (formation.currentStage) this.formationForm.controls['currentStage'].setValue(formation.currentStage);
    this.currentFormationStage = this.formationForm.value.currentStage;
    this.ideasLimit = this.formationForm.value.ideasLimit;
  }

  GetSyndicateFormations() {
    this.levelUpService.getSyndicates(this.levelUpDetails.formation.levelUpId ? this.levelUpDetails.formation.levelUpId : this.levelUpDetails.formation.syndicateFormationId).subscribe((response) => {
      const {ideaSyndicates, unassignedHeroes} = response;
      if (unassignedHeroes.length) {
        ideaSyndicates.push({
          title: 'Unassigned Heroes',
          syndicates: unassignedHeroes,
        });
      }
      this.setDropLists(ideaSyndicates);
        if (ideaSyndicates && !response.error && !!ideaSyndicates.length) this.disableReformation();
      });
  }

  isInIdeationStage() {
    return this.currentFormationStage === IDEATION_STAGE;
  }

  ideasLimitReached() {
    return this.levelUpDetails.formation.ideas.length === this.ideasLimit;
  }

  disableIdeaAddition() {
    return this.ideasLimitReached() || !this.isInIdeationStage();
  }

  disableReformation() {
    this.formationForm.controls['currentStage'].setValue(COMPLETED_STAGE);
  }

  removeIdea(idea) {
    this.levelUpService.removeIdea(idea).subscribe((data) => {
      this.levelUpDetails.formation.ideas = data;
      this.generateTeams();
    });
  }

  saveNewIdea() {
    const { newTitle, newDescription } = this.newIdeaForm.value;
    const newIdea = {
      syndicateFormationId: this.levelUpDetails.formation.syndicateFormationId,
      ideaTitle: newTitle,
      ideaDescription: newDescription,
      levelUpId: this.levelUpDetails.formation.levelUpId,
    };
    this.levelUpService.addNewFormationIdea(newIdea).subscribe((response) => {
      this.levelUpDetails.formation.ideas = response.ideas;
    });
    this.addingNewIdea = false;
    this.clearInputField();
    this.generateTeams();
  }

  clearInputField() {
    this.newIdeaForm.reset();
  }

  addNewIdea() {
    this.addingNewIdea = true;
  }
  cancelNewIdea() {
    this.addingNewIdea = false;
    this.clearInputField();
  }
  async downloadSheet() {
    const downloadSubscription = this.levelUpService
      .getConsolidatedLevelUpAttendanceSheet(this.levelUpDetails.levelUp.levelUpId)
      .subscribe((data) => {
        this.fileService.downloadFile(new Blob([data.csv]), data.fileName);
      });
    this.dataSubscription.add(downloadSubscription);
  }
  generateTeams() {
    this.levelUpService
      .formSyndicates(this.levelUpDetails.formation.syndicateFormationId, this.levelUpDetails.levelUp.levelUpId)
      .subscribe((response) => {
        this.setDropLists(response.ideas);
      });
  }

  saveTeams() {
    this.levelUpService
      .saveSyndicates(
        this.syndicateAssignments,
        this.levelUpDetails.formation.syndicateFormationId
      )
      .subscribe((response) => this.snackBar.open(`Syndicates saved`, '', { duration: 2000 }));
  }

  setDropLists(ideasData) {
    this.syndicateAssignments = ideasData;
    for (const assignment of this.syndicateAssignments) {
      this.connectedTo.push(assignment.title);
    }
  }

  onSubmit(selected: any, syndicateIdeaId: any): void {
    const git = {
      gitLink: selected
    }
    if(selected)
      this.levelUpService.updateGitLink(syndicateIdeaId, git).subscribe(response => {
        this.snackBar.open(response ? 'Git Link has been updated!' : 'Git link not updated!', "", { duration: 2000 });
      });
    else 
    this.snackBar.open('Git Repo Link is Required Before Proceeding!', '' , { duration: 2000 });
  }

  nudgeTeamFeedback(ideaId: Array<{syndicateIdeaId: number}>, levelUpName: string, levelUpID: number) {
    const ideas = ideaId.map(s => s.syndicateIdeaId);
    const teamData = {
      levelUpID: levelUpID,
      levelUpName: levelUpName,
      syndicateIdeaIds: ideas
    }
    this.levelUpService.nudgeTeamFeedback(teamData).subscribe(() => {
      this.snackBar.open("Team Feedback Assigned.", "", { duration: 2000 });
    });
  }


  async downloadSyndicateTeamsSheet() {
    const downloadSubscription = this.levelUpService
      .getSyndicateFormationCSV(this.levelUpDetails.levelUp.levelUpId)
      .subscribe((data) => {
        this.fileService.downloadFile(new Blob([data.csv]), data.fileName);
      });
    this.dataSubscription.add(downloadSubscription);
  }

  refreshLevelUpDetails() {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const levelUpId = params.get('id');
        return this.levelUpService.getLevelUp(levelUpId);
      })).subscribe((levelUpData) => {
        this.levelUpDetails = levelUpData;
      });
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
}
