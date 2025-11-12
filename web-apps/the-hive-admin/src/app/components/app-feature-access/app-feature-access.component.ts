import { Component, OnInit, ViewChild } from '@angular/core';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, switchMap } from 'rxjs/operators';
import { AppFeatureAccessService } from '../../services/app-feature-access.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-app-feature-access',
    templateUrl: './app-feature-access.component.html',
    styleUrls: ['./app-feature-access.component.css'],
    standalone: false
})
export class AppFeatureAccessComponent implements OnInit {
  @ViewChild(StaffFilterComponent) staffFilterComponent;

  groupSearchControl = new UntypedFormControl();
  groupFieldText: string;
  filteredGroupOptions: any;
  allPermissions: any;

  modules: any[] = [];
  selectedModule = '';
  selectedEntity: any;

  actionsResources: any;
  selectedPermission = '';
  selectedPermissionOptions: any[] = [];

  dataSource: any[] = [];
  groupDataSource: any[] = [];
  displayedColumns: string[] = [];

  constructor(private appFeatureService: AppFeatureAccessService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.populateGroupFilter();
    this.appFeatureService.getAllModules().subscribe((modules) => {
      this.modules = modules;
      this.selectedModule = this.modules[0].moduleName;
      this.loadAllPermissions();
    });

    this.appFeatureService.getActonsResources().subscribe((response) => {
      this.actionsResources = response;
      this.loadPermissionOptions();
    });
  }

  selectStaff() {
    if (this.staffFilterComponent.selectedUserPrinciple) {
      this.selectedEntity = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    }
  }

  clearField(event) {
    this.groupFieldText = this.selectedEntity;
    if (event !== undefined && event.target !== undefined) event.target.blur();
  }

  selectGroup(group: any) {
    this.groupFieldText = group.displayName;
    this.selectedEntity = group.displayName;
  }

  private _filterGroups(displayName: string): Observable<any[]> {
    const filterValue = displayName.toLowerCase();
    return this.appFeatureService
      .getAllBBDGroups()
      .pipe(map((groups) => groups.filter((group) => group.displayName.toLowerCase().includes(filterValue))));
  }

  private populateGroupFilter(): void {
    this.filteredGroupOptions = this.groupSearchControl.valueChanges.pipe(
      startWith(''),
      switchMap((value) => this._filterGroups(typeof value === 'string' ? value : value.displayName))
    );
  }

  loadAllPermissions() {
    this.appFeatureService.getFeaturePermissions(this.selectedModule).subscribe((response) => {
      this.allPermissions = response;
      this.generateColumns();
      this.formatTableData();
      this.formatGroupTableData();
      this.loadPermissionOptions();
    });
  }

  generateColumns() {
    this.displayedColumns = this.actionsResources
      .filter((ar) => ar.moduleName === this.selectedModule)
      .map((ar) => ar.actionName + '-' + ar.resourceName);
    this.displayedColumns = ['userOrGroup'].concat(this.displayedColumns);
  }

  formatTableData() {
    this.dataSource = Object.keys(this.allPermissions.users).map((user) => {
      const userData = { userOrGroup: user };

      this.displayedColumns.slice(1).forEach((column) => {
        const [action, resource] = column.split('-');
        const permission = this.allPermissions.users[user].find((p) => p.action === action && p.resource === resource);

        userData[column] = permission ? { value: '✔', permissionAssignmentId: permission.permissionAssignmentId } : '-';
      });

      return userData;
    });
  }

  formatGroupTableData() {
    this.groupDataSource = Object.keys(this.allPermissions.groups).map((group) => {
      const groupData = { userOrGroup: group };

      this.displayedColumns.slice(1).forEach((column) => {
        const [action, resource] = column.split('-');
        const permission = this.allPermissions.groups[group].find(
          (p) => p.action === action && p.resource === resource
        );

        groupData[column] = permission
          ? { value: '✔', permissionAssignmentId: permission.permissionAssignmentId }
          : '-';
      });

      return groupData;
    });
  }

  onModuleChange(moduleName: string) {
    this.loadAllPermissions();
    this.loadPermissionOptions();
  }

  loadPermissionOptions() {
    this.selectedPermissionOptions = this.actionsResources.filter(
      (resource) => resource.moduleName === this.selectedModule
    );

    this.selectedPermission =
      this.selectedPermissionOptions.length > 0
        ? this.selectedPermissionOptions[0].actionName + this.selectedPermissionOptions[0].resourceName
        : '';
  }

  addUserOrGroup() {
    if (this.selectedPermissionOptions.length > 0) {
      const selectedOption = this.selectedPermissionOptions.find(
        (option) => option.actionName + option.resourceName === this.selectedPermission
      );

      if (selectedOption) {
        const action = selectedOption.actionName;
        const resource = selectedOption.resourceName;
        const module = selectedOption.moduleName;

        this.appFeatureService.grantPermission(this.selectedEntity, action, resource, module).subscribe((response) => {
          this.snackBar.open('Access granted successfully.', '', { duration: 5000 });
          this.loadAllPermissions();
        });
      } else {
        this.snackBar.open('Failed granting access. Please try again!', '', { duration: 5000 });
      }
    } else {
      this.snackBar.open('Failed granting access. Please try again!', '', { duration: 5000 });
    }
  }

  revokePermission(permissionAssignmentId) {
    this.appFeatureService.revokePermission(permissionAssignmentId).subscribe((response) => {
      this.snackBar.open('Access revoked successfully.', '', { duration: 5000 });
      this.loadAllPermissions();
    });
  }
}