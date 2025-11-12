import { Injectable } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { Observable } from "rxjs";
import { SkillsProfile } from "@the-hive/lib-skills-shared";


@Injectable({
    providedIn: 'root'
})
export class ProfilesService {
    constructor(private readonly sharedService: SharedService) { }

    getSkillProfiles(upn: string): Observable<SkillsProfile[]> {
        return this.sharedService.get(`skills/profile/${encodeURIComponent(upn)}`);
    }

    addSkillProfile(skillsProfile: string, shortDescription: string, upn: string): Observable<void> {
        return this.sharedService.post(`skills/profile/${upn}`, {profile: skillsProfile, description: shortDescription});
    }

    updateSkillProfile(skillsProfile: SkillsProfile, upn: string): Observable<void> {
        return this.sharedService.patch(`skills/profile/${upn}`, skillsProfile);
    }

    deleteSkillProfile(skillsProfileId: number): Observable<void> {
        return this.sharedService.delete(`skills/profile/${skillsProfileId}`);
    }
}