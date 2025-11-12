import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { GroupService } from '../../services/group.service';
import { CreateContentErrorStateMatcher } from '../../shared/create-content-error-state-matcher';

@Component({
    selector: 'app-manage-groups',
    templateUrl: './manage-groups.component.html',
    styleUrls: ['./manage-groups.component.css'],
    standalone: false
})
export class ManageGroupsComponent implements OnInit {
  options: string[] = [];
  filteredOptions: Observable<string[]>;

  @Input() group;
  groupForm: UntypedFormGroup;
  members = [];
  columns = ['member', 'action'];
  @Output() onSave = new EventEmitter();
  memberControl = new UntypedFormControl();
  memberData = new MatTableDataSource<string>();
  error = false;

  constructor(private formBuilder: UntypedFormBuilder, private groupService: GroupService, public matcher: CreateContentErrorStateMatcher, private snackBar: MatSnackBar) {
    this.groupForm = this.formBuilder.group({
      groupName: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      members: ['',Validators.email,],
    });
  }

  ngOnInit() {
    this.members = [];
    this.options = [];
    const allUserPrincipleName = this.groupService.getAllUserPricipleName().subscribe((data) => {
      data.forEach((element: { userPrincipleName: string; }) => {
        this.options.push(element.userPrincipleName);
      });
    });
    this.setFormvalues();
    this.filteredOptions = this.memberControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
  }
  private _filter(value: string) {
    const filterValue = value.toLowerCase();
    return this.options.filter((option) => option.toLowerCase().includes(filterValue));
  }

  setFormvalues() {
    if (this.group) {
      this.groupForm.controls['groupName'].setValue(this.group.groupName);
    }
    this.members = this.group.members;
    this.memberData.data = this.group.members;
  }

  addMember() {
    if(!this.groupForm.valid){
      this.error = true;
         return;
    }else{
      const member = this.memberControl.value.trim().toLowerCase();
      let isDuplicate = false;
      const duplicates = [];
      if (this.members.indexOf(member) === -1) {
        this.groupForm.controls['members'].setValue('');
        this.members.push(member);
      } else {
        isDuplicate = true;
        duplicates.push(member);
    }
      this.memberData.data = this.members;
      if (isDuplicate) {
        this.snackBar.open(`Cannot add duplicate member: ${duplicates}`, '', { duration: 2000 });
      }
    } 
    this.memberControl.setValue('');
  }

  removeMember(index) {
    this.members.splice(index, 1);
    this.memberData.data = this.members;
  }

  updateGroup() {
    if(this.groupForm.valid) {
      if (this.members.length > 0) { 
        const values = this.groupForm.getRawValue();
        const newGroup = {
          groupName: values.groupName,
          oldName: this.group.groupName === 'New Group' ? '' : this.group.groupName,
          newName: values.groupName,
          members: this.members,
        };

        this.group.groupName = values.groupName;
        this.group.members = this.members;

        this.onSave.emit(newGroup);
      } else {
        this.snackBar.open(`Group must have at least one member`, '', { duration: 2000 });
      }
    }
  }
}
