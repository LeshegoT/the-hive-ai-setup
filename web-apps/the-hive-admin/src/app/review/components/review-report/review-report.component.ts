import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { Person, ReviewReportResponse, VoluntaryFeedback, HistoricReviewResponse } from '../../../shared/interfaces';
import { FeedbackService, Review } from '../../../review/services/feedback.service';
import { EnvironmentService } from '../../../services/environment.service';
import * as moment from 'moment';
import { ProfileService } from '../../../services/profile.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { StaffOverviewService } from '../../services/staff-overview.service';
import { provideMaterialDatePickerConfiguration } from '../../../pipes/date-format.pipe';
import { isBBDEmail } from '@the-hive/lib-shared';
import { Observable, map } from 'rxjs';

pdfMake.vfs = pdfFonts.vfs;

const MAX_CHARACTERS_SINGLE_COLUMN = 3400;
const MAX_CHARACTERS_DOUBLE_COLUMN = 1400;
export interface PrintIncluded {
  levelup: boolean;
  levelUpFrom: Date;
  levelUpTo: Date;
  voluntary: boolean;
  voluntaryFrom: Date;
  voluntaryTo: Date;
}

export interface DoubleComment {
  positiveComment: string;
  constructiveComment: string;
}

export interface SingleComment {
  generalComment: string;
}

export interface Response {
  levelup: (ReviewReportResponse | HistoricReviewResponse)[];
  response: (ReviewReportResponse | HistoricReviewResponse)[];
  review: Review;
  voluntary: VoluntaryFeedback[];
  flag?: string;
}

export type ReportType = 'Employee Feedback' | 'Exec Feedback';
export const reportIdentifiable: ReportType = 'Exec Feedback';
export const reportAnonymous: ReportType = 'Employee Feedback';

@Component({
    selector: 'app-review-report',
    templateUrl: './review-report.component.html',
    styleUrls: ['./review-report.component.css', '../../../shared/shared.css'],
    standalone: false,
    providers: [provideMaterialDatePickerConfiguration()]
})
export class ReviewReportComponent implements OnInit, OnChanges {
  @Output() toggleGenerateReportMode: EventEmitter<boolean> = new EventEmitter();
  @Output() showSnackBar: EventEmitter<string> = new EventEmitter();
  @Input() review: Review;

  inclusions: PrintIncluded;
  activeReviewee: Person;
  loading: boolean;
  profilePlaceholder: any;
  profileFrame: any;
  userIcon: any;
  spinner: MatProgressSpinnerModule;
  spinnerLoading: boolean;

  makePrintStructure(content: any[]) {
    return {
      pageMargins: [20, 30, 20, 60],
      content,
      footer: function (currentPage, pageCount) {
        return [
          {
            text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
            alignment: 'right',
            margin: [20, 20],
            fontSize: 9,
          },
        ];
      },
      styles: {
        profileInformationSection: {
          color: '#3D3D3D',
          margin: [0, 15, 0, 5],
        },
        profileInformationSubHeader: {
          color: '#a3a2a2',
          fontSize: 10,
          margin: [20, 0, 0, 0],
        },
        profileInformationText: {
          margin: [20, 0, 0, 10],
          fontSize: 12,
          color: '#3D3D3D',
        },
      },
    }
  }

  constructor(
    public feedbackService: FeedbackService,
    public environmentService: EnvironmentService,
    public staffOverviewService: StaffOverviewService,
    public profileService: ProfileService
  ) {}

  async ngOnInit() {
    this.profileFrame = await this.getBase64ImageFromURL('assets/images/profileWhiteFrame.png');
    this.profilePlaceholder = await this.getBase64ImageFromURL('assets/images/profilePlaceholder-square.svg');
    this.userIcon = await this.getBase64ImageFromURL('assets/images/user-icon.svg');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.inclusions = {
      levelup: false,
      levelUpFrom: new Date(),
      levelUpTo: new Date(),
      voluntary: false,
      voluntaryFrom: new Date(),
      voluntaryTo: new Date(),
    };

    this.inclusions.levelUpFrom.setFullYear(new Date().getFullYear() - 1);
    this.inclusions.voluntaryFrom.setFullYear(new Date().getFullYear() - 1);

    this.loading = true;
    this.staffOverviewService.getStaffOnRecord(this.review.reviewee).subscribe(
      (res) => {
        this.activeReviewee = res;
        this.loading = false;
      },
      (err) => {
        this.showSnackBar.emit(`Could not load Staff Member details for ${this.review.reviewee}`);
        this.loading = false;
      }
    );
  }

  cancelReportGeneration(cancelledReportDownload = true) {
    this.toggleGenerateReportMode.emit(cancelledReportDownload);
  }

  async getReportData() {
    this.loading = true;

    if (this.validationCheck()) {
      let queryParameters = '';

      if (this.inclusions.levelup) {
        queryParameters += `&levelupFrom=${moment(this.inclusions.levelUpFrom).toISOString()}&levelupTo=${moment(
          this.inclusions.levelUpTo
        ).toISOString()}`;
      }

      if (this.inclusions.voluntary) {
        queryParameters += `&voluntaryFrom=${moment(this.inclusions.voluntaryFrom).toISOString()}&voluntaryTo=${moment(
          this.inclusions.voluntaryTo
        ).toISOString()}`;
      }

      this.exportReports(queryParameters, this.review.template.name, this.activeReviewee, this.inclusions);
    } else {
      this.loading = false;
    }
  }

  async generateAnonymousReport(queryParameters: string, templateName: string, reviewee: Person, inclusions: PrintIncluded) {
    const anonymousParameters = `?anonymous=true${queryParameters}`;

    this.feedbackService.getReportFeedback(this.review.reviewID, anonymousParameters).subscribe(
      (res) => {
        this.exportReport(reportAnonymous, res, templateName, reviewee, inclusions);
      },
      (_err) => {
        this.loading = false;
      }
    );
  }

  async generateNonAnonymousReport(queryParameters: string,  templateName: string, reviewee: Person, inclusions: PrintIncluded) {
    const nonAnonymousParameters = queryParameters.replace(queryParameters[0], '?');

    this.feedbackService.getReportFeedback(this.review.reviewID, nonAnonymousParameters).subscribe(
      (res) => {
        this.exportReport(reportIdentifiable, res, templateName, reviewee, inclusions);
      },
      (_err) => {
        this.loading = false;
      }
    );
  }

  validationCheck() {
    if (this.inclusions.levelup) {
      if (moment(this.inclusions.levelUpFrom).diff(this.inclusions.levelUpTo) >= 0) {
        this.showSnackBar.emit('Invalid date range selected for Level-Up Reviews');
        return false;
      }
    }

    if (this.inclusions.voluntary) {
      if (moment(this.inclusions.voluntaryFrom).diff(this.inclusions.voluntaryTo) >= 0) {
        this.showSnackBar.emit('Invalid date range selected for Voluntary Reviews');
        return false;
      }
    }

    return true;
  }

  getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = url;
    });
  }
  
  retrieveReportDownloadFlags(templateName: string): Observable<{ includeStaffReport: boolean; includeExecReport: boolean }> {
    return this.feedbackService.getFeedbackAssignmentTemplates().pipe(
      map(assignmentTemplates => 
        assignmentTemplates.find(
          assignmentTemplate => assignmentTemplate.templateName === templateName
        )
      )
    );
  }


  async exportReports(queryParameters, templateName: string, reviewee: Person, inclusions: PrintIncluded) {
    this.retrieveReportDownloadFlags(templateName).subscribe(reportDownloadFlags => {
      if (reportDownloadFlags?.includeStaffReport) {
        this.generateAnonymousReport(queryParameters, templateName, reviewee, inclusions);
      }else{
        // do not generate anonymous report
      }
      
      if (reportDownloadFlags?.includeExecReport) {
        this.generateNonAnonymousReport(queryParameters, templateName, reviewee, inclusions);
      }else{
        // do not generate non-anonymous report
      }

    });
  }

  extractedProvidedQualificationInFeedback(review, reviewee: Person) {
    const selfReview = review.find(
      (response) => response.reviewer.upn.toLowerCase() == reviewee.userPrincipleName.toLowerCase()
    );

    if (selfReview) {
      const qualification = selfReview.discussionPoints.find(
        (answer) => answer.question.name.toLowerCase() == 'highest qualification(s)'
      );

      if (qualification) {
        return  {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Highest Qualifications (Self Reported)',
                  style: 'profileInformationSubHeader',
                  borderColor: ['#ffffff', '#ffffff','#ffffff', '#ffffff']
                }],
              [
                {
                  text: qualification.generalComment,
                  style: 'profileInformationText',
                  borderColor: ['#ffffff', '#ffffff','#ffffff', '#BBBBBB']
                },

              ],
            ],
          },
          unbreakable: true,
        }
      }
    }

    return undefined;
  }

  extractedProvidedExperienceInFeedback(review, reviewee: Person) {
    const selfReview = review.find(
      (response) => response.reviewer.upn.toLowerCase() == reviewee.userPrincipleName.toLowerCase()
    );

    if (selfReview) {
      const experience = selfReview.discussionPoints.find(
        (answer) => answer.question.name.toLowerCase() == 'years of relevant it experience'
      );
      if (experience) {
        return {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Years of Relevant IT Experience (Self Reported)',
                  style: 'profileInformationSubHeader',
                  borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                },
              ],
              [
                {
                  text: experience.generalComment,
                  style: 'profileInformationText',
                  borderColor: ['#ffffff', '#ffffff', '#ffffff', '#BBBBBB'],
                },
              ],
            ],
          },
          unbreakable: true,
        };
      }
    }

    return undefined;
  }

  async exportReport(type: ReportType, reviewMessages: Response, templateName: string, reviewee: Person, inclusions: PrintIncluded) {
    this.spinnerLoading = true;

    const creationDate = moment().format('LL');
    const pdfHeader = await this.generateHeader(creationDate, type===reportIdentifiable?reviewMessages.flag:'');
    const personalInformation = await this.generateRevieweePersonalInformation();
    const reviewResponses = await this.generateReviewResponses(
      reviewMessages.response,
      templateName + ' Review Feedback',
      type,
      reviewee
    );

    const content = [];

    content.push(pdfHeader);
    content.push(personalInformation);

    /**************************************************************************
     * TODO: Remove hardcoded code for qualification question
     **************************************************************************/
    const qualification = this.extractedProvidedQualificationInFeedback(reviewMessages.response, reviewee);
    if(qualification){
      content.push(qualification);
    }

    const experience = this.extractedProvidedExperienceInFeedback(reviewMessages.response, reviewee);
    if (experience) {
      content.push(experience);
    }

    /************************************************************************ */

    content.push(reviewResponses);

    if (reviewMessages && reviewMessages.voluntary && reviewMessages.voluntary.length > 0) {
      content.push({
        layout: 'noBorders',
        margin: [5, 30, 5, 0],
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Voluntary Reviews', fontSize: 16, bold: true }],
            [
              {
                text: `Date Range: ${moment(inclusions.voluntaryFrom).format('LL')} - ${moment(
                  inclusions.voluntaryTo
                ).format('LL')}`,
                fontSize: 12,
                color: '#BBBBBB',
              },
            ],
          ],
        },
        unbreakable: true,
      });
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 560, y2: 0, lineWidth: 1, color: '#BBBBBB' }],
        marginTop: 30,
      });
      const voluntaryResponse = await this.generateReviewResponses(reviewMessages.voluntary, 'Voluntary Review', type, reviewee);
      content.push(voluntaryResponse);
    }

    if (reviewMessages && reviewMessages.levelup && reviewMessages.levelup.length > 0) {
      content.push({
        layout: 'noBorders',
        margin: [5, 30, 5, 0],
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Level-Up Reviews', fontSize: 16, bold: true }],
            [
              {
                text: `Date Range: ${moment(inclusions.levelUpFrom).format('LL')} - ${moment(
                  inclusions.levelUpTo
                ).format('LL')}`,
                fontSize: 12,
                color: '#BBBBBB',
              },
            ],
          ],
        },
        unbreakable: true,
      });
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 560, y2: 0, lineWidth: 1, color: '#BBBBBB' }],
        marginTop: 30,
      });
      const levelupResponse = await this.generateReviewResponses(reviewMessages.levelup, 'Level-Up Review', type, reviewee);
      content.push(levelupResponse);
    }

    const pdfFileName = this.buildReviewReportPdfName(reviewee.displayName,templateName,type,creationDate);
    //Print PDF
    await pdfMake
      .createPdf(this.makePrintStructure(content), null, null, pdfFonts.vfs)
      .download(pdfFileName, () => {
        if(type === reportIdentifiable) {
          this.spinnerLoading = false;
          this.cancelReportGeneration(false);
        }
      });
  }

  buildReviewReportPdfName(
    revieweeName: string,
    templateName: string,
    creationDate: string,
    reportType: string
  ): string {
    return `${revieweeName}-${templateName}-${creationDate}-${reportType}-Review-Report.pdf`;
  }

  async generateHeader(creationDate: string, flag: string) {
    const logoImage =
      (await this.environmentService.loadConfig()).BASE_SERVER_URL +
      '/static-content/images/logos/BBD-logo-with-text.png';

    const header = {
      layout: 'noBorders',
      table: {
        headerRows: 0,
        widths: ['*', 100],
        body: [
          [
            {
              layout: 'noBorders',
              table: {
                headerRows: 0,
                widths: ['*'],
                body: [
                  [{ text: 'Consolidated Feedback Report '+(flag?'(+)':''), fontSize: 16 }],
                  [{ text: creationDate, fontSize: 12, color: '#3D3D3D' }],
                ],
              },
            },
            {
              image: await this.getBase64ImageFromURL(logoImage),
              width: 100,
            },
          ],
        ],
      },
    };

    return header;
  }

  async generateRevieweePersonalInformation() {
    const profile = await this.retrievePersonProfileImage(
      this.activeReviewee.userPrincipleName,
      reportIdentifiable,
      false
    );
    const information = [
      {
        table: {
          headerRows: 0,
          widths: [60, '*'],
          body: [
            [
              {
                image: profile,
                width: 65,
                height: 65,
                borderColor: ['#ffffff', '#BBBBBB', '#ffffff', '#ffffff'],
                marginTop: 10,
                alignment: 'center',
              },
              {
                text: this.activeReviewee.displayName,
                fontSize: 20,
                bold: true,
                borderColor: ['#ffffff', '#BBBBBB', '#ffffff', '#ffffff'],
                marginTop: 20,
                marginLeft: 5,
              },
            ],
            [
              {
                text: '',
                borderColor: ['#ffffff', '#BBBBBB', '#ffffff', '#ffffff'],
              },
              {
                text: this.activeReviewee.jobTitle,
                fontSize: 12,
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                relativePosition: { x: 0, y: -30 },
                marginLeft: 5,
              },
            ],
          ],
        },
      },

      {
        style: 'profileInformationSection',
        table: {
          headerRows: 0,
          widths: ['auto', '*', '*'],
          body: [
            [
              {
                borderColor: ['#ffffff', '#ffffff', '#BBBBBB', '#ffffff'],
                table: {
                  headerRows: 0,
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: 'Email',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: this.activeReviewee.userPrincipleName,
                        style: 'profileInformationText',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: 'Employee Number',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: this.activeReviewee.userName,
                        style: 'profileInformationText',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                  ],
                },
              },
              {
                borderColor: ['#ffffff', '#ffffff', '#BBBBBB', '#ffffff'],
                table: {
                  headerRows: 0,
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: 'Current Home Unit',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: this.activeReviewee.department,
                        style: 'profileInformationText',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: 'Team Lead',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: this.activeReviewee.managerDisplayName,
                        style: 'profileInformationText',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                  ],
                },
              },
              {
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                table: {
                  headerRows: 0,
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: 'Employee Start Date',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: moment(this.activeReviewee.startDate).format('LL'),
                        style: 'profileInformationText',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    [
                      {
                        text: 'Latest Qualifications (Skills)',
                        style: 'profileInformationSubHeader',
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                      },
                    ],
                    this.generateQualifications(this.activeReviewee.qualifications)
                  ],
                },
              },
            ],
            [
              { text: '', margin: 10, borderColor: ['#ffffff', '#ffffff', '#ffffff', '#BBBBBB'] },
              { text: '', margin: 10, borderColor: ['#ffffff', '#ffffff', '#ffffff', '#BBBBBB'] },
              { text: '', margin: 10, borderColor: ['#ffffff', '#ffffff', '#ffffff', '#BBBBBB'] },
            ],
          ],
        },
      },
    ];

    return information.flat(1);
  }

  generateQualifications(qualifications) {
    let result;

    if (qualifications && qualifications.length > 0) {
      result = [
        {
          borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
          table: {
            headerRows: 0,
            widths: ['*'],
            body: qualifications.map((qualification) => {
              return [{ text: qualification, borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }];
            }),
          },
          unbreakable: true,
          marginLeft: 15,
        },
      ];
    } else {
      result = [{ text: 'not captured ', marginLeft: 20, borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }];
    }

    return result;
  }

  async generateReviewResponses(responses, responseType: string, reportType: ReportType, reviewee: Person) {
    const result = [];

    for (const response of responses) {
      const responseHeading = await this.generateReponseHeading(response, responseType, reportType, reviewee);

      let responseFeedback = [];

      if (response.tags) {
        responseFeedback = this.generateTaggedFeedback(response);
      } else if (response.feedback) {
        responseFeedback = this.generateSurveyFeedback(response);
      }

      result.push(responseHeading);

      result.push(responseFeedback.flat(1));
      result.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 560, y2: 0, lineWidth: 1, color: '#BBBBBB' }],
        marginTop: 30,
      });
    }

    return result.flat(1);
  }

  getDataURLFromBlob = async (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  async retrievePersonProfileImage(upn: string, reportType: ReportType, anonymous: boolean) {
    const bbdDomains = this.environmentService.getConfiguratonValues().BBD_DOMAINS;
    if ((reportType != reportAnonymous || !anonymous) && isBBDEmail(upn, bbdDomains) && upn.toLowerCase() !== 'anonymous') {
      try {
        const userProfileBlob = await this.profileService.getImage(upn);

        if (userProfileBlob) {
          const image = await this.getDataURLFromBlob(userProfileBlob);
          if (image) {
            return image;
          }
        }
      } catch (error) {
        // return placeholder when things go bad
        return this.profilePlaceholder;
      }
    }
    return this.profilePlaceholder;
  }

  async generateReponseHeading(response, responseType: string, reportType: ReportType, reviewee: Person) {
    if (response.reviewer.upn != reviewee.userPrincipleName) {
      const profile = await this.retrievePersonProfileImage(response.reviewer.upn, reportType, response.anonymous);
      let anonymousIndication = [{}, {}, {}];

      if (reportType == reportIdentifiable && response.anonymous) {
        anonymousIndication = [
          {
            image: this.userIcon,
            width: 10,
            marginTop: 10,
            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
          },
          {
            text: `${response.reviewer.displayName} has opted to remain anonymous to ${reviewee.displayName}`,
            marginLeft: -45,
            marginTop: 10,
            fontSize: 10,
            color: '#464646',
          },
          {},
        ];
      }

      return {
        marginTop: 15,
        table: {
          widths: [50, '*', 150],
          body: [
            [
              {
                image: profile,
                width: 40,
                height: 40,
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                alignment: 'center',
              },
              {
                text: response.reviewer.displayName,
                fontSize: 16,
                bold: true,
                rowspan: 2,
                marginLeft: -10,
              },
              { text: 'Date Submitted', fontSize: 10, alignment: 'right', color: '#464646', marginRight: 20 },
            ],
            [
              {
                text: '',
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
              },
              {
                text: responseType,
                fontSize: 10,
                rowspan: 2,
                marginLeft: -10,
                color: '#464646',
                marginTop: -20,
              },
              {
                text: moment(response.createdAt).format('LL'),
                fontSize: 12,
                alignment: 'right',
                marginTop: -30,
                marginRight: 20,
              },
            ],
            anonymousIndication,
          ],
        },
        unbreakable: true,
        layout: 'headerLineOnly',
      };
    } else {
      return {
        layout: 'noBorders',
        margin: [5, 0, 5, 10],
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Self Review', fontSize: 16, bold: true, marginTop: 10 },
              {
                text: 'Date Submitted',
                fontSize: 10,
                alignment: 'right',
                marginTop: 10,
                marginRight: 10,
                color: '#464646',
                borderColor: ['#ffffff', '#2081C7', '#2081C7', '#ffffff'],
              },
            ],
            [
              {
                text: responseType,
                borderColor: ['#2081C7', '#ffffff', '#ffffff', '#2081C7'],
                fontSize: 10,
                color: '#464646',
              },
              {
                text: moment(response.createdAt).format('LL'),
                fontSize: 12,
                alignment: 'right',
                borderColor: ['#2081C7', '#ffffff', '#2081C7', '#2081C7'],
                marginTop: -10,
                marginRight: 10,
              },
            ],
          ],
        },
        unbreakable: true,
      };
    }
  }

  generateTaggedFeedback(response) {
    const result = [];
    let tagsResults = response.tags.map((tag) => this.generateRatingProgressBar(tag));
    if(tagsResults.length<1){
      // TODO: RE - this should be removed when database is clear or older feedback
      // there are one or two bad reviews with this issue of no tags in the database
      // in that case, we jsut make an array to create a table with one empty row
      tagsResults = [[]];
    }
    const tagStructure = {
      layout: 'noBorders',
      margin: [5, 20, 20, 0],
      table: {
        headerRows: 0,
        widths: [240, 280, '*'],
        body: tagsResults,
      },
      unbreakable: true,
    };

    result.push(tagStructure);

    let commentStructure = {};

    if (response.positiveComment && response.constructiveComment) {
      commentStructure = this.generateDoubleComment(response);
    } else if (response.positiveComment && !response.constructiveComment) {
      commentStructure = this.generateGeneralComment(response);
    }

    result.push(commentStructure);

    if (response.discussionPoints) {
      const discussionPoints = this.generateDiscussionPoints(response.discussionPoints);
      result.push(discussionPoints.flat(1));
    }

    return result;
  }

  generateSurveyFeedback(response: ReviewReportResponse) {
    const result = [];

    for (const section of response.feedback) {
      if (section.rating) {
        const ratingStructure = {
          layout: 'noBorders',
          margin: [5, 20, 20, 0],
          table: {
            headerRows: 0,
            widths: [240, 280, '*'],
            body: [this.generateRatingProgressBar({ ...section.rating, name: section.question.name })],
          },
          unbreakable: true,
        };
        result.push(ratingStructure);

        if (section.rating.description) {
          result.push({
            layout: 'noBorders',
            marginRight: 30,
            table: {
              headerRows: 0,
              widths: [320, 200],
              body: [
                [
                  {},
                  {
                    text: section.rating.description,
                    fontSize: 10,
                    alignment: 'right',
                    color: '#323A46',
                    marginRight: -20,
                  },
                ],
              ],
            },
          });
        }
      }

      if (section.positiveComment || section.constructiveComment) {
        result.push(this.generateDoubleComment(section));
      }
    }

    if (response && response.discussionPoints && response.discussionPoints.length > 0) {
      const discussionPoints = this.generateDiscussionPoints(response.discussionPoints);
      result.push(discussionPoints.flat(1));
    }

    return result;
  }

  generateRatingProgressBar(rating) {
    const rectangleWidth = 230;
    const score = rating.score ? rating.score : rating.rating;
    const progressBarWith = (score / rating.total) * 230;

    return [
      { text: rating.name, fontSize: 12, marginBottom: 7, bold: true },
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: rectangleWidth,
            h: 5,
            r: 8,
            fillOpacity: 0.5,
            color: '#E7EAEE',
          },
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: progressBarWith,
            h: 5,
            r: 8,
            color: '#2081C7',
          },
        ],
        margin: 3,
        alignment: 'right',
      },
      { text: score, fontSize: 12 },
    ];
  }

  isBreakable(comment) {
    return comment.length < MAX_CHARACTERS_DOUBLE_COLUMN;
  }

  generateDoubleComment(response: DoubleComment) {
    return {
      layout: 'noBorders',
      margin: [5, 10, 10, 0],
      table: {
        widths: ['*', '*'],
        body: [
          [
            { text: 'Positive Comment', fontSize: 14, color: '#2081C7' },
            { text: 'Constructive Comment', fontSize: 14, color: '#2081C7' },
          ],
          [
            {
              text: response.positiveComment ? response.positiveComment : '-',
              fontSize: 12,
              margin: [0, 5, 20, 10],
              color: '#333333',
              lineHeight: 1.18,
            },
            {
              text: response.constructiveComment ? response.constructiveComment : '-',
              fontSize: 12,
              margin: [0, 5, 0, 10],
              color: '#333333',
              lineHeight: 1.18,
            },
          ],
        ],
      },
      unbreakable: this.isBreakable(response.positiveComment) && this.isBreakable(response.constructiveComment),
    };
  }

  generateSingleComment(comment: SingleComment) {
    return [
      {
        text: comment.generalComment ? comment.generalComment : '-',
        fontSize: 12,
        margin: [0, 5, 10, 10],
        color: '#333333',
        lineHeight: 1.18,
      },
    ];
  }

  generateGeneralComment(response) {
    return {
      layout: 'noBorders',
      margin: [5, 10, 10, 0],
      table: {
        widths: ['*'],
        body: [
          [{ text: 'General Comment', fontSize: 14, color: '#2081C7' }],
          [
            {
              text: response.positiveComment ? response.positiveComment : '-',
              fontSize: 12,
              color: '#333333',
              margin: [0, 5, 20, 10],
              lineHeight: 1.18,
            },
          ],
        ],
      },
      unbreakable: response.positiveComment.length < MAX_CHARACTERS_SINGLE_COLUMN ? true : false,
    };
  }

  generateDiscussionPoints(discussionPoints) {
    const result = discussionPoints
      .map((point) => ({
        layout: 'noBorders',
        margin: [5, 10, 5, 0],
        table: {
          widths: ['*'],
          body: [[{ text: point.question.name, fontSize: 14, color: '#2081C7' }], this.generateSingleComment(point)],
        },
        unbreakable: point.generalComment.length < MAX_CHARACTERS_SINGLE_COLUMN ? true : false,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (result.length > 0) {
      result.unshift({
        layout: 'noBorders',
        margin: [5, 10, 5, 0],
        table: {
          widths: ['*'],
          body: [[{ text: 'Discussion Points', fontSize: 12, bold: true }]],
        },
      });
    }

    return result;
  }
}
