import { Component, ViewChild, Input, OnInit, OnChanges} from '@angular/core';


  export interface People {
    displayName: string;
    jobTitle: string;
    userPrincipleName: string;
    userName: string;
    department: string;
    office: string;
    entityDescription?: string;
  }

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
} from 'ng-apexcharts';
import ApexCharts from 'apexcharts';
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};


export type ReviewQuestion = {
  question: string;
  answer: string;
};

@Component({
    selector: 'app-stats-line-graph',
    templateUrl: './stats-line-graph.component.html',
    styleUrls: ['./stats-line-graph.component.css'],
    standalone: false
})
export class StatsLineGraphComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart: ChartComponent;
  @Input() chartData = {
    individualData: [],
    tagSet: []
  };
  public chartOptions: Partial<ChartOptions>;
  chartConfig;
  graphImageURI: string;
  showChart : boolean ; 


  constructor() {}

  ngOnInit() {
    this.chartConfig = this.setupChartConfig();
  }

  ngOnChanges(changes) {
    const chartConfig2 = this.setupChartConfig();

    for (const propName in changes) {
      var data = changes[propName].currentValue;
      if (propName === 'chartData' && !!data) {
        chartConfig2.series = data.tagSet;
        
        chartConfig2.chart.events = {
          click: function (event, chartContext, config) {
            if (config.dataPointIndex != -1) {
              const selectedDate = config.globals.categoryLabels[config.dataPointIndex];
              data.individualData = data.allDataCopy.filter((r) => r.creationDate.includes(selectedDate));
            }
          },
        };
        this.chartConfig = chartConfig2;
        this.chartOptions = this.chartConfig;

        const tempChart = new ApexCharts(document.querySelector('#printChart'), this.chartOptions);
        tempChart.render().then(() => {
          this.showChart = false;
          setTimeout(() => {
            (tempChart.dataURI() as Promise<any>).then(({ imgURI, blob }) => {
              this.graphImageURI = imgURI;
              tempChart.destroy();
              this.showChart = true;
            });
          }, 2000);
        });


      }
    }

  }

  setupChartConfig() {
    const con: Partial<ChartOptions> = {
      series: [],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
        events: {},
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'straight',
        width: 3,
      },
      title: {
        text: '',
        align: 'left',
        offsetX: 0,
        offsetY: 0,
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'category',
        labels: {
          hideOverlappingLabels: false,
        },
        offsetX: 0,
        offsetY: 0,
      },
    };

    return con;
  }


}
