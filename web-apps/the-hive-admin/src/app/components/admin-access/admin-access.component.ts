import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AccessManagementService } from '../../services/access-management.service';
import { TableService } from '../../services/table.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffFilterComponent } from '../staff-filter/staff-filter.component';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
export interface RoutePermissionGroup {
  adUserOrGroup: string;
  permissions: RoutePermissionDetails[];
}

export interface RoutePermissionDetails {
  adminRouteId: number;
  adminRoutePermissionId: number;
  displayName: string;
  restricted: boolean;
  routePattern: string;
}

export interface AdminAccessRoute {
  routePattern: string;
  restricted: boolean;
  displayName: string;
  routerLink: string;
  displayOrder: number;
}

export type ActionType = 'all' | 'single' ;

@Component({
    selector: 'app-admin-access',
    templateUrl: './admin-access.component.html',
    styleUrls: ['./admin-access.component.css'],
    standalone: false
})
export class AdminAccessComponent implements OnInit {
  routesData = new MatTableDataSource();
  routesColumns = ['routePattern', 'restricted', 'displayName', 'routerLink', 'displayOrder'];

  allocatedPermissions = new MatTableDataSource();
  availableRoutes: RoutePermissionDetails[];
  activeUserOrGroupPermissions: RoutePermissionDetails[];

  displayRoutes: RoutePermissionDetails[];
  showPermissionList: boolean;
  activeUserOrGroup: string;

  newUser: string;
  newUserPermissions: RoutePermissionDetails[];

  newRoute: AdminAccessRoute;
  newRouteForm: FormGroup;


  allocatedPermissionsColumns = ['adUserOrGroup', 'active'];
  @ViewChild(StaffFilterComponent) staffFilterComponent;

  constructor(
    private accessManagementService: AccessManagementService,
    public tableService: TableService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadPermissionData();
    this.accessManagementService.getAllRoutes().subscribe((routes) => {
      this.availableRoutes = routes;
      this.displayRoutes = [];
    });
    this.getRoutes();
    this.newRouteForm = new FormGroup({
      routePattern: new FormControl<string>('', Validators.required),
      restricted: new FormControl<boolean>(false),
      displayName: new FormControl<string>(null),
      routerLink: new FormControl<string>(null),
      displayOrder: new FormControl<number>(null),
    });
  }

  loadPermissionData() {
    this.activeUserOrGroup = '';
    this.showPermissionList = false;
    this.newUser = '';

    this.accessManagementService.getAllocatedAdminPermissions().subscribe((result) => {
      this.allocatedPermissions.data = result;
      this.allocatedPermissions._updateChangeSubscription();
    });
  }

  showPermissions(selectedUserOrGroup: string) {
    this.showPermissionList = false;
    this.activeUserOrGroup = selectedUserOrGroup;
    const activePermissions = this.allocatedPermissions.data.find(
      (user: RoutePermissionGroup) => user.adUserOrGroup == selectedUserOrGroup
    );
    this.activeUserOrGroupPermissions = (activePermissions as RoutePermissionGroup).permissions;

    this.displayRoutes = this.availableRoutes.filter(
      (route: RoutePermissionDetails) =>
        !this.activeUserOrGroupPermissions.some(
          (allocatedRoute: RoutePermissionDetails) => allocatedRoute.adminRouteId == route.adminRouteId
        )
    );

    this.showPermissionList = true;
  }

  grantAccess(routePermission: RoutePermissionDetails[]) {

     const requestedRoutes = routePermission.map((route) => route.adminRouteId);

    this.accessManagementService.allocateAdminPermissions(this.activeUserOrGroup, requestedRoutes).subscribe(
      (permissionIds) => {
        routePermission.forEach((route, index) => {
          route.adminRoutePermissionId = permissionIds[index];
          this.activeUserOrGroupPermissions.push(route);
        });

        this.updateData();
        this._snackBar.open('Permission Granted', 'Dismiss', { duration: 3000 });
      },
      (error) => {
        this._snackBar.open(`Could not grant permission: ${error}`, 'Dismiss', { duration: 3000 });
      }
    );
  }

  revokeAccess(routePermission: RoutePermissionDetails) {
    this.accessManagementService.revokeAdminPermissions(routePermission.adminRoutePermissionId).subscribe(
      () => {
        this.activeUserOrGroupPermissions.splice(this.activeUserOrGroupPermissions.indexOf(routePermission), 1);
        this.updateData();
        this._snackBar.open('Permission Revoked', 'Dismiss', { duration: 3000 });
      },
      (error) => {
        this._snackBar.open(`Could not revoke permission: ${error}`, 'Dismiss', { duration: 3000 });
      }
    );
  }

  revokeAllAccess() {
    this.accessManagementService.revokeAllAdminPermissions(this.activeUserOrGroup).subscribe(
      () => {
        this.activeUserOrGroupPermissions = [];
        this.loadPermissionData();
        this._snackBar.open('Permissions Revoked', 'Dismiss', { duration: 3000 });
      },
      (error) => {
        this._snackBar.open(`Could not revoke permissions: ${error}`, 'Dismiss', { duration: 3000 });
      }
    );
  }

  updateData() {
    const newDataMapping = this.allocatedPermissions.data.map((permission: RoutePermissionGroup) => {
      if (permission.adUserOrGroup !== this.activeUserOrGroup) {
        return permission;
      } else {
        return {
          adUserOrGroup: permission.adUserOrGroup,
          permissions: this.activeUserOrGroupPermissions,
        };
      }
    });

    this.allocatedPermissions.data = newDataMapping;

    this.displayRoutes = this.availableRoutes.filter(
      (route: RoutePermissionDetails) =>
        !this.activeUserOrGroupPermissions.some(
          (allocatedRoute: RoutePermissionDetails) => allocatedRoute.adminRouteId == route.adminRouteId
        )
    );
  }

  selectStaff() {
    this.newUser = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
    this.newUserPermissions = [];
    this.displayRoutes = this.availableRoutes;
    this.showPermissionList = true;
  }

  addAccess(routePermission: RoutePermissionDetails, action: ActionType) {
    if(action == 'single'){
      this.newUserPermissions.push(routePermission);
    }else{
      this.newUserPermissions = this.newUserPermissions.concat(this.displayRoutes);
    }
    
    this.updateNewUserData();
  }

  removeAccess(routePermission: RoutePermissionDetails, action: ActionType) {
    if(action == 'single'){
      this.newUserPermissions.splice(this.newUserPermissions.indexOf(routePermission), 1);
    }else{
      this.newUserPermissions = [];
    }
    
    this.updateNewUserData();
  }

  updateNewUserData() {
    this.displayRoutes = this.availableRoutes.filter(
      (route: RoutePermissionDetails) =>
        !this.newUserPermissions.some(
          (allocatedRoute: RoutePermissionDetails) => allocatedRoute.adminRouteId == route.adminRouteId
        )
    );
  }

  insertNewUser() {
    const requestBody = {
      user: this.newUser,
      routes: this.newUserPermissions.map((route) => route.adminRouteId),
    };

    this.accessManagementService.createNewAdminSiteUser(requestBody).subscribe((res) => {
      this._snackBar.open('New user created', 'Dismiss', { duration: 3000 });
      this.newUser = '';
      this.loadPermissionData();
    });
  }

  insertNewRoute() {
    const newRouteData = this.newRouteForm.value
    this.accessManagementService.createNewRoute(newRouteData).subscribe(
      () => {
        this._snackBar.open('New route created', 'Dismiss', { duration: 3000 });
        this.newRouteForm.reset(); 
        this.getRoutes();
      },
      (error) => {
        this._snackBar.open(`Could not create route: ${error}`, 'Dismiss');
      }
    );
  }

  onRestrictedChange(value: boolean) {
    this.newRoute.restricted = value;
  }

  getRoutes() {
    this.accessManagementService.getAllRoutes().subscribe((routes) => {
      this.routesData.data = routes;
    });
  }

  getFormErrors(formControl: AbstractControl) {
    let error = '';
    if (formControl.hasError('required')) {
      error = 'Required';
    }
    return error;
  }
} 
