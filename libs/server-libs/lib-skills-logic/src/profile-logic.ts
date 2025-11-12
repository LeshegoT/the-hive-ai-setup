import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { SkillsProfile } from "@the-hive/lib-skills-shared";
import { insertSkillsProfile, deleteSkillsProfile, readSkillsProfileByStaffId, updateSkillsProfile} from './queries/profile-queries';

export class ProfileLogic {
    db: () => Promise<SqlRequest>;

    constructor(db: () => Promise<SqlRequest>) {
        this.db = db;
    }

    async deleteSkillsProfile(transaction: SqlTransaction, profileId: number): Promise<void> {
        await deleteSkillsProfile(transaction, profileId);
    }
    async updateSkillsProfile(transaction: SqlTransaction, profileId: number, staffId: number, profile: string, description: string): Promise<SkillsProfile> {
        return await updateSkillsProfile(transaction, profileId, staffId, profile, description);
    }
    async insertSkillsProfile(transaction: SqlTransaction, staffId: number, profile: string, description: string): Promise<SkillsProfile> {
        return await insertSkillsProfile(transaction, staffId, profile, description);
    }
    async readSkillsProfileByStaffId(staffId: number): Promise<SkillsProfile[]> {
        return await readSkillsProfileByStaffId(this.db, staffId);
    }
}
