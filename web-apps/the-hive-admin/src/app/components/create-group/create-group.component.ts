import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { GroupService } from '../../services/group.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-create-group',
    templateUrl: './create-group.component.html',
    styleUrls: ['./create-group.component.css'],
    standalone: false
})
export class CreateGroupComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();
  options: string[] = [];
  filteredOptions: Observable<string[]>;
  memberControl = new UntypedFormControl();
  groupForm: UntypedFormGroup;
  error = false;
  existingGroups = [];
  members = [];
  columns = ['member', 'action'];
  memberData = new MatTableDataSource<string>();
  @ViewChild('parentForm') parentForm: NgForm;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private groupService: GroupService,
    public matcher: CreateContentErrorStateMatcher
  ) { 
    this.groupForm = this.formBuilder.group({
      groupName: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(50)
        ])
      ]
    });
  }

  ngOnInit() {
    const groupSubscription = this.groupService.getAllGroups().subscribe((groups) => {
      for (const group of groups) {
        this.existingGroups.push(group.groupName);
      }
    });
    this.options = [];
    const allUserPrincipleName = this.groupService.getAllUserPricipleName().subscribe((data) => {
      data.forEach((element: { userPrincipleName: string }) => {
        this.options.push(element.userPrincipleName);
      });
    });
    this.filteredOptions = this.memberControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
    this.dataSubscription.add(groupSubscription);
  }
  private _filter(value: string) {
    const filterValue = value.toLowerCase();
    return this.options.filter((option) => option.toLowerCase().includes(filterValue));
  }
  addMember() {
    if(!this.groupForm.valid){
      this.error = true;
      return;
    }else{
      const member = this.memberControl.value.trim().toLowerCase();
      if (this.members.indexOf(member) === -1) {
        this.members.push(member);
      }
    this.memberControl.setValue('');
    } 
    this.memberData.data = this.members;
  }
  removeMember(index) {
    this.members.splice(index, 1);
    this.memberData.data = this.members;
  }
  createGroup() {
    let newGroup;
      
    if (this.members.length > 0) { 
      const values = this.groupForm.getRawValue();
      
      newGroup = {
        groupName: values.groupName,
        newName: values.groupName,
        members: this.members,
      };
    }
    else{
      this.snackBar.open('Add at least 1 member', '', { duration: 1000 });
        return;
    }
    
    if(this.existingGroups.indexOf(newGroup.groupName) !== -1) {
      this.snackBar.open('Duplicate group names are not permitted', '', { duration: 1000 });
      return;
    }

    this.error = false;

    const createSubscription = this.groupService.createGroup(newGroup).subscribe(() => {
      this.snackBar.open('Group created successfully', '', { duration: 2000 });
      this.parentForm.resetForm();
    });
    this.dataSubscription.add(createSubscription);
  }
  
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
