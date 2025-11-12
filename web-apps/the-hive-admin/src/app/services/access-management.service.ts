import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { AdminAccessRoute } from '../components/admin-access/admin-access.component';

@Injectable({
  providedIn: 'root',
})
export class AccessManagementService {
  constructor(private sharedService: SharedService) {}

  getAllocatedAdminPermissions(): Observable<any> {
    return this.sharedService.get('permissions');
  }

  getAllRoutes(): Observable<any> {
    return this.sharedService.get('routes');
  }

  createNewRoute(request: AdminAccessRoute): Observable<any> {
    return this.sharedService.post('routes', request);
  }

  allocateAdminPermissions(User: string, Permissions: number[]): Observable<any> {
    const req = {
      user: User,
      permissions: Permissions,
    };
    return this.sharedService.post('permissions', req);
  }

  revokeAdminPermissions(id: number): Observable<any> {
    return this.sharedService.delete(`permission/${id}`);
  }

  revokeAllAdminPermissions(upn: string): Observable<any> {
    return this.sharedService.delete(`permissions/${upn}`);
  }

  createNewAdminSiteUser(request: {user , routes}): Observable<any> {
    return this.sharedService.post('site-user', request);
  }
}
