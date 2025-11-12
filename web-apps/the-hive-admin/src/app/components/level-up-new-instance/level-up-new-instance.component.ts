import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { LevelUpService } from '../../services/level-up.service';
import { map, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {UntypedFormGroup, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { parseEmailList } from '../../shared/string-parsers';

@Component({
    selector: 'app-level-up-new-instance',
    templateUrl: './level-up-new-instance.component.html',
    styleUrls: ['./level-up-new-instance.component.css'],
    standalone: false
})
export class LevelUpNewInstanceComponent implements OnInit {
  levelUpForm: UntypedFormGroup;
  levelUpDetails$;
  levelUpInfo;
  newLevelupColumns = ['levelUpActivityType', 'activityDate', 'durationInMinutes'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute, 
    private snackBar: MatSnackBar,
    private levelUpService: LevelUpService) {
      this.levelUpForm = this.formBuilder.group({
        datesArray: this.formBuilder.array([]),
        facilitators: [
          ''
        ]
      });
    }

  get datesArray() {
    return this.levelUpForm.get('datesArray') as UntypedFormArray;
  }  

  ngOnInit() {
    const levelUpId$ = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id'))
    );

    this.levelUpDetails$ = levelUpId$.pipe(
      switchMap((id) => this.levelUpService.getLevelUp(id))
    );

    this.levelUpDetails$.subscribe( details => {
      this.levelUpInfo = details;
      for (const activity of this.levelUpInfo.activities){
          this.datesArray.push(this.formBuilder.group({
            selectedDate : new Date(activity.activityDate)
          }))
      }
      
      const facilitatorsValue = this.levelUpInfo.facilitators.map(e => e.userPrincipleName).join(",");

      this.levelUpForm.controls['facilitators'].setValue(facilitatorsValue);
    });
  }

  CreateLevelUp() {
    const levelUp = {
      ...this.levelUpInfo.levelUp,
      courses: this.levelUpInfo.courses,
      activities: this.levelUpInfo.activities,
    };
    
    const allDates = [];
    for (let i=0; i<levelUp.activities.length;i++){
      const newDate = this.datesArray.at(i).value.selectedDate;
      allDates.push(newDate);
      levelUp.activities[i].startDate = newDate;
    }

    const facilitatorsArray = parseEmailList(this.levelUpForm.controls['facilitators'].value);

    if (!facilitatorsArray.length) {
      this.snackBar.open('Please add at least one valid facilitator the levelup', '', { duration: 1000 });
      return;
    }

    levelUp.facilitators = facilitatorsArray;
    
    levelUp.startDate=  new Date(Math.min(...allDates));
    levelUp.endDate = new Date(Math.max(...allDates));
    this.levelUpService
      .createNewLevelUpInstance(levelUp)
      .subscribe(() => this.router.navigate([`levelUp`]));
  }
}

