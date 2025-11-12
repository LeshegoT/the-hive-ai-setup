import { AlignmentType, ITableCellOptions, ShadingType } from "docx";
import { getBioTemplateFromAzure } from "./bio-document-strategy"
import { DocumentPatchBuilder } from "./document-patch-builder";
import { WorkExperience, Certification, Qualification, Skill, StaffBio } from "@the-hive/lib-skills-shared";
import moment from "moment";

function formatSkillsForDocument(skills: Skill[]): ITableCellOptions[][] {
  const skillsHeaders: ITableCellOptions[] = ['Key technical skill', 'Experience'].map(header => (
    {children: [DocumentPatchBuilder.generateParagraph({ 
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: header, 
        bold: true,
        color: 'FFFFFF',
      })],
    })],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'A6A6A6',
    },
  }));

  const skillsRows: ITableCellOptions[][] = skills.map(skill => [
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: skill.name,
        alignment: AlignmentType.LEFT
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: skill.yearsExperience.toString(),
      })],
    },
  ]);

  if(skillsRows.length == 0) {
    skillsRows.push([
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "Staff has not loaded any skills",
          alignment: AlignmentType.LEFT,
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      }
    ]);
  }

  return [skillsHeaders, ...skillsRows];
}

function formatCertificationsForDocument(certifications: Certification[]): ITableCellOptions[][] {
  const certificationsHeaders: ITableCellOptions[] = ['Certification', 'Institution', 'Year'].map(header => (
    {children: [DocumentPatchBuilder.generateParagraph({ 
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: header, 
        bold: true,
        color: 'FFFFFF',
      })],
    })],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'A6A6A6',
    },
  }));

  const certificationsRows: ITableCellOptions[][] = certifications.map(certification => [
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: certification.name,
        alignment: AlignmentType.LEFT
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: certification.institution,
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: moment(certification.year).format('YYYY'),
      })],
    },
  ]);

  if(certificationsRows.length == 0) {
    certificationsRows.push([
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "Staff has not loaded any certifications",
          alignment: AlignmentType.LEFT,
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      }
    ]);
  }

  return [certificationsHeaders, ...certificationsRows];
}

function formatQualificationsForDocument(qualifications: Qualification[]): ITableCellOptions[][] {
  const qualificationsHeaders: ITableCellOptions[] = ['Qualification', 'Institution', 'Year'].map(header => (
    {children: [DocumentPatchBuilder.generateParagraph({ 
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: header, 
        bold: true,
        color: 'FFFFFF',
      })],
    })],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'A6A6A6',
    },
  }));

  const qualificationsRows: ITableCellOptions[][] = qualifications.map(qualification => [
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: qualification.name,
        alignment: AlignmentType.LEFT
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: qualification.institution,
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({ 
        text: moment(qualification.year).format('YYYY'),
      })],
    },
  ]);

  if(qualificationsRows.length == 0) {
    qualificationsRows.push([
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "Staff has not loaded any qualifications",
          alignment: AlignmentType.LEFT,
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      }
    ]);
  } else {
    // The staff member has qualifications, so we don't need to add a stub qualification
  }

  return [qualificationsHeaders, ...qualificationsRows];
}

function formatWorkExperienceForDocument(workExperience?: WorkExperience): ITableCellOptions[][] {
  const workExperienceHeaders: ITableCellOptions[] = ['Company', 'Sector', 'Role', 'Start Date', 'End Date'].map(header => (
    {children: [DocumentPatchBuilder.generateParagraph({ 
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: header, 
        bold: true,
        color: 'FFFFFF',
      })],
    })],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'A6A6A6',
    },
  }));

  const technologyHeading: ITableCellOptions = {
    children: [DocumentPatchBuilder.generateParagraph({
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: 'Technologies used',
        bold: true
      })],
    })],
    columnSpan: workExperienceHeaders.length,
    shading: {
      type: ShadingType.CLEAR,
      fill: 'D9D9D9',
    },
  };

  const outcomesHeading: ITableCellOptions = {
    children: [DocumentPatchBuilder.generateParagraph({
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: 'Experience and delivered outcomes summary',
        bold: true
      })],
    })],
    columnSpan: workExperienceHeaders.length,
    shading: {
      type: ShadingType.CLEAR,
      fill: 'D9D9D9',
    },
  };
  let workExperienceRow: ITableCellOptions[] = [];
  let technologies: ITableCellOptions;
  let outcomes: ITableCellOptions;
  if (workExperience) {
    if (workExperience.technologies.length > 0) {
      technologies = {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            bullet: {
              level: 0
            },
            children: [
              DocumentPatchBuilder.generateTextRun({ 
                text: workExperience.technologies.map(technology => technology.canonicalName).join(', ') 
              })
            ]
          })
        ],
        columnSpan: workExperienceHeaders.length,
      };
    } else {
      technologies = {
        children: [DocumentPatchBuilder.generateParagraph({ text: "No technologies used have been added for this work experience", alignment: AlignmentType.LEFT })],
        columnSpan: workExperienceHeaders.length,
      };
    }
  
    if (workExperience.outcomes.length > 0) {
      outcomes = { 
        children: workExperience.outcomes.map(outcome => (
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            bullet: {
              level: 0
            },
            children: [DocumentPatchBuilder.generateTextRun({ text: outcome.body })],
          }))),
        columnSpan: workExperienceHeaders.length,
      };
    } else {
      outcomes = {
        children: [DocumentPatchBuilder.generateParagraph({ text: "No delivered outcomes have been added for this work experience", alignment: AlignmentType.LEFT })],
        columnSpan: workExperienceHeaders.length,
      };
    }

    workExperienceRow = [
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: workExperience.companyName,
        })], 
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: workExperience.sectorName,
        })], 
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: workExperience.roleName,
        })], 
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: moment(workExperience.startDate).format('MMM YYYY'),
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: moment(workExperience.endDate).format('MMM YYYY'),
        })],
      },
    ];
  } else {
    technologies = {
      children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      columnSpan: workExperienceHeaders.length,
    };
    outcomes = {
      children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      columnSpan: workExperienceHeaders.length,
    };
    
    workExperienceRow = [
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: "Staff has not loaded any work experiences", alignment: AlignmentType.LEFT })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ text: "" })],
      },
    ];
  }

  const rows: ITableCellOptions[][] = [
    workExperienceHeaders,
    workExperienceRow
  ];

  rows.push([technologyHeading]);
  rows.push([technologies]);
  rows.push([outcomesHeading]);
  rows.push([outcomes]);

  return rows;
}

export const bioTemplateStrategySa = async (
  bioTemplateFileName: string,
  staffBio: StaffBio
): Promise<Buffer> => {
  const templateBuffer = await getBioTemplateFromAzure(bioTemplateFileName);

  const skillsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatSkillsForDocument(staffBio.skills), [75, 25]);
  const certificationsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatCertificationsForDocument(staffBio.certifications), [50, 25, 25]);
  const qualificationsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatQualificationsForDocument(staffBio.qualifications), [50, 25, 25]);
  const tables = staffBio.workExperiences.map(workExperience => DocumentPatchBuilder.generateTableWithStyleOptions(formatWorkExperienceForDocument(workExperience), [20, 20, 20, 20, 20]));

  if (tables.length == 0) {
    tables.push(DocumentPatchBuilder.generateTableWithStyleOptions(formatWorkExperienceForDocument(undefined), [20, 20, 20, 20, 20]));
  } else {
    // The staff member has work experience, so we don't need to add a stub work experience
  }

  const patchBuilder = new DocumentPatchBuilder(templateBuffer)
    .replaceText("display_name", staffBio.name)
    .replaceText("job_title", staffBio.jobTitle)
    .replaceParagraphAtPlaceHolder("overview", staffBio.profileOverview || "Staff has not loaded a profile overview")
    .replaceTableAtPlaceHolder('skills', skillsTable)
    .replaceTableAtPlaceHolder('certifications', certificationsTable)
    .replaceTableAtPlaceHolder('qualifications', qualificationsTable)
    .replaceSectionAtPlaceHolder('experience', tables);

  return await patchBuilder.buildDocumentBuffer();
};


export const bioTemplateStrategyIndia = async (
  bioTemplateFileName: string,
  staffBio: StaffBio
): Promise<Buffer> => {
  const templateBuffer = await getBioTemplateFromAzure(bioTemplateFileName);

  const skillsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatSkillsForDocument(staffBio.skills), [75, 25]);
  const certificationsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatCertificationsForDocument(staffBio.certifications), [50, 25, 25]);
  const qualificationsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatQualificationsForDocument(staffBio.qualifications), [50, 25, 25]);

  const tables = staffBio.workExperiences.map(workExperience => DocumentPatchBuilder.generateTableWithStyleOptions(formatWorkExperienceForDocument(workExperience), [20, 20, 20, 20, 20]));

  if (tables.length == 0) {
    tables.push(DocumentPatchBuilder.generateTableWithStyleOptions(formatWorkExperienceForDocument(undefined), [20, 20, 20, 20, 20]));
  } else {
    // The staff member has work experience, so we don't need to add a stub work experience
  }

  const patchBuilder = new DocumentPatchBuilder(templateBuffer)
    .replaceText("display_name", staffBio.name)
    .replaceText("job_title", staffBio.jobTitle)
    .replaceParagraphAtPlaceHolder("overview", staffBio.profileOverview || "Staff has not loaded a profile overview")
    .replaceTableAtPlaceHolder('certifications', certificationsTable)
    .replaceTableAtPlaceHolder('qualifications', qualificationsTable)
    .replaceTableAtPlaceHolder('skills', skillsTable)
    .replaceSectionAtPlaceHolder('experience', tables);

  return await patchBuilder.buildDocumentBuffer();
}




function formatSkillsForDocumentNl(skills: Skill[]): ITableCellOptions[][] {
  const skillsHeaders: ITableCellOptions[] = ['Technology', 'Experience\n(years)', 'Level*', 'Last Used'].map(header => (
    {children: [DocumentPatchBuilder.generateParagraph({ 
      children: [DocumentPatchBuilder.generateTextRun({ 
        text: header, 
        bold: true,
      })],
      spacing: {
        after: 150,
      },
    })],
  }));

  const skillsRows: ITableCellOptions[][] = skills.map(skill => [
    {
      children: [DocumentPatchBuilder.generateParagraph({
        spacing: {
          after: 150,
        },
        text: skill.name,
        alignment: AlignmentType.LEFT
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({
        spacing: {
          after: 150,
        },
        text: skill.yearsExperience.toString()
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({
        spacing: {
          after: 150,
        },
        text: skill.skillLevel
      })],
    },
    {
      children: [DocumentPatchBuilder.generateParagraph({
        spacing: {
          after: 150,
        },
        text: skill.lastUsed === 'current' ? 'Current' : moment(skill.lastUsed).format('MMM YYYY')
      })],
    },
  ]);

  if(skillsRows.length == 0) {
    skillsRows.push([
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "Staff has not loaded any technologies",
          alignment: AlignmentType.LEFT,
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      },
      {
        children: [DocumentPatchBuilder.generateParagraph({ 
          text: "",
        })],
      }
    ]);
  } else {
    // The staff member has technologies, so we don't need to add a stub technology
  }

  return [skillsHeaders, ...skillsRows];
}

function formatWorkExperienceForDocumentNl(workExperience: WorkExperience): ITableCellOptions[][] {
  const sections: ITableCellOptions[][] = [];
  const workExperienceDetails: ITableCellOptions[][] = [
    {
      heading: "Client:",
      value: workExperience.companyName,
    },
    {
      heading: "Date:",
      value: `${moment(workExperience.startDate).format("MMM YYYY")} to ${moment(workExperience.endDate).format("MMM YYYY")}`,
    },
    {
      heading: "Industry:",
      value: workExperience.sectorName,
    },
    {
      heading: "Role:",
      value: workExperience.roleName,
    },
   ].map(detail => [
     {
       children: [
         DocumentPatchBuilder.generateParagraph({
           alignment: AlignmentType.LEFT,
           children: [
             DocumentPatchBuilder.generateTextRun({
              text: detail.heading,
               bold: true,
             }),
           ],
         }),
       ],
     },
     {
       children: [
         DocumentPatchBuilder.generateParagraph({
           alignment: AlignmentType.LEFT,
           children: [
             DocumentPatchBuilder.generateTextRun({
               text: detail.value,
             }),
           ],
         }),
       ],
     },
   ]);

   sections.push(...workExperienceDetails);

  if (workExperience.projectDescription) {
    const projectDescriptionHeader: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 200,
            },
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: "Project Description:",
                bold: true
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ];

    const projectDescriptionRow: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: workExperience.projectDescription
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ];

    sections.push(projectDescriptionHeader, projectDescriptionRow);
  } else {
    const projectDescriptionHeader: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 200,
            },
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: "Project Description:",
                bold: true
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ];

    const projectDescriptionRow: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            text: "No project description has been added for this work experience",
            alignment: AlignmentType.LEFT,
          })
        ],
        columnSpan: 2,
      }
    ];
    sections.push(projectDescriptionHeader, projectDescriptionRow);
  }

  if (workExperience.outcomes && workExperience.outcomes.length > 0) {
    const responsibilitiesHeader: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 200,
            },
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: "Responsibilities:",
                bold: true
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ];

    const responsibilitiesRows: ITableCellOptions[][] = workExperience.outcomes.map(outcome => [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            bullet: {
              level: 0
            },
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: outcome.body
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ]);

    sections.push(responsibilitiesHeader, ...responsibilitiesRows);
  } else {
    // No responsibilities/outcomes provided
  }

  const technologiesHeader: ITableCellOptions[] = [
    {
      children: [
        DocumentPatchBuilder.generateParagraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            before: 200,
          },
          children: [
            DocumentPatchBuilder.generateTextRun({
              text: "Technologies used:",
              bold: true
            })
          ]
        })
      ],
      columnSpan: 2,
    }
  ];

  if (workExperience.technologies.length > 0) {
    const technologiesRow: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            alignment: AlignmentType.LEFT,
            children: [
              DocumentPatchBuilder.generateTextRun({
                text: workExperience.technologies.map(technology => technology.canonicalName).join(', ')
              })
            ]
          })
        ],
        columnSpan: 2,
      }
    ];

    sections.push(technologiesHeader, technologiesRow);
  } else {
    //Dont add the technologies used section
    const technologiesRow: ITableCellOptions[] = [
      {
        children: [
          DocumentPatchBuilder.generateParagraph({
            text: "No technologies used have been added for this work experience",
            alignment: AlignmentType.LEFT,
          })
        ],
        columnSpan: 2,
      }
    ];
    sections.push(technologiesHeader, technologiesRow);
  }

  sections.push([
    {
      children: [
        DocumentPatchBuilder.generateParagraph({
          spacing: {
            before: 200,
            after: 200,
          },
          border: {
            bottom: {
              color: "000000",
              style: "single",
              size: 20,
            }
          },
        })
      ],
      columnSpan: 2,
    }
  ]);

  return sections;
}

export const bioTemplateStrategyNl = async (
  bioTemplateFileName: string,
  staffBio: StaffBio
): Promise<Buffer> => {

  const templateBuffer = await getBioTemplateFromAzure(bioTemplateFileName);

  const skillsTable = DocumentPatchBuilder.generateTableWithStyleOptions(formatSkillsForDocumentNl(staffBio.skills), [40, 20, 20, 20]);

  const workExperienceTables = staffBio.workExperiences.map(workExperience => 
    DocumentPatchBuilder.generateTableWithStyleOptions(formatWorkExperienceForDocumentNl(workExperience), [25, 75], true)
  );

  const spokenLanguagesParagraphs = staffBio.staffSpokenLanguages.map(spokenLanguage => DocumentPatchBuilder.generateParagraph({ text: `${spokenLanguage.language} (${spokenLanguage.proficiency})`, alignment: AlignmentType.LEFT }));

  const patchBuilder = new DocumentPatchBuilder(templateBuffer)
    .replaceText("display_name", staffBio.name)
    .replaceText("job_title", staffBio.jobTitle)
    .replaceParagraphAtPlaceHolder("overview", staffBio.profileOverview || "Staff has not loaded a profile overview")
    .addBulletedList("courses", staffBio.certifications.length > 0 ? staffBio.certifications.map(c => c.name) : ["Staff has not loaded any certifications"])
    .addBulletedList("qualifications", staffBio.qualifications.length > 0 ? staffBio.qualifications.map(c => c.name) : ["Staff has not loaded any qualifications"])
    .replaceTableAtPlaceHolder('skills', skillsTable)
    .replaceSectionAtPlaceHolder('experience', workExperienceTables.length > 0 ? workExperienceTables : [DocumentPatchBuilder.generateParagraph({ text: "Staff has not loaded any work experiences", alignment: AlignmentType.LEFT })])
    .replaceSectionAtPlaceHolder('languages', spokenLanguagesParagraphs, false)
    .replaceText("nationality", staffBio.nationality || "Staff nationality not set")
    .replaceText("residence", staffBio.residence || "Staff residence not set")
    .replaceText("date_of_birth", staffBio.dateOfBirth ? moment(staffBio.dateOfBirth).format("DD MMMM YYYY") : "Staff date of birth not set")

  return await patchBuilder.buildDocumentBuffer();
}

