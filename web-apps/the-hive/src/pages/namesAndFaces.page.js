const { StatefulPage } = require("./stateful-page-view-element");
const { html } = require("lit");
import { shared, animations, reviewShared } from '../styles';
import '../components/names-and-faces-card.component';
import '../components/names-and-faces-filter.component';
import '../components/pagination.component';
import namesAndFacesService from '../services/names-and-faces.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import userService from '../services/user.service';

pdfMake.vfs = pdfFonts.vfs;

let style = html`
  <style>
    ${shared()} ${animations()} ${reviewShared()} .cards {
      display: flex;
      flex-wrap: wrap;
      padding-left: 3em;
      justify-content: left;
      margin-bottom: 3em;
      margin-top: 1em;
    }

    .filter {
      max-width: 100%;
      margin-top: 0em;
      padding: 0em;
      position: sticky;
      top: 4em;
      display: flex;
      flex-direction: column;
    }

    #filterButton {
      display: none;
    }

    .filter > * {
      margin: 1em;
    }

    section > * {
      padding: 10px;
      margin-left: 0em;
      margin-right: 0em;
    }

    .filter {
      top: 4em;
    }

    .card {
      height: fit-content;
      width: 30%;
    }

    .hidden {
      display: none;
    }

    #filterComponent.show {
      display: block;
    }

    #filterComponent {
      display: block;
    }

    #errorMessage {
      font-size: 2em;
      text-align: center;
      margin: 2em 0em;
      color: var(--app-warning-background-color-secondary);
      background-color: white;
      font-weight: bold;
      font-style: normal;
    }

    #exportInfo {
      justify-content: center;
      align-items: center;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      position: fixed;
      border: 1px solid black;
      z-index: 8;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      border-radius: 10px;
    }

    #exportInfoTitle {
      font-size: 1.2em;
      font-weight: bold;
      margin: 0em;
    }

    #exportInfoMessage {
      font-size: 0.9em;
      font-style: italic;
      margin: 0em;
      color: rgba(0, 0, 0, 0.6);
    }

    @media only screen and (max-width: 650px) {
      #filterButton {
        display: block;
        align-self: end;
      }

      .cards {
        justify-content: center;
        padding-left: 0em;
      }
      
      .card {
        width: 80%;
      }

      #filterComponent {
        display: none;
      }
    }

    @media only screen and (min-width: 651px) and (max-width: 900px) {
      .card {
        width: 45%;
      }

      section > * {
        margin-left: 0;
      }
    }

    @media only screen and (max-width: 1100px) {
      .card {
        min-width: 30%;
      }

      section > * {
        margin-left: 0;
      }
    }
  </style>
`;
class NamesAndFaces extends StatefulPage {
  static properties = {
    filter: { type: Object },
    bbdUsers: { type: Object },
  };

  constructor() {
    super();
    this.isOverlay = false;
    this.bbdUsers = [];
    this.createdCanvases = new Map();
    this.filter = {
      page: 1,
      size: 10,
      unit: '',
      group: '',
      office: '',
      searchString: '',
      employmentFrom: '',
      employmentTo: '',
    };
    this.loadUsers();
  }

  createOverlay() {
    let overlay = document.createElement('section');
    let overlayStyle = document.createElement('style');

    overlayStyle.textContent = `

      .hideOverflow {
        overflow: hidden;
      }

      .exportInfoOverlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 7;
      }
    `;
    
    overlay.id = 'exportInfoOverlay';
    overlayStyle.id = 'exportInfoOverlayStyle';

    document.body.appendChild(overlay);
    document.head.appendChild(overlayStyle);
  }

  removeOverlay() {
    let overlay = document.getElementById('exportInfoOverlay');
    let overlayStyle = document.getElementById('exportInfoOverlayStyle');

    document.body.removeChild(overlay);
    document.head.removeChild(overlayStyle);
  }

  connectedCallback() {
    super.connectedCallback();
    this.createOverlay();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeOverlay();
    this.createdCanvases.clear();
  }

  render() {
    return html`
      ${style}

      <section>
        <e-title name="FaceWall" icon="images/logos/names-and-faces.svg"></e-title>
        ${this.renderExportInfo()}
        ${this.renderFilterSection()} 
        ${this.renderUsersSection(this.bbdUsers)} 
        ${this.renderPagination()}
      </section>
    `;
  }

  renderUsersSection(users) {
    if (users.length > 0) {
      return html`
        <section class="cards">
          ${users.map((user) => {
            return this.renderCard(user);
          })}
        </section>
      `;
    } else {
      return html`
        <section id="errorMessage">${this.errorMessage}</section>
      `;
    }
  }

  renderCard(user) {
    return html`
      <e-names-and-faces-card .userDetail=${user} class="card"></e-names-and-faces-card>
    `;
  }

  renderFilterSection() {
    return html`
      <section class="filter">
        <input type="button" id="filterButton" @click=${this.toggleFilterComponent} class="redButton" value="Filter" />
        <e-names-and-faces-filter
          id="filterComponent"
          .exportIsDisabled=${this.bbdUsers.length === 0}
          @filter-changed=${(e) => {
            this.filter.page = 1;
            this.handleFilterChanges(e.detail);
          }}
          @exportTriggered=${(e) => this.exportToPdf()}
        />
      </section>
    `;
  }

  toggleFilterComponent() {
    let filterComponent = this.shadowRoot.getElementById('filterComponent');
    filterComponent.classList.toggle('show');
  }

  renderPagination() {
    if (this.bbdUsers.length > 0) {
      return html`
        <e-pagination
          .resultSetSize=${this.resultSetSize}
          .size=${this.filter.size}
          .totalPages=${this.totalPages}
          .page=${this.filter.page}
          @page-information-changed=${(e) => this.handleFilterChanges(e.detail)}
        />
      `;
    }
  }

  toggleExportInfo() {
    let exportInfo = this.shadowRoot.getElementById('exportInfo');
    let overlay = document.getElementById('exportInfoOverlay');

    if (this.isOverlay) {
      overlay.classList.remove('exportInfoOverlay');
      exportInfo.classList.add('hidden');
      document.body.classList.remove('hideOverflow');
      this.isOverlay = false;
    } else {
      overlay.classList.add('exportInfoOverlay');
      exportInfo.classList.remove('hidden');
      document.body.classList.add('hideOverflow');
      this.isOverlay = true;
    }
  }

  renderExportInfo() {
    return html`
      <section id="exportInfo" class="hidden">
        <object type="image/svg+xml" data="../images/hive-loader.svg"></object>
        <p id="exportInfoTitle">Hold on! We are preparing PDF file for you</p>
        <p id="exportInfoMessage">This message will automatically close once the file is downloaded</p>
      </section>
    `;
  }

  async createUserCard(user) {
    let userImage;
    try {
      userImage = await this.getUserImageFromUpn(user.userPrincipleName);
    } catch (error) {
      let userIcon = '../images/user-icon.png';
      userImage = await this.getBase64ImageFromUrl(userIcon);
    }

    return [
      {
        columns: [
          {
            width: 100,
            image: userImage,
            fit: [100, 100],
            style: 'userImage',
          },
          {
            width: '*',
            stack: [
              { text: user.displayName, style: 'userName' },
              { text: user.jobTitle, style: 'userJobRole' },
              { text: user.unit, style: 'userUnit' },
            ],
          },
        ],
        columnGap: 30,
      },
    ];
  }

  async getUserImageFromUpn(upn) {
    let blobUrl = await userService.getImage(upn);
    return await this.getBase64ImageFromUrl(blobUrl);
  }

  async getBase64ImageFromUrl(url) {
    if(!this.createdCanvases.has(url)){
      let baseImage = await namesAndFacesService.getBase64ImageFromURL(url);
      this.createdCanvases.set(url, baseImage);
      return baseImage;
    }
    return this.createdCanvases.get(url);
  }

  async generateHeader() {
    let logoImage = '../images/BBDLogo.png';
    let header = {
      layout: 'noBorders',
      table: {
        headerRows: 0,
        widths: ['*', 100],
        body: [
          [
            { text: 'BBD Employees', fontSize: 16, margin: [0, 15, 0, 0] },
            {
              image: await this.getBase64ImageFromUrl(logoImage),
              width: 100,
            },
          ],
        ],
      },
    };

    return header;
  }

  async getAllFilteredUsers(){
    let filter = {
      ...this.filter,
      size: this.resultSetSize,
    };
    let allFilteredUsers = await namesAndFacesService.getBBDUsers(filter);
    return allFilteredUsers.data;
  }

  async exportToPdf() {
    this.toggleExportInfo();
    let content = [];
    let usersPerPage = 10;
    let userCounter = 0;
    let horizontalLine = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 550, y2: 0, lineWidth: 1.5 }] };
    let pdfHeader = await this.generateHeader();
    content.push(pdfHeader);
    content.push(horizontalLine);
    let allFilteredUsers = await this.getAllFilteredUsers();

    for (let i = 0; i < allFilteredUsers.length; i += 2) {
      let user1 = allFilteredUsers[i];
      let user2 = allFilteredUsers[i + 1];
      let card1,
        card2,
        cards = [];

      if (user1) {
        card1 = await this.createUserCard(user1);
        cards.push(...card1);
      }
      if (user2) {
        card2 = await this.createUserCard(user2);
        cards.push(...card2);
      }

      let users = { columns: [...cards] };

      if (userCounter >= usersPerPage) {
        content.push({ text: '', pageBreak: 'after' });
        userCounter = 0;
      } else {
        content.push('\n\n');
      }
      userCounter += 2;
      content.push(users);
    }

    const documentDefinition = {
      content: content,
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
        header: {
          fontSize: 18,
          bold: true,
        },
        userImage: {
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        userName: {
          fontSize: 11,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        userJobRole: {
          fontSize: 10,
          margin: [0, 0, 0, 10],
        },
        userUnit: {
          fontSize: 10,
          margin: [0, 0, 0, 10],
        },
      },
    };

    pdfMake
      .createPdf(documentDefinition)
      .download(`BBD Employees ${new Date().toLocaleDateString()}.pdf`);
    
    this.toggleExportInfo();
  }

  handleFilterChanges(newFilterData) {
    this.filter = {
      ...this.filter,
      ...newFilterData,
    };
    this.loadUsers();
  }

  loadUsers() {
    this.bbdUsers = [];
    this.errorMessage = 'Loading, Please Wait...';
    namesAndFacesService
      .getBBDUsers(this.filter)
      .then((response) => {
        let { pageInfo, data } = response;
        let { page, pageSize, totalPages, resultSetSize } = pageInfo;
        this.bbdUsers = data;
        this.filter.page = page;
        this.filter.size = pageSize;
        this.resultSetSize = resultSetSize;
        this.totalPages = totalPages;
      })
      .catch((error) => {
        this.bbdUsers = [];
        this.errorMessage = error.message;
      });
  }
}

window.customElements.define('e-names-and-faces', NamesAndFaces);