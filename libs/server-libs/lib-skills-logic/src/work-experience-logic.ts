import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { WorkExperience, WorkExperienceRole, WorkExperienceSector, WorkExperienceUpdate } from "@the-hive/lib-skills-shared";
import { addNewWorkExperienceRole, addNewWorkExperienceSector, approveWorkExperienceRole, approveWorkExperienceSector, createWorkExperience, createWorkExperienceOutcome, createWorkExperienceTechnology, deleteWorkExperience, deleteWorkExperienceOutcome, deleteWorkExperienceRole, deleteWorkExperienceSector, deleteWorkExperienceTechnology, getOrCreateWorkExperienceRole, getOrCreateWorkExperienceSector, readWorkExperienceById, readWorkExperienceByStaffId, readWorkExperienceOutcomes, readWorkExperienceRoles, readWorkExperienceSectors, readWorkExperienceTechnologies, updateWorkExperience, updateWorkExperienceOutcome, updateWorkExperienceTechnology } from "./queries/work-experience.queries";

export class WorkExperienceLogic {
    db: () => Promise<SqlRequest>;

    constructor(db: () => Promise<SqlRequest>) {
        this.db = db;
    }

    async readWorkExperienceByStaffId(staffId: number): Promise<WorkExperience[]> {
      const workExperiences = await readWorkExperienceByStaffId(this.db, staffId);
      for(const element of workExperiences) {
        [element.outcomes, element.technologies] = await Promise.all(
          [readWorkExperienceOutcomes(this.db, element),
          readWorkExperienceTechnologies(this.db, element)]
        );
      }
      return workExperiences;
    }

    async readWorkExperienceById(workExperienceId: number): Promise<WorkExperience> {
      const workExperience = await readWorkExperienceById(this.db, workExperienceId);
      [workExperience.outcomes, workExperience.technologies] = await Promise.all(
        [readWorkExperienceOutcomes(this.db, workExperience),
        readWorkExperienceTechnologies(this.db, workExperience)]
      );
      return workExperience;
    }

    async createWorkExperience(tx: SqlTransaction, workExperience: WorkExperienceUpdate): Promise<void> {
      const staffId = workExperience.staffId;
      const sectorId = await getOrCreateWorkExperienceSector(tx, workExperience.sectorName);
      const roleId = await getOrCreateWorkExperienceRole(tx, workExperience.roleName)

      const workExperienceId = await createWorkExperience(tx, workExperience, sectorId, roleId);
      for(const outcome of workExperience.outcomes) {
        await createWorkExperienceOutcome(tx, staffId, workExperienceId, outcome);
      }

      for(const technology of workExperience.technologies) {
        await createWorkExperienceTechnology(tx, staffId, workExperienceId, technology);
      }
    }

    async deleteWorkExperience(tx: SqlTransaction, staffId: number, workExperienceId: number): Promise<void> {
      return deleteWorkExperience(tx, staffId, workExperienceId);
    }

    async updateWorkExperience(tx: SqlTransaction, staffId: number, workExperienceId: number, workExperience: WorkExperience): Promise<void> {
      const current = await this.readWorkExperienceById(workExperienceId);
      const sectorId = await getOrCreateWorkExperienceSector(tx, workExperience.sectorName);
      const roleId = await getOrCreateWorkExperienceRole(tx, workExperience.roleName)

      const toDeleteOutcomes = current.outcomes.filter(x => !workExperience.outcomes.some(y => x.workExperienceOutcomeId == y.workExperienceOutcomeId))
      for(const element of toDeleteOutcomes) {
        await deleteWorkExperienceOutcome(tx, element.workExperienceOutcomeId);
      }
      for(const element of workExperience.outcomes) {
        if(element.workExperienceOutcomeId) {
          await updateWorkExperienceOutcome(tx, element);
        } else {
          await createWorkExperienceOutcome(tx, staffId, workExperienceId, element);
        }
      }

      const toDeleteTechnologies = current.technologies.filter(x => !workExperience.technologies.some(y => x.workExperienceTechnologyId == y.workExperienceTechnologyId))
      for(const element of toDeleteTechnologies) {
        await deleteWorkExperienceTechnology(tx, element.workExperienceTechnologyId);
      }
      for(const element of workExperience.technologies) {
        if(element.workExperienceTechnologyId) {
          await updateWorkExperienceTechnology(tx, element);
        } else {
          await createWorkExperienceTechnology(tx, staffId, workExperienceId, element);
        }
      }

      return updateWorkExperience(tx, staffId, workExperienceId, workExperience, sectorId, roleId);
    }

    async readSectors(): Promise<WorkExperienceSector[]> {
      return readWorkExperienceSectors(this.db);
    }

    async approveSector(tx: SqlTransaction, workExperienceSectorId: number, upn: string): Promise<void> {
      return approveWorkExperienceSector(tx, workExperienceSectorId, upn);
    }

    async deleteSector(tx: SqlTransaction, workExperienceSectorId: number): Promise<void> {
      return deleteWorkExperienceSector(tx, workExperienceSectorId);
    }

    async readRoles(): Promise<WorkExperienceRole[]> {
      return readWorkExperienceRoles(this.db);
    }

    async approveRole(tx: SqlTransaction, workExperienceRoleId: number, upn: string): Promise<void> {
      return approveWorkExperienceRole(tx, workExperienceRoleId, upn);
    }

    async deleteRole(tx: SqlTransaction, workExperienceRoleId: number): Promise<void> {
      return deleteWorkExperienceRole(tx, workExperienceRoleId);
    }

    async addNewRole(tx: SqlTransaction, roleName: string): Promise<WorkExperienceRole> {
      return addNewWorkExperienceRole(tx, roleName);
    }

    async addNewSector(tx: SqlTransaction, sectorName: string): Promise<WorkExperienceSector> {
      return addNewWorkExperienceSector(tx, sectorName);
    }
}
