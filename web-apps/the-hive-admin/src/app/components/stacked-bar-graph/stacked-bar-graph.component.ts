import { Component, Input, ViewChild, OnChanges } from '@angular/core';
import { FeedbackService } from '../../review/services/feedback.service';

import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  legend: ApexLegend;
};



export interface ChartDataObj {
  labels: string[];
  seriesData: SeriesDataObj[];
}

export interface SeriesDataObj {
  name: string;
  data: string[];
}
@Component({
    selector: 'app-stacked-bar-graph',
    templateUrl: './stacked-bar-graph.component.html',
    styleUrls: ['./stacked-bar-graph.component.css'],
    standalone: false
})
export class StackedBarGraphComponent implements OnChanges {
  @Input() chartData: ChartDataObj;
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  chartConfig: Partial<ChartOptions>;
  constructor(private feedbackService: FeedbackService) {}

  ngOnChanges(changes) {
    this.setupChartConfig();
    for (const propName in changes) {
      const data = changes[propName].currentValue;
      if (propName === 'chartData' && !!data) {
        this.chartConfig.series = data.seriesData;
        this.chartConfig.xaxis = {
          categories: data.labels,
        };
        this.chartOptions = this.chartConfig;
      }
    }
  }

  setupChartConfig() {
    const chartHeight = this.chartData.labels.length * 150;
    const con: Partial<ChartOptions> = {
      series: [],
      chart: {
        type: 'bar',
        height: chartHeight,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: -6,
        style: {
          fontSize: '12px',
          colors: ['#fff'],
        },
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['#fff'],
      },
      xaxis: {},
      legend: {
        position: 'top'
      }
    };

    this.chartConfig = con;
  }

}
