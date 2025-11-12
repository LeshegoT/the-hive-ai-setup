import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'question-editor',
    templateUrl: './question-editor.component.html',
    styleUrls: ['./question-editor.component.css', '../../shared/shared.css'],
    standalone: false
})
export class QuestionEditorComponent implements OnInit {
  _questions : any[];
  @Input()
  set questions(questions) {
    this._questions = questions;
  }
  get questions() {
    return this._questions;
  }

  @Input() parentFormGroup: UntypedFormGroup;
  questionEditorGroup: UntypedFormGroup;

  @Output() questionDone = new EventEmitter();

  constructor(private formBuilder: UntypedFormBuilder, private snackBar: MatSnackBar) {
    this.questionEditorGroup = this.formBuilder.group({
      questionsArr: this.formBuilder.array([]),
      questionText: ['', Validators.compose([Validators.maxLength(500), Validators.minLength(1)])],
    });
  }

  addQuestion() {
    const questionText = this.questionEditorGroup.controls['questionText'].value;
    const validLength = !!(questionText && questionText.length);
    if (!this.questionEditorGroup.controls['questionText'].valid) {
      if (!validLength) {
        this.snackBar.open('Questions cannot be empty', '', { duration: 1000 });
      }
      this.questionEditorGroup.controls['questionText'].markAsDirty();
      this.questionEditorGroup.controls['questionText'].markAsTouched();
    } else {
      const question = {
        text: questionText,
        answers: [],
      };
      this.questions.push(question);
      this.questionEditorGroup.controls['questionText'].reset();
      this.questionDone.emit(this.questions);
    }
  }

  deleteQuestion(question) {
    const removePos = this.questions.indexOf(question);

    if (removePos !== -1) {
      this.questions.splice(removePos, 1);
      const qArr = this.questionEditorGroup.get('questionsArr') as UntypedFormArray;
      qArr.removeAt(removePos);
      this.questionDone.emit(this.questions);
    }
  }

  ngOnInit() {
    this.parentFormGroup.addControl('question-editor', this.questionEditorGroup);
  }
}
