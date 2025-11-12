import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SideQuestService } from '../../services/side-quest.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { IconsService } from '../../services/icons.service';

@Component({
    selector: 'app-create-side-quest-type',
    templateUrl: './create-side-quest-type.component.html',
    styleUrls: ['./create-side-quest-type.component.css'],
    standalone: false
})
export class CreateSideQuestTypeComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();

  @ViewChild('parentForm') private parentForm: NgForm;
  sideQuestTypeForm: UntypedFormGroup;
  error = false;
  images$: Observable<any>;
  existingTypes = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private sideQuestService: SideQuestService,
    public matcher: CreateContentErrorStateMatcher,
    private iconService: IconsService
  ) { 
    this.sideQuestTypeForm = this.formBuilder.group({
      code: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^[a-z\-]+$/),
          Validators.maxLength(50)
        ])
      ],
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      icon: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ],
      description: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(1000)
        ])
      ]
    });
  }

  ngOnInit() {
    this.images$ = this.sideQuestService.getSideQuestTypeImages();
    this.images$ = this.iconService.getAllIcons();

    const typeSubscription = this.sideQuestService.getSideQuestTypes().subscribe( (types) => {
      for (const type of types) {
        this.existingTypes.push(type.code);
      }
    });

    this.dataSubscription.add(typeSubscription);
  }

  createSideQuestType() {
    if(!this.sideQuestTypeForm.valid) {
      this.error = true;
      return;
    }

    const sideQuestType = this.sideQuestTypeForm.getRawValue();

    if (this.existingTypes.indexOf(sideQuestType.code) !== -1) {
      this.snackBar.open('Duplicate codes are not permitted', '', { duration: 1000 });
      return;
    }

    this.error = false;

    const createSubscription = this.sideQuestService.createSideQuestType(sideQuestType).subscribe(() => {
      this.snackBar.open('Side quest type created successfully', '', { duration: 2000 });
      this.parentForm.resetForm();
    });
    this.dataSubscription.add(createSubscription);
  }
  
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
