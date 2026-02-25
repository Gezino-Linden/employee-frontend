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

type ActiveTab = 'request' | 'my-requests' | 'approvals' | 'balance' | 'calendar';

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
  myRequestsFilter: string = ''; // '', 'pending', 'approved', 'rejected'

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

  // ========================= UI HELPERS (NEW) =========================

  /**
   * Get emoji icon for leave type
   */
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

  /**
   * Get relative time string (e.g., "2 days ago")
   */
  getRelativeTime(date: string | Date): string {
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

  /**
   * Calculate total available days across all leave types
   */
  getTotalAvailable(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.remaining_days || 0), 0);
  }

  /**
   * Calculate total used days across all leave types
   */
  getTotalUsed(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.used_days || 0), 0);
  }

  /**
   * Calculate total pending days across all leave types
   */
  getTotalPending(): number {
    return this.balances.reduce((sum, bal) => sum + (bal.pending_days || 0), 0);
  }

  // ========================= ORIGINAL HELPERS =========================

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

  // ========================= FORM HELPERS =========================
  fc(name: string) {
    return this.requestForm.get(name);
  }

  hasError(name: string, error: string) {
    const c = this.fc(name);
    return c?.hasError(error) && c?.touched;
  }
}
