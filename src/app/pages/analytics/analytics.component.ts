// File: src/app/pages/analytics/analytics.component.ts
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, DashboardOverview, PayrollAnalytics, LeaveAnalytics, AttendanceAnalytics, HRInsights } from '../../services/analytics.service';

export interface DeptInsight {
  department: string; headcount: number; totalGross: number; avgSalary: number;
  payrollShare: number; costPerHead: number;
  flag: 'high-cost'|'lean'|'normal'|'overstaffed'; flagLabel: string; flagDetail: string;
}

@Component({ selector: 'app-analytics', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './analytics.component.html', styleUrls: ['./analytics.component.css'] })
export class AnalyticsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  selectedYear = 2026; selectedMonth = 2; years = [2024,2025,2026];
  activeTab: 'overview'|'payroll'|'leave'|'attendance'|'insights' = 'overview';
  dashboardData: DashboardOverview|null=null; payrollData: PayrollAnalytics|null=null;
  leaveData: LeaveAnalytics|null=null; attendanceData: AttendanceAnalytics|null=null; hrData: HRInsights|null=null;
  loading=false; error:string|null=null; payrollLoading=false; leaveLoading=false; attendanceLoading=false; insightsLoading=false;
  deptInsights: DeptInsight[]=[];
  months=[{value:1,label:'January'},{value:2,label:'February'},{value:3,label:'March'},{value:4,label:'April'},{value:5,label:'May'},{value:6,label:'June'},{value:7,label:'July'},{value:8,label:'August'},{value:9,label:'September'},{value:10,label:'October'},{value:11,label:'November'},{value:12,label:'December'}];
  constructor(private analyticsService: AnalyticsService) {}
  ngOnInit() { this.loadDashboard(); }
  loadDashboard() {
    this.loading=true; this.error=null;
    this.analyticsService.getDashboardOverview(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next:(d)=>{this.dashboardData=d;this.loading=false;}, error:()=>{this.error='Failed to load analytics';this.loading=false;} });
  }
  loadPayroll() {
    if(this.payrollData)return; this.payrollLoading=true;
    this.analyticsService.getPayrollAnalytics(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next:(d)=>{this.payrollData=d;this.payrollLoading=false;}, error:()=>{this.payrollLoading=false;} });
  }
  loadLeave() {
    if(this.leaveData)return; this.leaveLoading=true;
    this.analyticsService.getLeaveAnalytics(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next:(d)=>{this.leaveData=d;this.leaveLoading=false;}, error:()=>{this.leaveLoading=false;} });
  }
  loadAttendance() {
    if(this.attendanceData)return; this.attendanceLoading=true;
    this.analyticsService.getAttendanceAnalytics(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next:(d)=>{this.attendanceData=d;this.attendanceLoading=false;}, error:()=>{this.attendanceLoading=false;} });
  }
  loadInsights() {
    if(this.deptInsights.length&&this.hrData)return; this.insightsLoading=true;
    this.analyticsService.getPayrollAnalytics(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next:(payroll)=>{
        this.payrollData=payroll;
        this.analyticsService.getHRInsights(this.selectedMonth,this.selectedYear).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next:(hr)=>{this.hrData=hr;this.buildDeptInsights(payroll,hr);this.insightsLoading=false;}, error:()=>{this.insightsLoading=false;} });
      }, error:()=>{this.insightsLoading=false;} });
  }
  buildDeptInsights(payroll: PayrollAnalytics, hr: HRInsights) {
    if(!payroll.departmentBreakdown?.length)return;
    const totalGross=payroll.departmentBreakdown.reduce((s,d)=>s+parseFloat(d.total_gross),0);
    const totalHeads=payroll.departmentBreakdown.reduce((s,d)=>s+d.employee_count,0);
    const overallAvg=totalHeads>0?totalGross/totalHeads:0;
    this.deptInsights=payroll.departmentBreakdown.map(dept=>{
      const totalG=parseFloat(dept.total_gross), avgS=parseFloat(dept.avg_salary);
      const share=totalGross>0?(totalG/totalGross)*100:0;
      const costPerHead=dept.employee_count>0?totalG/dept.employee_count:0;
      const avgMultiple=overallAvg>0?avgS/overallAvg:1;
      const isMgmt=dept.department.toLowerCase().includes('manage');
      let flag:'high-cost'|'lean'|'normal'|'overstaffed'='normal', flagLabel='Normal', flagDetail='Payroll distribution within expected range.';
      if(isMgmt&&share>30){flag='high-cost';flagLabel='High Payroll Share';flagDetail=`Management consumes ${share.toFixed(0)}% of total payroll (${this.fmt(totalG)}). Review senior headcount vs operational output.`;}
      else if(avgMultiple>1.4&&!isMgmt){flag='high-cost';flagLabel='Above-Average Cost';flagDetail=`Avg salary ${((avgMultiple-1)*100).toFixed(0)}% above company average. Review role grades or consider restructuring.`;}
      else if(dept.employee_count>=4&&share<14){flag='overstaffed';flagLabel='Potential Overstaffing';flagDetail=`${dept.employee_count} staff but only ${share.toFixed(0)}% of payroll. High headcount relative to cost — verify workload justification.`;}
      else if(dept.employee_count<=2&&share>18){flag='high-cost';flagLabel='High Cost / Low Headcount';flagDetail=`Only ${dept.employee_count} staff driving ${share.toFixed(0)}% of payroll. Senior positions inflating department cost.`;}
      else if(avgMultiple<0.75){flag='lean';flagLabel='Lean / Cost-Efficient';flagDetail=`Below-average salaries — strong cost efficiency. Monitor for staff retention and burnout risk.`;}
      return {department:dept.department,headcount:dept.employee_count,totalGross:totalG,avgSalary:avgS,payrollShare:share,costPerHead,flag,flagLabel,flagDetail};
    });
  }
  setTab(tab:'overview'|'payroll'|'leave'|'attendance'|'insights'){
    this.activeTab=tab;
    if(tab==='payroll')this.loadPayroll();
    if(tab==='leave')this.loadLeave();
    if(tab==='attendance')this.loadAttendance();
    if(tab==='insights')this.loadInsights();
  }
  onPeriodChange(){
    this.dashboardData=null;this.payrollData=null;this.leaveData=null;this.attendanceData=null;this.hrData=null;this.deptInsights=[];
    this.loadDashboard(); if(this.activeTab!=='overview')this.setTab(this.activeTab);
  }
  fmt(val:string|number):string{const n=typeof val==='string'?parseFloat(val):val;if(isNaN(n))return 'R 0';return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:0});}
  fmtDec(val:string|number):string{const n=typeof val==='string'?parseFloat(val):val;if(isNaN(n))return 'R 0,00';return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});}
  attendanceRate():number{if(!this.dashboardData?.attendance)return 0;const a=this.dashboardData.attendance;const total=a.present_count+a.late_count+a.absent_count;return total===0?0:Math.round(((a.present_count+a.late_count)/total)*100);}
  avgHours():string{return parseFloat(this.dashboardData?.attendance?.avg_hours_worked||'0').toFixed(1);}
  leaveApprovalRate():number{const l=this.dashboardData?.leave;if(!l||l.total_requests===0)return 0;return Math.round((l.approved_requests/l.total_requests)*100);}
  getMonthLabel():string{return this.months.find(m=>m.value===this.selectedMonth)?.label||'';}
  getBarWidth(value:string|number,data:any[],key='total_gross'):number{const vals=data.map(d=>parseFloat(d[key]??d.total_gross??d.avg_salary??d.total_days??'0'));const max=Math.max(...vals);const val=typeof value==='string'?parseFloat(value):value;return max===0?0:Math.round((val/max)*100);}
  getDeptColor(i:number):string{return['#10b981','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'][i%8];}
  getFlagColor(flag:string):string{if(flag==='high-cost')return '#ef4444';if(flag==='overstaffed')return '#f59e0b';if(flag==='lean')return '#10b981';return '#6366f1';}
  getFlagBg(flag:string):string{if(flag==='high-cost')return 'rgba(239,68,68,0.08)';if(flag==='overstaffed')return 'rgba(245,158,11,0.08)';if(flag==='lean')return 'rgba(16,185,129,0.08)';return 'rgba(15,23,42,0.9)';}
  totalPayroll():number{return this.deptInsights.reduce((s,d)=>s+d.totalGross,0);}
  alertCount():number{return this.deptInsights.filter(d=>d.flag==='high-cost'||d.flag==='overstaffed').length;}
  genderMale():number{return this.hrData?.genderDistribution?.find(g=>g.gender==='Male')?.count||0;}
  genderFemale():number{return this.hrData?.genderDistribution?.find(g=>g.gender==='Female')?.count||0;}
  ageBarWidth(count:number):number{if(!this.hrData?.ageDistribution?.length)return 0;const max=Math.max(...this.hrData.ageDistribution.map(a=>a.count));return max===0?0:Math.round((count/max)*100);}
}
