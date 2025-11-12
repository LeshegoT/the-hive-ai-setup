import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { contentTypes } from '../../shared/content-types';
import { Subscription } from 'rxjs';
import { LevelUpService } from '../../services/level-up.service';
import { SideQuestService } from '../../services/side-quest.service';
import { contentTypeCodes, contentTypeLabel } from '../../shared/enums';
import { GroupService } from '../../services/group.service';
import { ProgrammeService } from '../../services/programme.service';

@Component({
    selector: 'app-manage-content',
    templateUrl: './manage-content.component.html',
    styleUrls: ['./manage-content.component.css'],
    standalone: false
})
export class ManageContentComponent implements OnInit, AfterContentInit, OnDestroy {
  public contentTypeCodes = contentTypeCodes;
  dataSubscription: Subscription = new Subscription();
  allContent = contentTypes;
  content = this.allContent[0];

  contentSelection = {
    levelUp: {},
    sideQuest: {},
    sideQuestType: {},
    levelUpActivityType: {},
    group: {},
    programme: {},
  };
  currentContent = {
    levelUp: [],
    sideQuest: [],
    sideQuestType: [],
    levelUpActivityType: [],
    group: [],
    programme: [],
  };

  activeSideQuestTypes = [];
  activeLevelUpTypes = [];

  //reference data
  level_up = [];
  side_quest = [];
  side_quest_type = [];
  level_up_activity_type = [];
  group = [];
  programmes = [];

  constructor(
    private levelUpService: LevelUpService,
    private sideQuestService: SideQuestService,
    private groupService: GroupService,
    private programmeService: ProgrammeService
  ) {}

  ngOnInit() {
    this.refreshLevelUps();
    this.refreshSideQuests();
    this.refreshSideQuestTypes();
    this.refreshLevelUpActivityTypes();
    this.refreshGroups();
    this.refreshProgrammes();
  }

  ngAfterContentInit() {}

  onTypeSelected(e) {
    const selectedContentType = e.value.code;

    this.currentContent[selectedContentType] = this[selectedContentType];
  }

  buildOptions(data, type: contentTypeCodes) {
    const content = [];
    data.forEach((value) => {
      content.push(value);
    });
    const contentType = contentTypeLabel.get(type);
    this[`${contentType}s`] = content;

    this.currentContent[contentType] = this[`${contentType}s`];

    this.contentSelection[contentType] = this.currentContent[contentType][0];
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshGroups() {
    const groupSubscription = this.groupService.getAllGroupsMembers().subscribe((groups) => {
      this.buildOptions(groups, contentTypeCodes.group);
    });
    this.dataSubscription.add(groupSubscription);
  }

  refreshLevelUps() {
    const levelUpSubscription = this.levelUpService.getAllLevelUps().subscribe((levelUps) => {
      this.buildOptions(levelUps, contentTypeCodes.levelUp);
    });
    this.dataSubscription.add(levelUpSubscription);
  }

  refreshSideQuests() {
    const sideQuestSubscription = this.sideQuestService.getAllSideQuests().subscribe((sideQuests) => {
      this.buildOptions(sideQuests, contentTypeCodes.sideQuest);
    });
    this.dataSubscription.add(sideQuestSubscription);
  }

  refreshSideQuestTypes() {
    const sideQuestTypeSubscription = this.sideQuestService.getSideQuestTypes().subscribe((types) => {
      this.buildOptions(types, contentTypeCodes.sideQuestType);
    });
    const activeSuscription = this.sideQuestService.getActiveSideQuestTypes().subscribe((types) => {
      types.forEach((type) => this.activeSideQuestTypes.push(type.sideQuestTypeId));
    })
    this.dataSubscription.add(sideQuestTypeSubscription);
    this.dataSubscription.add(activeSuscription);
  }

  refreshLevelUpActivityTypes() {
    const levelUpActivityTypeSubscription = this.levelUpService.getLevelUpActivityTypes().subscribe((activityTypes) => {
      this.buildOptions(activityTypes, contentTypeCodes.levelUpActivityType);
    });
    const activeSuscription = this.levelUpService.getActiveLevelUpActivityTypes().subscribe((types) => {
      types.forEach((type) => this.activeLevelUpTypes.push(type.levelUpActivityTypeId));
    });
    this.dataSubscription.add(levelUpActivityTypeSubscription);
    this.dataSubscription.add(activeSuscription);
  }

  refreshProgrammes() {
    const programmeSubscription = this.programmeService.getAllProgrammes().subscribe((programmes) => {
      this.buildOptions(programmes, contentTypeCodes.programme);
    });
    this.dataSubscription.add(programmeSubscription);
  }
}
