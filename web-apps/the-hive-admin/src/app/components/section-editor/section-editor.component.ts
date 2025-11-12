import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { CoursesService } from '../../services/courses.service';
import { SectionsService } from '../../services/sections.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';

@Component({
    selector: 'app-section-editor',
    templateUrl: './section-editor.component.html',
    styleUrls: ['./section-editor.component.css', '../../shared/shared.css'],
    standalone: false
})
export class SectionEditorComponent implements OnInit, OnDestroy {
  dataSubscription = new Subscription();
  @Input()
  parentFormGroup: UntypedFormGroup;
  formattedSections = [];
  sectionDetails$;
  _sections = [];
  @Input()
  set sections(sections) {
    this._sections = sections;
    this.refreshValues();
  }
  get sections() {
    return this._sections;
  }

  @Input()
  button: string;
  @Input()
  title: string;

  sectionDataSource = new MatTableDataSource();
  suggestedSectionDataSource = new MatTableDataSource();
  displayedSectionColumns: string[] = ['code', 'name', 'path', 'averageTime', 'order', 'action', 'questions', 'manage-questions'];
  displayedSuggestedSectionColumns: string[] = ['code', 'folderName', 'filePath', 'sectionName', 'addSection'];
  questions: [] | undefined;
  section: any | undefined;
  managingQuestions = false;
  questions$;
  sectionGroup: UntypedFormGroup;
  paths$ : Observable<any>;
  selectedOption: string;
  coursePrefix$: Observable<any>;

  suggestedSections: any[];

  constructor(
    formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    public matcher: CreateContentErrorStateMatcher,
    private courseService: CoursesService,
    private sectionsService: SectionsService,
  ) {
    this.sectionGroup = formBuilder.group({
      sectionCode: [
        '',
        Validators.compose([
          Validators.pattern(/^[a-z\-]+$/),
          Validators.maxLength(50),
          Validators.minLength(2),
          Validators.required,
        ]),
      ],
      sectionName: ['', Validators.compose([Validators.maxLength(50), Validators.required])],
      sectionPath: [
        '',
        Validators.compose([
          Validators.required,
        ]),
      ],
      coursePrefix: [
        '',
        Validators.compose([
          Validators.required,
        ])
      ],
    });
  }

  addSuggestedSection(section) {
    if (section.sectionName?.length) {
      const newSection = {
        code: section.code,
        name: section.sectionName,
        path: section.filePath,
        pathToMarkdown: section.filePath,
        fileExists: true
      };

      const foundPos = this.sections.map((item) => item.code).indexOf(newSection.code);

      if (foundPos !== -1) {
        this.snackBar.open('Cannot add duplicate section', '', { duration: 1000 });
        return;
      }
      
      this.sections.push(newSection);
      this.sectionDataSource.data = this.sections;

      const removePos = this.suggestedSections.indexOf(section);
      this.suggestedSections.splice(removePos, 1);

      this.suggestedSectionDataSource.data = this.suggestedSections;
    }
  }

  addSection() {

    this.checkSectionValid()

    const newSection = {
      code: this.sectionGroup.controls['sectionCode'].value,
      name: this.sectionGroup.controls['sectionName'].value,
      path: this.sectionGroup.controls['sectionPath'].value,
      pathToMarkdown: this.sectionGroup.controls['sectionPath'].value,
      fileExists: true
    };

    if (!newSection.code || !newSection.name || !newSection.path) {
      this.snackBar.open('Please enter all required section details', '', { duration: 1000 });
      return;
    }

    if (
      !this.sectionGroup.controls['sectionCode'].valid ||
      !this.sectionGroup.controls['sectionName'].valid ||
      !this.sectionGroup.controls['sectionPath'].valid
    ) {
      this.snackBar.open('Please ensure section details are valid', '', { duration: 1000 });
      return;
    }

    const foundPos = this.sections.map((item) => item.code).indexOf(newSection.code);

    if (foundPos !== -1) {
      this.snackBar.open('Cannot add duplicate section', '', { duration: 1000 });
      return;
    }

    this.sectionGroup.reset();
    this.sections.push(newSection);
    this.sectionDataSource.data = this.sections;
  }

  onValueChanged(selected: any): void {
    this.selectedOption = selected;
    this.paths$ = this.courseService.getPathToCourses(this.selectedOption);
  }

  checkSectionValid(){
    if (this.sectionGroup.invalid) {
      this.snackBar.open('Please enter all required section details', '', { duration: 1000 });
      Object.keys(this.sectionGroup.controls).forEach((fieldName) => {
        this.sectionGroup.controls[fieldName].markAsDirty();
        this.sectionGroup.controls[fieldName].markAsTouched();
      });
      return;
    }
  }

  changeSectionOrderUp(code) {
    const changePos = this.sections.map((item) => item.code).indexOf(code);

    if (changePos == 0) {
      return;
    }

    this.changeSectionOrder(changePos, changePos - 1);
  }

  changeSectionOrderDown(code) {
    const changePos = this.sections.map((item) => item.code).indexOf(code);

    if (changePos == this.sections.length - 1) {
      return;
    }

    this.changeSectionOrder(changePos, changePos + 1);
  }

  changeSectionOrder(originalPos, newPos) {
    const tmp = this.sections[newPos];
    this.sections[newPos] = this.sections[originalPos];
    this.sections[originalPos] = tmp;

    this.sectionDataSource.data = this.sections;
  }

  questionsDone() {
    this.section.questions = this.questions;
    this.managingQuestions = false;
  } 

  onQuestionDone(questionArr)
  {
    this.questions = questionArr;
  }

  deleteSection(code) {
    if(this.sections.length>1){
      const removePos = this.sections.map((item) => item.code).indexOf(code);

      if (removePos !== -1) {
        this.sections.splice(removePos, 1);
      }

      this.sectionDataSource.data = this.sections;
    }
    else{
      this.snackBar.open('A course must have at least one section', '', {duration: 1000,});
    }
  }

  manageQuestions(code) {
    this.section = this.getSectionFor(code);
    this.questions = this.section.questions;
    if (!this.questions) {
      this.questions = [];
    }
    this.managingQuestions = true;
  }

  getSectionFor(code) {
    const index = this.sections.map((item) => item.code).indexOf(code);
    return this.sections[index];
  }

  refreshValues() {
    //TODO: create and use questions service
    if (this.sections) {

      if (this.sections.length > 0) {
        const temp = this.sections.map((section) => ({
          section,
          questions: this.courseService.getSectionQuestions(section.sectionId),
        }));

        temp.forEach((sectionQuestions: {section: {questions:any}, questions: Observable<any>}) => {
          sectionQuestions.questions.subscribe((questionArray)=>{
            sectionQuestions.section.questions = questionArray[0].questions;
          });
        });
      }
    } 
    this.sectionDataSource.data = this.sections;
  }
  
  ngOnInit() {
    this.coursePrefix$ = this.courseService.getCoursePrefix();

    const code = this.parentFormGroup['value'].code;
    this.sectionsService.getSuggestedSections().subscribe(suggestedSections => {
      this.suggestedSections = suggestedSections.filter(section => section.folderName === code);
      this.suggestedSectionDataSource.data = this.suggestedSections;
    });

    // in this case we do not want the child validation to stop validation of the parent form
    // this.parentFormGroup['sectionInput']=this.sectionGroup;
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
