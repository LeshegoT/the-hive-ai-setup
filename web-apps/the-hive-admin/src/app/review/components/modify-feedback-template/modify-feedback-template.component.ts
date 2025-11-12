import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { CreateContentErrorStateMatcher } from '../../../shared/create-content-error-state-matcher';
import { FeedbackService } from '../../../review/services/feedback.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';

export interface FeedbackTemplate {
  feedbackAssignmentTemplateId: string;
  templateName: string;
  subjectLineTemplate: string;
  textContentTemplate: string;
  urlTemplate: string;
  titleTemplate: string;
  manualFeedbackAssignment: boolean;
  questions: TemplateQuestions[];
}

export interface TemplateQuestions{
  questionId: number;
  question: string;
}

export interface CustomTemplateVariables {
  option: string;
  value: string;
}

export interface TemplateOption{
  option: string,
  value: string,
  htmlAttributes: object,
}

@Component({
    selector: 'app-modify-feeback-template',
    templateUrl: './modify-feedback-template.component.html',
    styleUrls: ['./modify-feedback-template.component.css'],
    standalone: false
})
export class ModifyFeedbackTemplateComponent implements OnInit {
  templateForm: UntypedFormGroup;
  feedbackTemplates: FeedbackTemplate[] = [];
  error = false;
  private _template;
  saveClicked: boolean;
  public templateVariable: TemplateOption[] = [];
  public templateQuestions: TemplateQuestions[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  templateVariableOptions : CustomTemplateVariables[] = []; 


  @Input() set template(template) {
    this._template = template || '';
    this.setFormValues();
  }
  @Output() onSave = new EventEmitter;

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '10em',
    minHeight: '0',
    maxHeight: 'auto',
    width: '100%',
    minWidth: '0',
    translate: 'now',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter content here...',
    defaultParagraphSeparator: '',
    defaultFontName: 'Arial',
    defaultFontSize: '4',
    fonts: [
      {class: 'arial', name: 'Arial'},
      {class: 'times-new-roman', name: 'Times New Roman'},
      {class: 'calibri', name: 'Calibri'},
      {class: 'comic-sans-ms', name: 'Comic Sans MS'}
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
    sanitize: true,
    toolbarPosition: 'top',
  };

  constructor(
    private formBuilder: UntypedFormBuilder,
    public matcher: CreateContentErrorStateMatcher,
    private feedbackService: FeedbackService,
  ) {
    this.templateForm = this.formBuilder.group({
      templateName: ['', Validators.compose([Validators.required])],
      subjectLineTemplate: ['', Validators.compose([Validators.required])],
      textContentTemplate: new UntypedFormControl(['', Validators.compose([Validators.required])]),
      urlTemplate: ['', Validators.compose([Validators.required])],
      titleTemplate: ['', Validators.compose([Validators.required])],
      manualFeedbackAssignment: [''],
      questions: [[]],
    });
    this.templateForm.controls['textContentTemplate'].setValue('');
  }

  ngOnInit() {
    if(this._template){
      this.templateVariableOptions = this._template.variables ;
      this.setTemplateVariables();
    }else{
      this.feedbackService.getDefaultTemplateVariables().subscribe(vars =>{
           this.templateVariableOptions = vars ; 
           this.setTemplateVariables();
      })
    }
  }

  setTemplateVariables(){
    this.templateVariable = this.templateVariableOptions.map((option) => {
      const temp: TemplateOption = {
        value: option.option,
        option: "${" + option.value + "}",
        htmlAttributes: { draggable: true }
      };
      return temp;
    });
    this.saveClicked = false;
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe(templates => {
      this.feedbackTemplates = templates;
    });
  }

  setFormValues() {
    if (this._template) {
      for (const prop in this._template) {
        if (this.templateForm.controls[prop]) this.templateForm.controls[prop].setValue(this._template[prop]);
        if (prop == 'questions') this.templateQuestions = this._template[prop];
      }
    }
  }

  validateTemplateVariables(templateProperty: string) {
    const reg = /(?<=\$\{)([A-Za-z]+)(?=\})/g;
    const matchArray = templateProperty.match(reg);
    let validFlag = true ;

    if (matchArray) {
      for(const templateVariable of matchArray){
        if (!this.templateVariableOptions.some((variableOption) => variableOption.value === templateVariable)) {
          validFlag = false;
          break;
        }
      }
    }

    return validFlag;
  }

  validateAllTemplateVariables(data: FeedbackTemplate) {
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'feedbackAssignmentTemplateId' && key !== 'manualFeedbackAssignment' && key != 'questions') {
        this.validateTemplateVariables(value);

        if(!this.validateTemplateVariables(value)){
          return false;
        }
      }
    }

    return true;
  }

  modifyTemplate() {
    this.error == false ? this.saveClicked = true : this.saveClicked = false;
    if (this.templateForm.valid) {
      this.templateQuestions.filter((question) => !question.question || !question.questionId);
      this.error = false;
      const formValue = this.templateForm.getRawValue();
      const data: FeedbackTemplate = {
        templateName: formValue.templateName,
        subjectLineTemplate: formValue.subjectLineTemplate,
        textContentTemplate: formValue.textContentTemplate,
        urlTemplate: formValue.urlTemplate,
        titleTemplate: formValue.titleTemplate,
        feedbackAssignmentTemplateId: undefined,
        manualFeedbackAssignment: formValue.manualFeedbackAssignment,
        questions: this.templateQuestions
      };
      if (this._template) {
        data.feedbackAssignmentTemplateId = this._template.feedbackAssignmentTemplateId;
      }

      if(this.validateAllTemplateVariables(data)){
        this.onSave.emit(data);
      }else{
        this.error = true ;
        this.saveClicked = false;
      }
    } else {
      this.error = true;
    }
  }

  allowDrop(event) {
    event.preventDefault();
  }

  drag(event, data: string) {
    event.dataTransfer.setData("text", data);
  }

  drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const currentPosition = event.target.selectionStart;
    const currentText = event.path[0].innerHTML;
    event.path[0].innerHTML = currentText.slice(0, currentPosition) + data;
  }

  remove(selectedQuestion: TemplateQuestions) {
    if(!selectedQuestion.questionId){
      this.templateQuestions.splice(this.templateQuestions.indexOf(selectedQuestion), 1);
    }else{
      selectedQuestion.question = undefined;
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const newQuestion: TemplateQuestions = { questionId: undefined, question: value };
      this.templateQuestions.push(newQuestion);
    }
    event.input.value = '';
  }

}