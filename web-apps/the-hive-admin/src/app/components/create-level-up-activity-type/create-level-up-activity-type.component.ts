import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LevelUpService } from '../../services/level-up.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { IconsService } from '../../services/icons.service';

@Component({
    selector: 'app-create-level-up-activity-type',
    templateUrl: './create-level-up-activity-type.component.html',
    styleUrls: ['./create-level-up-activity-type.component.css'],
    standalone: false
})
export class CreateLevelUpActivityTypeComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();

  activityForm: UntypedFormGroup;
  error = false;
  icons$: Observable<any>;
  existingTypes = [];
  currentIcon;
  @ViewChild('parentForm') parentForm: NgForm;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private levelUpService: LevelUpService,
    public matcher: CreateContentErrorStateMatcher,
    private iconService: IconsService
  ) { 
    this.activityForm = this.formBuilder.group({
      code: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(/^[a-z\-]+$/),
          Validators.maxLength(20),
          Validators.minLength(2)
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
        Validators.required
      ],
      description: [
        '',
        Validators.required
      ]
    });
  }

  ngOnInit() {
    this.icons$ = this.iconService.getAllIcons();
    const typeSubscription = this.levelUpService.getLevelUpActivityTypes().subscribe( (types) => {
      for (const type of types) {
        this.existingTypes.push(type.code);
      }
    });

    this.dataSubscription.add(typeSubscription);
  }

  createActivityType() {
    if(!this.activityForm.valid) {
      this.error = true;
      return;
    }

    this.error = false;
    const levelUpActivityType = this.activityForm.getRawValue();

    if (this.existingTypes.indexOf(levelUpActivityType.code) !== -1) {
      this.snackBar.open('Duplicate codes are not permitted', '', { duration: 1000 });
      return;
    }

    const createSubscription = this.levelUpService.createLevelUpActivityType(levelUpActivityType).subscribe(() => {
      this.snackBar.open('Level up activity type created successfully', '', { duration: 2000 });
      this.parentForm.resetForm();
    });
    this.dataSubscription.add(createSubscription);
  }
  
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

}
