// File: src/app/pages/leave/leave.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  LeaveService,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  CreateLeaveRequestDto,
  LeaveRequestsResponse,
} from '../../services/leave.service';
import { AuthService, MeResponse } from '../../services/auth.service';

// ADD 'analytics' TO THE TYPE
type ActiveTab = 'request' | 'my-requests' | 'approvals' | 'balance' | 'calendar' | 'analytics';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './leave.html',
  styleUrls: ['./leave.css'],
})
export class Leave implements OnInit {
  // ===== USER INFO =====
  me: MeResponse | null = null;
  loadingProfile = true;

  // ===== TAB MANAGEMENT =====
  activeTab: ActiveTab = 'request';
  minDate = new Date().toISOString().split('T')[0];

  // ===== LEAVE TYPES =====
  leaveTypes: LeaveType[] = [];
  loadingTypes = true;

  // ===== LEAVE BALANCES =====
  balances: LeaveBalance[] = [];
  loadingBalances = true;
  balanceYear = new Date().getFullYear();

  // ===== REQUEST FORM =====
  requestForm: FormGroup;
  submitLoading = false;
  submitError = '';
  submitSuccess = '';

  // ===== MY REQUESTS =====
  myRequests: LeaveRequest[] = [];
  loadingMyRequests = true;
  myRequestsError = '';
  myRequestsFilter: string = '';

  // ===== APPROVAL QUEUE (Admin/Manager) =====
  approvalRequests: LeaveRequest[] = [];
  loadingApprovals = true;
  approvalsError = '';
  approvalPage = 1;
  approvalLimit = 20;
  approvalTotal = 0;
  approvalTotalPages = 1;
  approvalsFilter: string = 'pending';

  // ===== REVIEW MODAL =====
  showReviewModal = false;
  reviewRequest: LeaveRequest | null = null;
  reviewAction: 'approve' | 'reject' = 'approve';
  reviewNotes = '';
  reviewLoading = false;
  reviewError = '';

  // ===== CANCEL CONFIRM =====
  showCancelConfirm = false;
  cancelTargetId: number | null = null;
  cancelLoading = false;

  // ===== ANALYTICS DATA =====  ← MOVED INSIDE CLASS
  analyticsData: any = null;
  loadingAnalytics = false;
  analyticsError: string = ''; // <-- ADD THIS
  analyticsYear = new Date().getFullYear();
  chartData: any = null;

  constructor(
    private leaveService: LeaveService,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.requestForm = this.fb.group({
      leave_type_id: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      reason: [''],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadLeaveTypes();
    this.loadBalances();
    this.loadMyRequests();
  }

  // ========================= PROFILE =========================
  loadProfile() {
    this.loadingProfile = true;
    this.auth.getMe().subscribe({
      next: (res: MeResponse) => {
        this.me = res;
        this.loadingProfile = false;
        if (this.isAdmin() || this.isManager()) {
          this.loadApprovals();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= TAB MANAGEMENT =========================
  switchTab(tab: ActiveTab) {
    this.activeTab = tab;
    this.submitError = '';
    this.submitSuccess = '';

    // Load analytics when switching to analytics tab
    if (tab === 'analytics') {
      this.loadAnalytics();
    }

    this.cdr.detectChanges();
  }

  // ========================= LEAVE TYPES =========================
  loadLeaveTypes() {
    this.loadingTypes = true;
    this.leaveService.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
        this.loadingTypes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTypes = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= LEAVE BALANCES =========================
  loadBalances() {
    this.loadingBalances = true;
    this.leaveService.getMyBalances(this.balanceYear).subscribe({
      next: (balances) => {
        this.balances = balances;
        this.loadingBalances = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingBalances = false;
        this.cdr.detectChanges();
      },
    });
  }

  changeBalanceYear(year: number) {
    this.balanceYear = year;
    this.loadBalances();
  }

  // ========================= REQUEST LEAVE =========================
  submitRequest() {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.submitLoading = true;
    this.submitError = '';
    this.submitSuccess = '';

    const data: CreateLeaveRequestDto = this.requestForm.value;

    this.leaveService.createRequest(data).subscribe({
      next: () => {
        this.submitLoading = false;
        this.submitSuccess = 'Leave request submitted successfully!';
        this.requestForm.reset();
        this.loadBalances();
        this.loadMyRequests();
        setTimeout(() => {
          this.switchTab('my-requests');
        }, 1500);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.submitLoading = false;
        this.submitError = err?.error?.error || 'Failed to submit request';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= MY REQUESTS =========================
  loadMyRequests() {
    this.loadingMyRequests = true;
    this.myRequestsError = '';
    this.leaveService.getMyRequests(this.myRequestsFilter || undefined).subscribe({
      next: (requests) => {
        this.myRequests = requests;
        this.loadingMyRequests = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.myRequestsError = err?.error?.error || 'Failed to load requests';
        this.loadingMyRequests = false;
        this.cdr.detectChanges();
      },
    });
  }

  filterMyRequests(status: string) {
    this.myRequestsFilter = status;
    this.loadMyRequests();
  }

  // ========================= CANCEL REQUEST =========================
  confirmCancel(id: number) {
    this.cancelTargetId = id;
    this.showCancelConfirm = true;
    this.cdr.detectChanges();
  }

  closeCancelConfirm() {
    this.cancelTargetId = null;
    this.showCancelConfirm = false;
    this.cdr.detectChanges();
  }

  executeCancel() {
    if (!this.cancelTargetId) return;
    this.cancelLoading = true;
    this.leaveService.cancelRequest(this.cancelTargetId).subscribe({
      next: () => {
        this.cancelLoading = false;
        this.showCancelConfirm = false;
        this.cancelTargetId = null;
        this.loadMyRequests();
        this.loadBalances();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cancelLoading = false;
        this.myRequestsError = err?.error?.error || 'Failed to cancel request';
        this.showCancelConfirm = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= APPROVAL QUEUE =========================
  loadApprovals() {
    this.loadingApprovals = true;
    this.approvalsError = '';
    this.leaveService
      .getAllRequests(this.approvalPage, this.approvalLimit, this.approvalsFilter || undefined)
      .subscribe({
        next: (response: LeaveRequestsResponse) => {
          this.approvalRequests = response.data;
          this.approvalPage = response.page;
          this.approvalLimit = response.limit;
          this.approvalTotal = response.total;
          this.approvalTotalPages = response.totalPages;
          this.loadingApprovals = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.approvalsError = err?.error?.error || 'Failed to load approval queue';
          this.loadingApprovals = false;
          this.cdr.detectChanges();
        },
      });
  }

  filterApprovals(status: string) {
    this.approvalsFilter = status;
    this.approvalPage = 1;
    this.loadApprovals();
  }

  prevApprovalPage() {
    if (this.approvalPage <= 1) return;
    this.approvalPage--;
    this.loadApprovals();
  }

  nextApprovalPage() {
    if (this.approvalPage >= this.approvalTotalPages) return;
    this.approvalPage++;
    this.loadApprovals();
  }

  // ========================= REVIEW MODAL =========================
  openReviewModal(request: LeaveRequest, action: 'approve' | 'reject') {
    this.reviewRequest = request;
    this.reviewAction = action;
    this.reviewNotes = '';
    this.reviewError = '';
    this.showReviewModal = true;
    this.cdr.detectChanges();
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.reviewRequest = null;
    this.reviewNotes = '';
    this.reviewError = '';
    this.cdr.detectChanges();
  }

  submitReview() {
    if (!this.reviewRequest) return;

    this.reviewLoading = true;
    this.reviewError = '';

    const request$ =
      this.reviewAction === 'approve'
        ? this.leaveService.approveRequest(this.reviewRequest.id, this.reviewNotes)
        : this.leaveService.rejectRequest(this.reviewRequest.id, this.reviewNotes);

    request$.subscribe({
      next: () => {
        this.reviewLoading = false;
        this.closeReviewModal();
        this.loadApprovals();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reviewLoading = false;
        this.reviewError = err?.error?.error || 'Failed to process request';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= ANALYTICS =========================
  // ========================= ANALYTICS =========================
  loadAnalytics() {
    this.loadingAnalytics = true;
    this.analyticsError = ''; // Add this property if not exists

    // Call the REAL API endpoint
    this.leaveService.getAnalytics(this.analyticsYear).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.prepareChartData(data.monthly_trends);
        this.loadingAnalytics = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingAnalytics = false;
        this.analyticsError = err?.error?.error || 'Failed to load analytics';
        console.error('Analytics error:', err);
        this.cdr.detectChanges();
      },
    });
  }

  // Add this helper method for chart data
  prepareChartData(monthlyData: any[]) {
    if (!monthlyData) return;

    // Find max value for scaling
    const maxRequests = Math.max(...monthlyData.map((m) => m.requests || 0), 1);

    this.chartData = {
      months: monthlyData,
      maxValue: maxRequests,
      // Calculate heights as percentages
      getBarHeight: (value: number) => {
        return maxRequests > 0 ? (value / maxRequests) * 100 : 0;
      },
    };
  }

  // Remove or comment out these mock methods:
  // - generateMonthlyTrends()
  // - generateDeptStats()

  generateDeptStats() {
    return [
      { dept: 'IT', total: 45, used: 38, avg: 4.2 },
      { dept: 'HR', total: 30, used: 22, avg: 3.8 },
      { dept: 'Sales', total: 52, used: 48, avg: 5.1 },
      { dept: 'Marketing', total: 28, used: 20, avg: 3.5 },
    ];
  }

  calculateUsageRates() {
    if (!this.balances.length) return [];

    return this.balances.map((b: LeaveBalance) => ({
      type: b.leave_type,
      total: b.total_days,
      used: b.used_days,
      remaining: b.remaining_days,
      usagePercent: Math.round((b.used_days / b.total_days) * 100) || 0,
    }));
  }

  getTrendDirection(current: number, previous: number): string {
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '→';
  }

  getTrendColor(current: number, previous: number): string {
    if (current > previous) return 'var(--danger)';
    if (current < previous) return 'var(--success)';
    return 'var(--text-muted)';
  }

  getLeaveTypeColor(typeName: string): string {
    const colors: { [key: string]: string } = {
      'Annual Leave': '#8b5cf6',
      'Sick Leave': '#ef4444',
      'Personal Leave': '#f59e0b',
      'Remote Work': '#3b82f6',
      'Casual Leave': '#10b981',
    };
    return colors[typeName] || '#8b5cf6';
  }

  // ========================= UI HELPERS =========================
  getLeaveTypeIcon(leaveType: string): string {
    const icons: { [key: string]: string } = {
      'Annual Leave': '🏖️',
      'Sick Leave': '🏥',
      'Personal Leave': '🏠',
      'Remote Work': '💻',
      'Casual Leave': '🌴',
      'Maternity Leave': '👶',
      'Paternity Leave': '👨‍👩‍👧',
      'Bereavement Leave': '🕯️',
      'Unpaid Leave': '💸',
      'Study Leave': '📚',
      'Compassionate Leave': '💜',
      'Emergency Leave': '🚨',
      'Marriage Leave': '💒',
      'Relocation Leave': '🚚',
    };
    return icons[leaveType] || '📅';
  }

  getRelativeTime(date: string | Date | undefined | null): string {
    if (!date) return 'recently';

    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 7200) return '1 hour ago';
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 60) return '1 month ago';

    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  getTotalAvailable(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.remaining_days || 0), 0);
  }

  getTotalUsed(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.used_days || 0), 0);
  }

  getTotalPending(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.pending_days || 0), 0);
  }

  isAdmin(): boolean {
    return this.me?.role === 'admin';
  }

  isManager(): boolean {
    return this.me?.role === 'manager' || this.me?.role === 'admin';
  }

  getStatusClass(status: string): string {
    const map: any = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  }

  getStatusIcon(status: string): string {
    const map: any = {
      pending: '⏳',
      approved: '✓',
      rejected: '✕',
      cancelled: '🚫',
    };
    return map[status] || '•';
  }

  formatDate(date: string | Date | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getLeaveTypeName(id: number): string {
    return this.leaveTypes.find((t) => t.id === id)?.name || 'Unknown';
  }

  getBalanceByType(typeId: number): LeaveBalance | null {
    return this.balances.find((b) => b.leave_type_id === typeId) || null;
  }

  canCancelRequest(request: LeaveRequest): boolean {
    return request.status === 'pending';
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  goToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }

  fc(name: string) {
    return this.requestForm.get(name);
  }

  hasError(name: string, error: string) {
    const c = this.fc(name);
    return c?.hasError(error) && c?.touched;
  }
  onYearChange(year: any) {
    this.analyticsYear = Number(year);
    this.loadAnalytics();
  }
}
