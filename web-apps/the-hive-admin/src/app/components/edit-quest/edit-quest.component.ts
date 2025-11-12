import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GuidesService } from '../../services/guides.service';
import { QuestService } from '../../services/quest.service';

import { SpecialisationsService } from '../../services/specialisations.service';

@Component({
    selector: 'learning-edit-quest-guide',
    templateUrl: './edit-quest.component.html',
    styleUrls: ['./edit-quest.component.css'],
    standalone: false
})
export class EditQuestComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();

  quest;
  guides;
  specialisations;
  selectedSpecialisation;
  specialisationChanged: Subscription;
  select: UntypedFormControl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questService: QuestService,
    private guidesService: GuidesService,
    private specialisationsService: SpecialisationsService
  ) {}

  ngOnInit() {
    const getDataObs = this.route.paramMap
      .pipe(
        switchMap((params: ParamMap) =>
          this.questService.getQuest(parseInt(params.get('id')))
        ),
        switchMap((quest) => {
          this.quest = quest;
          this.selectedSpecialisation = quest.specialisation;
          this.select = new UntypedFormControl(this.selectedSpecialisation);
          this.specialisationChanged = this.select.valueChanges.subscribe((newSpec) => {
            this.changedSpecialisation(newSpec);
          });
          return this.guidesService.getGuidesForSpecialisation(quest.specialisationId);
        })
      )
      .subscribe((guides) => (this.guides = guides));

    const getSpecialisations = this.specialisationsService.getSpecialisations().subscribe((specialisations) => {
      this.specialisations = specialisations;
    });

    this.dataSubscription.add(getDataObs);
    this.dataSubscription.add(getSpecialisations);
  }

  assignGuide(guide) {
    const assignGuideObs = this.questService
      .assignGuideToQuest(guide, this.quest.questId)
      .subscribe(window.location.reload);

    this.dataSubscription.add(assignGuideObs);
  }

  changeEndDate (date) {
    const updateQuests = this.questService.updateQuestEndDate(this.quest.questId, date).subscribe(window.location.reload);

    this.dataSubscription.add(updateQuests);
  }

  changedSpecialisation (specialisation) {
    const id = this.specialisations.find((element) => element.name == specialisation).specialisationId;
    const setSpec = this.specialisationsService.setQuestSpecialisation(this.quest.questId, id).subscribe(window.location.reload);

    this.dataSubscription.add(setSpec);
  }

  encode(upn) {
    return btoa(upn);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
    this.specialisationChanged.unsubscribe();
  }
}
