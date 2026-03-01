// File: src/app/pages/analytics/analytics.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import {
  AnalyticsService,
  DashboardOverview,
  PayrollAnalytics,
  LeaveAnalytics,
  AttendanceAnalytics,
  ComplianceAnalytics,
  HRInsights,
} from '../../services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  // Date filters
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  selectedYear = this.currentYear;
  selectedMonth = this.currentMonth;
  years: number[] = [];

  // Tab management
  activeTab: 'overview' | 'payroll' | 'leave' | 'attendance' | 'compliance' | 'hr' = 'overview';

  // Data
  dashboardData: DashboardOverview | null = null;
  payrollData: PayrollAnalytics | null = null;
  leaveData: LeaveAnalytics | null = null;
  attendanceData: AttendanceAnalytics | null = null;
  complianceData: ComplianceAnalytics | null = null;
  hrData: HRInsights | null = null;

  // Loading states
  loading = false;
  error: string | null = null;

  // Chart configurations
  payrollChartData: ChartConfiguration['data'] | null = null;
  payrollChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };
  payrollChartType: ChartType = 'line';

  departmentChartData: ChartConfiguration['data'] | null = null;
  departmentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
  };
  departmentChartType: ChartType = 'pie';

  leaveChartData: ChartConfiguration['data'] | null = null;
  leaveChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };
  leaveChartType: ChartType = 'bar';

  constructor(private analyticsService: AnalyticsService) {
    // Generate year options (current year and 2 years back)
    for (let i = 0; i < 3; i++) {
      this.years.push(this.currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Load main dashboard overview
  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService.getDashboardOverview(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  // Load payroll analytics
  loadPayrollData(): void {
    this.analyticsService.getPayrollAnalytics(this.selectedYear).subscribe({
      next: (data) => {
        this.payrollData = data;
        this.setupPayrollChart(data);
        this.setupDepartmentChart(data);
      },
      error: (err) => {
        console.error('Error loading payroll analytics:', err);
      },
    });
  }

  // Load leave analytics
  loadLeaveData(): void {
    this.analyticsService.getLeaveAnalytics(this.selectedYear).subscribe({
      next: (data) => {
        this.leaveData = data;
        this.setupLeaveChart(data);
      },
      error: (err) => {
        console.error('Error loading leave analytics:', err);
      },
    });
  }

  // Load attendance analytics
  loadAttendanceData(): void {
    this.analyticsService.getAttendanceAnalytics(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.attendanceData = data;
      },
      error: (err) => {
        console.error('Error loading attendance analytics:', err);
      },
    });
  }

  // Load compliance analytics
  loadComplianceData(): void {
    this.analyticsService.getComplianceAnalytics(this.selectedYear).subscribe({
      next: (data) => {
        this.complianceData = data;
      },
      error: (err) => {
        console.error('Error loading compliance analytics:', err);
      },
    });
  }

  // Load HR insights
  loadHRData(): void {
    this.analyticsService.getHRInsights().subscribe({
      next: (data) => {
        this.hrData = data;
      },
      error: (err) => {
        console.error('Error loading HR insights:', err);
      },
    });
  }

  // Setup payroll trend chart
  setupPayrollChart(data: PayrollAnalytics): void {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const labels = data.monthlyTrend.map((item) => months[item.month - 1]);

    this.payrollChartData = {
      labels,
      datasets: [
        {
          label: 'Gross Pay',
          data: data.monthlyTrend.map((item) => parseFloat(item.total_gross)),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Net Pay',
          data: data.monthlyTrend.map((item) => parseFloat(item.total_net)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }

  // Setup department pie chart
  setupDepartmentChart(data: PayrollAnalytics): void {
    this.departmentChartData = {
      labels: data.departmentBreakdown.map((item) => item.department),
      datasets: [
        {
          data: data.departmentBreakdown.map((item) => parseFloat(item.total_gross)),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        },
      ],
    };
  }

  // Setup leave bar chart
  setupLeaveChart(data: LeaveAnalytics): void {
    this.leaveChartData = {
      labels: data.leaveTypes.map((item) => item.leave_type),
      datasets: [
        {
          label: 'Approved',
          data: data.leaveTypes.map((item) => item.approved_count),
          backgroundColor: '#10b981',
        },
        {
          label: 'Rejected',
          data: data.leaveTypes.map((item) => item.rejected_count),
          backgroundColor: '#ef4444',
        },
      ],
    };
  }

  // Tab switching
  switchTab(tab: 'overview' | 'payroll' | 'leave' | 'attendance' | 'compliance' | 'hr'): void {
    this.activeTab = tab;

    // Load data for the selected tab if not loaded
    switch (tab) {
      case 'payroll':
        if (!this.payrollData) this.loadPayrollData();
        break;
      case 'leave':
        if (!this.leaveData) this.loadLeaveData();
        break;
      case 'attendance':
        if (!this.attendanceData) this.loadAttendanceData();
        break;
      case 'compliance':
        if (!this.complianceData) this.loadComplianceData();
        break;
      case 'hr':
        if (!this.hrData) this.loadHRData();
        break;
    }
  }

  // Year/month change handlers
  onYearChange(): void {
    this.loadDashboardData();
    // Reload tab-specific data if needed
    if (this.activeTab === 'payroll' && this.payrollData) {
      this.loadPayrollData();
    }
    if (this.activeTab === 'leave' && this.leaveData) {
      this.loadLeaveData();
    }
    if (this.activeTab === 'attendance' && this.attendanceData) {
      this.loadAttendanceData();
    }
    if (this.activeTab === 'compliance' && this.complianceData) {
      this.loadComplianceData();
    }
  }

  onMonthChange(): void {
    this.loadDashboardData();
    if (this.activeTab === 'attendance' && this.attendanceData) {
      this.loadAttendanceData();
    }
  }

  // Utility functions
  formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return (
      'R' + num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  formatNumber(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-ZA');
  }

  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
}
