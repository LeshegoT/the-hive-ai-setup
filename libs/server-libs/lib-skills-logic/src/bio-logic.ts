import { cache } from "@the-hive/lib-core";
import { SqlRequest } from "@the-hive/lib-db";
import { BadRequestDetail, BioTemplate, StaffBioAttributes, SkillsProfile, WorkExperience } from "@the-hive/lib-skills-shared";
import { getBioTemplatesDetails } from "./queries/skills.queries";
import { getStaffDetails } from "./queries/users.queries";
import { mapStaffBio } from "./staff-bio/bio-mapper";
import { readSkillsProfileById } from "./queries/profile-queries"
import { BioTemplates } from "./staff-bio/bio-document-strategy";
import { StaffSpokenLanguage } from "@the-hive/lib-staff-shared";

export class BioLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  /**
   * @param {string} staffId
   * @param {StaffBioAttributes} staffAttributes Staff Attributes Grouped By Canonical Type
   * @param {string} requestBioTemplateId
   */
  async generateStaffBio(staffId: number, staffAttributes: StaffBioAttributes, workExperiences: WorkExperience[], requestBioTemplateId: string, staffSpokenLanguages: StaffSpokenLanguage[], requestSkillsProfilesId?: string): Promise<Buffer | BadRequestDetail> {
    const bioTemplateId = Number(requestBioTemplateId);
    if (isNaN(bioTemplateId)) {
      throw new Error(`BioTemplateId ${bioTemplateId} is invalid`)
    } else {
      // We know it is a valid number and can continue
    }

    let profileOverviewText: string | undefined;
    if (requestSkillsProfilesId) {
      const skillsProfilesId = Number(requestSkillsProfilesId);
      if (isNaN(skillsProfilesId)) {
        throw new Error(`SkillsProfilesId ${skillsProfilesId} is invalid`)
      } else {
        const skillsProfile = await this.getSkillsProfileDetails(skillsProfilesId);
        profileOverviewText = skillsProfile.skillsProfile;
      }
    } else {
      // No profile ID provided.
    }
    const staffDetails = await getStaffDetails(this.db, staffId)
    const staffBio = mapStaffBio(staffDetails.displayName, staffDetails.jobTitle, staffAttributes, undefined, workExperiences, profileOverviewText, staffSpokenLanguages, staffDetails.nationality, staffDetails.residence, staffDetails.dateOfBirth)
    const bioTemplate = await this.getBioTemplateDetails(bioTemplateId);
    const biosGenerator = BioTemplates[bioTemplate.bioTemplateName];
    if (biosGenerator) {
      return biosGenerator(bioTemplate.bioTemplateFilename, staffBio);
    } else {
      return {
        message: `Bio template ${bioTemplate.bioTemplateName} is invalid`
      };
    }

  }

  async getSkillsProfileDetails(skillsProfilesId: number): Promise<SkillsProfile> {
    return readSkillsProfileById(this.db, skillsProfilesId)
  }

  async getBioTemplatesDetails() {
    return cache('bio-templates', async (): Promise<BioTemplate[]> => {
      return getBioTemplatesDetails(this.db);
    });
  }

  async getBioTemplateDetails(bioTemplateId: number) {
    const bioTemplates = await getBioTemplatesDetails(this.db);
    const bioTemplate = bioTemplates.find(template => template.bioTemplateId === bioTemplateId);

    return bioTemplate;
  }
}
