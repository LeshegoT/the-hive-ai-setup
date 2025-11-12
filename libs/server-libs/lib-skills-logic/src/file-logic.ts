import { parseIfSetElseDefault } from "@the-hive/lib-core";
import { SqlRequest } from "@the-hive/lib-db";
import { DecoratedStaff } from "@the-hive/lib-skills-shared";
import fs from "fs";
import gremlin from "gremlin";
import path from "path";

const CSV_USED_SKILLS_FILE_NAME = "users_used_skills.csv";
const CSV_NOT_USED_SKILLS_FILE_NAME = "users_not_used_skills.csv";
const CSV_USED_SKILLS_FILE_PATH = path.join(__dirname, CSV_USED_SKILLS_FILE_NAME);
const CSV_NOT_USED_SKILLS_FILE_PATH = path.join(__dirname, CSV_NOT_USED_SKILLS_FILE_NAME);
const CACHE_DURATION_MS = 60 * 10 * 1000; // 10 min cache duration
const USERS_WHO_USED_SKILLS_CSV_HEADERS = parseIfSetElseDefault<string[]>("USERS_WHO_USED_SKILLS_CSV_HEADERS", ["Employee number","Employee upn","Employee name","Job title","Company entity","Department","Manager","Last visited","Last modified"]);
const USERS_WHO_DID_NOT_USE_SKILLS_CSV_HEADERS = parseIfSetElseDefault<string[]>("USERS_WHO_DID_NOT_USE_SKILLS_CSV_HEADERS", ["Employee number","Employee upn","Employee name","Job title","Company entity","Department","Manager"]);

export class FileLogic {
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
  }

  getCSVFileName(hasUsedSkills: boolean){
    if(hasUsedSkills){
      return CSV_USED_SKILLS_FILE_NAME;
    } else{
      return CSV_NOT_USED_SKILLS_FILE_NAME;
    }
  }

  private getCSVFilePath(hasUsedSkills: boolean){
    if(hasUsedSkills){
      return CSV_USED_SKILLS_FILE_PATH;
    } else{
      return CSV_NOT_USED_SKILLS_FILE_PATH;
    }
  }

  private isCacheValid(hasUsedSkills: boolean){
    try {
        const stats = fs.statSync(this.getCSVFilePath(hasUsedSkills));
        return Date.now() - stats.mtimeMs < CACHE_DURATION_MS;
    } catch {
        return false; // We don't care why the error occured, if it occurs we can just recreate another cache csv file
    }
  }

  async setCSVFileAndGetCSVFilePath(staffSummary: DecoratedStaff[], hasUsedSkills: boolean) : Promise<string>{
    await this.createCSVFile(staffSummary, hasUsedSkills);
    return this.getCSVFilePath(hasUsedSkills);
  }

  private createCSVFile(staffSummary: DecoratedStaff[], hasUsedSkills: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const csvHeaders = hasUsedSkills ? USERS_WHO_USED_SKILLS_CSV_HEADERS : USERS_WHO_DID_NOT_USE_SKILLS_CSV_HEADERS;
        const fileStream= fs.createWriteStream(this.getCSVFilePath(hasUsedSkills));

        fileStream.write(csvHeaders.join(",") + "\n");

        staffSummary.forEach(row => {
          const values = [
            row.bbdUserName,
            row.upn,
            row.displayName,
            row.jobTitle,
            row.entityDescription,
            row.department,
            row.manager,
            ...(hasUsedSkills ? [row.lastVisited, row.lastModified] : [])
          ]
          fileStream.write(values.join(",") + "\n");
        });

        fileStream.on("finish", () => resolve());
        fileStream.on("error", (err) => reject(err));

        fileStream.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
