import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppFeatureAccessService {
  constructor(private sharedService: SharedService) {}

  getAllBBDGroups() {
    return this.sharedService.get(`/groups`);
  }

  grantPermission(userOrGroup, action, resource, module): Observable<any> {
    return this.sharedService.post('/permission/module', { userOrGroup, action, resource, module });
  }

  getFeaturePermissions(feature) {
    return this.sharedService.get(`/permissions/${feature}`, true);
  }

  revokePermission(permissionAssignmentId) {
    return this.sharedService.delete(`/permission/module/${permissionAssignmentId}`);
  }

  getAllModules() {
    return this.sharedService.get(`/modules`);
  }

  getActonsResources() {
    return this.sharedService.get(`/actions-resources`);
  }
}