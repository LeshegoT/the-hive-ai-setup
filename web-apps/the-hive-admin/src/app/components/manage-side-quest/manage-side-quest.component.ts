import { Component, Input, OnInit, Output, ViewChild, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { CheckDateAndTime } from '../../shared/date-time-validators';
import { SideQuestService } from '../../services/side-quest.service';
import { SideQuestInterface } from '../table-side-quest/table-side-quest.component';
import { MatTableDataSource } from '@angular/material/table';
import { SideQuestUser } from '../../shared/interfaces';

@Component({
    selector: 'app-manage-side-quest',
    templateUrl: './manage-side-quest.component.html',
    styleUrls: ['./manage-side-quest.component.css'],
    standalone: false
})
export class ManageSideQuestComponent implements OnInit, OnDestroy {
  
  private dataSubscription: Subscription = new Subscription();

  sideQuestForm: UntypedFormGroup;
  typeSubscription$: Observable<any>;
  allTypes: any;
  init = false;
  error = false;
  defaultDate: Date = new Date();
  restrictGroup: any;
  sideQuestUserData = new MatTableDataSource<SideQuestUser>();
  displayedColumns: string[] = ['displayName', 'email', 'dateRegistered', 'dateCompleted'];

  private _sideQuest;
  @Input()
  set sideQuest(sideQuest) {
    this._sideQuest = (sideQuest || '');
    if(this.init) this.setFormValues();
  }
  get sideQuest() { return this._sideQuest; }
  @ViewChild('parentForm') private parentForm: NgForm;

  @Output() onSave = new EventEmitter();
  @Output() cancel = new EventEmitter<void>();

    constructor( private formBuilder: UntypedFormBuilder,
      private sideQuestService: SideQuestService,
      private snackBar: MatSnackBar,
      public matcher: CreateContentErrorStateMatcher) {
    this.sideQuestForm = this.formBuilder.group({
      type: [
        '',
        Validators.required
      ],
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      link: [
        '',
        Validators.maxLength(500)
      ],
      venue: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(500)
        ])
      ],
      startDate: [
        this.defaultDate,
        CheckDateAndTime(true)
      ],
      description: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(1000) //1000 as this is the NVARCHAR size in the DB
        ])
      ],
      external: [
        false
      ],
      registrationRequired: [
        false
      ],
      restrictGroup: [
        '',
      ]
    });
  }

  ngOnInit(): void {
    this.typeSubscription$ = this.sideQuestService.getSideQuestTypes();
    this.typeSubscription$.subscribe(types => {
          this.allTypes = types;
          this.setFormValues();
    });
    if (this._sideQuest.id) {
      this.sideQuestService.getSideQuestUsers(this._sideQuest.id).subscribe((sideQuestUsers: SideQuestUser[]) => {
        this.sideQuestUserData.data = sideQuestUsers;
      });
    }
    this.init = true;
  }

  setFormValues() {
    if(this._sideQuest) {

      const { code, startDate } = this._sideQuest;
      this.defaultDate = new Date(startDate);

      this.sideQuestForm.controls['type'].setValue(code);
      this.sideQuestForm.controls['startDate'].setValue(this.defaultDate);

      for(const prop in this.sideQuest) {
        if(prop !== "type" && prop != "startDate" && this.sideQuestForm.controls[prop]) {
          this.sideQuestForm.controls[prop].setValue(this.sideQuest[prop]);
        }
      }
    }
  }

  saveQuest() {
    if(this.sideQuestForm.valid) {
      this.error = false;

      const formValue = this.sideQuestForm.getRawValue();

      const { name, startDate, link, description, external, registrationRequired, venue } = formValue;

      const id = this.sideQuest.id;
      const type = formValue.type;
      const restricted = this.restrictGroup.restricted;

      if(!restricted) {
        this.restrictGroup = [];
      }

      const updatedSideQuest = {
        id, type, name, link, venue, startDate, external, registrationRequired, restricted, description,
        restrictGroup: this.restrictGroup,
      };
      const sideQuestInt: SideQuestInterface = this.sideQuest;
      for(const prop in updatedSideQuest) {
        if (sideQuestInt[prop]) {
          sideQuestInt[prop] = updatedSideQuest[prop];
        }
      }
      sideQuestInt.code = updatedSideQuest.type; //TODO: remove references of type
      this.onSave.emit(updatedSideQuest);

      } else {
        this.error = true;
      }
  }

  onCancel() {
    this.cancel.emit()
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
  
}