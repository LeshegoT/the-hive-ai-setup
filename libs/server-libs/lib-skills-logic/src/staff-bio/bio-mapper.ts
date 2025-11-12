import { formatAsYearsAndMonths } from "@the-hive/lib-shared";
import { Skill, StaffBio, StaffBioAttributes, WorkExperience } from "@the-hive/lib-skills-shared";
import { StaffSpokenLanguage } from "@the-hive/lib-staff-shared";

// API Models
export interface GenerateBioRequest {
  staffId: number
}

export interface GenerateBioResponse{
  document: Buffer;
  filename: string;
  mimeType: string;
}


type ValidSkill = {
  attribute: string;
  attributesDetails: {
    yearsExperience: number;
    lastUsed: string;
    skillLevel: number;
  };
}

const isValidSkill = (skill: {attributesDetails?:{yearsExperience?: number}}): skill is ValidSkill =>
  skill?.attributesDetails?.yearsExperience
  && typeof skill.attributesDetails.yearsExperience === 'number'
  && skill?.attributesDetails?.yearsExperience > 0

const sortSkillsByMostYearsExperienceAndName  = (skill: ValidSkill, otherSkill: ValidSkill): number => {
  const yearsA = skill.attributesDetails.yearsExperience;
  const yearsB = otherSkill.attributesDetails.yearsExperience;

  if (yearsB !== yearsA) {
    return yearsB - yearsA;
  }

  return skill.attribute.localeCompare(otherSkill.attribute);
};

const formatSkill = (skill: ValidSkill): Skill => ({
  name: skill.attribute,
  yearsExperience: formatAsYearsAndMonths(skill.attributesDetails.yearsExperience),
  lastUsed: skill.attributesDetails.lastUsed,
  skillLevel: skill.attributesDetails.skillLevel.toString()
});


/* eslint-disable  @typescript-eslint/no-explicit-any */
// TODO: RE - the function in this file need to be properly typed
const mapSkills = (skills: any[]): Skill[] => {
  return skills
    .filter(isValidSkill)
    .sort(sortSkillsByMostYearsExperienceAndName)
    .map(formatSkill);
}

const mapQualifications = (qualifications: any[] | undefined = []) =>
  qualifications.map(qualification => ({
    name: qualification.attribute,
    institution: qualification.attributesDetails.obtainedFrom,
    year: qualification.attributesDetails.dateOfGraduation
  }));

const mapCertifications = (certifications: any[]) =>
  certifications.map(certification => ({
    name: certification.attribute,
    institution: certification.attributesDetails.obtainedFrom,
    year: certification.attributesDetails.achievedDate
  }));


export const mapStaffBio = (
  name: string,
  jobTitle: string,
  staffAttributes: StaffBioAttributes,
  profilePicture: string,
  workExperiences: WorkExperience[],
  skillsProfile: string,
  staffSpokenLanguages: StaffSpokenLanguage[],
  nationality: string,
  residence: string,
  dateOfBirth: Date
): StaffBio => {
  return {
    name: name,
    jobTitle: jobTitle,
    qualifications: mapQualifications(staffAttributes.Qualification || []),
    certifications: mapCertifications(staffAttributes.Certification || []),
    skills: mapSkills(staffAttributes.Skill || []),
    profilePicture: profilePicture,
    workExperiences: workExperiences,
    profileOverview: skillsProfile,
    staffSpokenLanguages: staffSpokenLanguages,
    nationality,
    residence,
    dateOfBirth
  }
}
