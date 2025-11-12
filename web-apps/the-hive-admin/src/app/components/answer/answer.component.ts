import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'answer',
    templateUrl: './answer.component.html',
    styleUrls: ['./answer.component.css', '../../shared/shared.css'],
    standalone: false
})
export class AnswerComponent implements OnInit {

  @Input() answer: any;

  @Input() parentFormGroup: UntypedFormGroup;
  answerGroup: UntypedFormGroup;

  editAnswer: any = false;
  
  constructor(private formbuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar) {
      this.answerGroup = this.formbuilder.group({
        answerText: ['', 
          Validators.required
        ],
        correctAnswer: ['']
      })
  }

  ngOnInit(): void {
    const aArr = this.parentFormGroup.controls['answers'] as UntypedFormArray; //remove 'answers' in future
    aArr.push(this.answerGroup);
    this.editAnswer = false;
    this.answerGroup.controls['answerText'].setValue(this.answer.text);
    
    this.answerGroup.controls['correctAnswer'].setValue(this.answer.correctAnswer);
    this.answerGroup.controls['correctAnswer'].disable();
  }

  editAnswerText() {
    this.editAnswer = true;
    this.answerGroup.controls['correctAnswer'].enable();
  }

  doneAnswerText() {
    const newAnswer = this.answerGroup.controls['answerText'].value;
    if(!(newAnswer && newAnswer.length)) {
      this.snackBar.open('Answers cannot be empty', '', { duration: 1000 });
    } else {
      const correct = this.answerGroup.controls['correctAnswer'].value || false;
      this.editAnswer = false;
      this.answer.text = newAnswer;
      this.answer.correct = correct;
      this.answerGroup.controls['correctAnswer'].disable();
    }
  }

} 
