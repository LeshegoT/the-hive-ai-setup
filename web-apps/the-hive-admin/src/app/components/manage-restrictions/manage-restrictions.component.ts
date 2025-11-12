import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { GroupService } from '../../services/group.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { TracksService } from '../../services/tracks.service';
import { LevelUpService } from '../../services/level-up.service';
import { RestrictionsService } from '../../services/restrictions.service';
import { RestrictionsFormat } from '../../shared/interfaces';

@Component({
    selector: 'app-manage-restrictions',
    templateUrl: './manage-restrictions.component.html',
    styleUrls: ['./manage-restrictions.component.css'],
    standalone: false
})
export class ManageRestrictionsComponent implements OnInit {
  restrictionsForm: UntypedFormGroup;
  groups$: Observable<any>;
  unassignedGroups = [];
  addedGroups = [];
  groupDataSource = new MatTableDataSource();
  error = false;
  displayedGroupColumns: string[] = ['name', 'action'];
  restrictedGroups: [];

  @Output() currentRestrictions = new EventEmitter<any>();

  @Input() contentType: string;
  @Input() contentName: string;
  @Input() contentIdString: string;

  private _contentId: number;
  @Input() set contentId(value: number) {
    this._contentId = value;
    if (this.restrictedGroups) this.populateCurrentRestrictions();
  }
  get contentId(): number {
    return this._contentId;
  }

  private _saveUpdate: boolean;
  @Input() set saveUpdate(value: boolean) {
    this._saveUpdate = value;
    if (this._saveUpdate) this.saveRestrictions();
  }
  get saveUpdate(): boolean {
    return this._saveUpdate;
  }

  restrictionsUpdated(restrictions, restricted = undefined) {
    if (!restricted)
      restrictions.restricted = this.restrictionsForm.getRawValue().contentRestricted;
    else restrictions.restricted = restricted;
    
    this.currentRestrictions.emit(restrictions);
  }
  constructor(
    private formBuilder: UntypedFormBuilder,
    private groupService: GroupService,
    private snackBar: MatSnackBar,
    private restrictionsService: RestrictionsService
  ) {
    this.restrictionsForm = this.formBuilder.group({
      restrictGroup: [''],
      contentRestricted: false,
    });
  }

  ngOnInit() {
    this.groups$ = this.groupService.getAllGroups();
    this.restrictionsService.getAllRestrictions().subscribe((restrictionInformation) => {
      this.restrictedGroups = restrictionInformation.filter((r) => r.typeName === this.contentType);
      const currentTrack = this.restrictedGroups.find(
        (tr) => (restrictionInformation.trackId = this.contentId)
      );
      this.populateCurrentRestrictions();
    });
  }

  populateCurrentRestrictions() {
    if(!this.contentIdString.length) {
      this.contentIdString = 'trackId';
    }
    const applicableRestrictions: Array<any> = this.restrictedGroups.filter(
      (r) => r[this.contentIdString] == this.contentId
    );

    this.restrictionsForm.controls['contentRestricted'].setValue(
      !!applicableRestrictions.length
    );
    
    this.groups$.subscribe(
      groups => {
        this.unassignedGroups = groups.filter(
          group => !applicableRestrictions.some(
            element => element.groupName == group.groupName
          )
        );
      }
    );
     
    this.groupDataSource.data = applicableRestrictions;
    this.addedGroups = applicableRestrictions;
    this.restrictionsUpdated(this.addedGroups, !!applicableRestrictions.length);
  }

  saveRestrictions() {
    if (!this.contentType || !this.contentId || !this.restrictionsForm.valid) {
      this.error = true;
      return;
    }

    this.error = false;

    const restrictions = this.restrictionsForm.getRawValue();
    restrictions.restrictGroup = this.addedGroups;
    if (this.contentType === 'track') {
      const res: RestrictionsFormat = {
        restricted: restrictions.contentRestricted,
        groups: restrictions.restrictGroup,
        people: [],
      };
      this.restrictionsUpdated(res);
    }
  }

  restrictionChanged(restricted) {
    this.groupDataSource.data = this.addedGroups;
    this.restrictionsUpdated(this.addedGroups, restricted);
  }

  onSelectClosed() {
    const selectedGroups = this.restrictionsForm.controls['restrictGroup'].value || [];

    this.unassignedGroups = this.unassignedGroups.filter(group => !selectedGroups.includes(group));

    this.addedGroups.push(...selectedGroups);
    this.groupDataSource.data = this.addedGroups;
    this.restrictionsUpdated(this.addedGroups);
    this.restrictionsForm.controls['restrictGroup'].setValue(undefined);
  }

  deleteGroup(group) {
    const removePos = this.addedGroups.map((item) => item.groupName).indexOf(group.groupName);

    if (removePos !== -1) {
      this.addedGroups.splice(removePos, 1);
      this.unassignedGroups.push(group);
      this.unassignedGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));
    }

    this.groupDataSource.data = this.addedGroups;
    this.restrictionsUpdated(this.addedGroups);
  }

  showMessage(message, length = 1500) {
    this.snackBar.open(message, '', { duration: length });
  }
}
