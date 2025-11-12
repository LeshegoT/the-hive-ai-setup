import { Injectable } from "@angular/core";
import { SharedService } from "../../../services/shared.service";
import { concatMap, map, Observable, shareReplay } from "rxjs";
import { NewWorkExperience, WorkExperience, WorkExperienceRole, WorkExperienceSector } from "@the-hive/lib-skills-shared";
import { calculateEndOfDay } from "@the-hive/lib-shared";


@Injectable({
    providedIn: 'root'
})
export class WorkExperienceService {
    sectors$: Observable<WorkExperienceSector[]>;
    roles$: Observable<WorkExperienceRole[]>;
    constructor(private readonly sharedService: SharedService) {
        this.sectors$ = this.sharedService.get(`skills/work-experience-sectors`).pipe(
            shareReplay(1)
        );
        this.roles$ = this.sharedService.get(`skills/work-experience-roles`).pipe(
            shareReplay(1)
        );
    }

    getWorkExperiences(upn: string): Observable<WorkExperience[]> {
        return this.sharedService.get(`skills/work-experience/${encodeURIComponent(upn)}`).pipe(
            map((workExperiences: WorkExperience[]) => workExperiences.map(workExperience => ({
                ...workExperience,
                startDate: new Date(workExperience.startDate),
                endDate: new Date(workExperience.endDate)
            })))
        );
    }

    addWorkExperience(workExperience: NewWorkExperience, upn: string): Observable<void> {
        return this.sharedService.post(`skills/work-experience/${upn}`, {
            ...workExperience,
            startDate: calculateEndOfDay(workExperience.startDate),
            endDate: calculateEndOfDay(workExperience.endDate)
        });
    }

    updateWorkExperience(workExperience: NewWorkExperience, workExperienceId: number, upn: string): Observable<void> {
        return this.sharedService.put(`skills/work-experience/${upn}/${workExperienceId}`, {
            ...workExperience,
            startDate: calculateEndOfDay(workExperience.startDate),
            endDate: calculateEndOfDay(workExperience.endDate)
        });
    }

    getWorkExperienceSectors(): Observable<WorkExperienceSector[]> {
        return this.sectors$;
    }

    getWorkExperienceRoles(): Observable<WorkExperienceRole[]> {
        return this.roles$;
    }

    addNewSector(sectorName: string): Observable<WorkExperienceSector[]> {
        this.sectors$ = this.sectors$.pipe(
            concatMap(sectors => this.sharedService.post('skills/work-experience-sectors', { sectorName }).pipe(
                map(sector => [...sectors, sector])
            ))
        );
        return this.sectors$;
    }

    addNewRole(roleName: string): Observable<WorkExperienceRole[]> {
        this.roles$ = this.roles$.pipe(
            concatMap(roles => this.sharedService.post('skills/work-experience-roles', { roleName }).pipe(
                map(role => [...roles, role])
            ))
        );
        return this.roles$;
    }

}