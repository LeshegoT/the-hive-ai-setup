import { Component, Input, OnInit } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup, Validators, NgModel, NgForm, UntypedFormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'question',
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.css', '../../shared/shared.css'],
    standalone: false
})
export class QuestionComponent implements OnInit {

  @Input() question;

  @Input() parentFormGroup: UntypedFormGroup;
  questionGroup: UntypedFormGroup;

  editQuestion: any = false;

  constructor(private formBuilder: UntypedFormBuilder, private snackBar: MatSnackBar) {
    this.questionGroup = this.formBuilder.group({
      answers: this.formBuilder.array([]),
      answerText: ['', Validators.compose([Validators.maxLength(500), Validators.minLength(1)])],
      correctAnswer: [''],
      questionText: ['', Validators.required],
    });
  }

  ngOnInit() {
    const qArr = this.parentFormGroup.get('questionsArr') as UntypedFormArray; //remove 'questionsArr' in future
    qArr.push(this.questionGroup);
  }

  addAnswer() {
    const answerText = this.questionGroup.controls['answerText'].value;
    const validLength = !!(answerText && answerText.length);
    if (!this.questionGroup.controls['answerText'].valid) {
      if (!validLength) {
        this.snackBar.open('Answers cannot be empty', '', { duration: 1000 });
      }
      this.questionGroup.controls['answerText'].markAsDirty();
      this.questionGroup.controls['answerText'].markAsTouched();
    } else {
      const correct = this.questionGroup.controls['correctAnswer'].value || false;
      const answer = {
        text: answerText,
        correct: correct,
      };
      this.question.answers.push(answer);
      this.questionGroup.controls['answerText'].reset();
      this.questionGroup.controls['correctAnswer'].reset();
    }
  }

  editQuestionText() {
    this.editQuestion = true;
    this.questionGroup.controls['questionText'].setValue(this.question.text);
  }

  doneQuestionText() {
    const newQuestion = this.questionGroup.controls['questionText'].value;
    if ((!newQuestion) && (newQuestion.length < 1)) {
      this.snackBar.open('Questions cannot be empty', '', { duration: 1000 });
    } else {
      this.editQuestion = false;
      this.question.text = newQuestion;
    }
  }

  deleteAnswer(answer) {
    const removePos = this.question.answers.indexOf(answer);

    if (removePos !== -1) {
      this.question.answers.splice(removePos, 1);
      const answerArr = this.questionGroup.controls['answers'] as UntypedFormArray;
      answerArr.removeAt(removePos);
    }
  }

}