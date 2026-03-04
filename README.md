# PeopleOS — HR & Payroll Frontend

A full-featured Angular 18 HR management dashboard for the PeopleOS hotel payroll system.

---

## 🔗 Related Projects

- **Backend API:** [employee-api](https://github.com/Gezino-Linden/employee-api)
- **Live API:** `https://employee-api-xpno.onrender.com`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 18 (standalone components) |
| Language | TypeScript |
| Reactive | RxJS + takeUntilDestroyed (no memory leaks) |
| HTTP | Angular HttpClient with auth interceptor |
| Styling | Custom CSS (dark theme) |
| Auth | JWT stored in localStorage |

---

## ✨ Pages & Features

### 🔐 Login
- JWT authentication
- Token stored in localStorage
- Auto-redirect to dashboard on valid token

### 📊 Dashboard
- 9 KPI cards: Employees, Attendance, Shifts, Leave, Payroll, Accounting, SARS Compliance, Analytics, Reports
- Quick navigation to all modules
- Role-aware display (admin badge)

### 👥 Employees (`/employees`)
- Paginated employee list with search
- Add / edit / deactivate / restore employees
- Salary update with history modal
- Employment type, ID number, tax number fields
- Department and position management

### 🕐 Attendance (`/attendance`)
- Live clock with real-time display
- Clock in / clock out for current user
- Today's status and summary
- Monthly attendance report with hours and overtime
- Admin override tab for corrections

### 📅 Shifts (`/shifts`)
- **Templates tab** — create and manage shift types (Morning/Evening/Night) with pay rates and multipliers
- **Assign Shifts tab** — assign employees to shifts by date
- **Weekly Calendar tab** — visual week view of all assignments
- **Swap Requests tab** — employee shift swap requests with manager approval

### 🏖️ Leave (`/leave`)
- **Request tab** — submit leave requests with date range and reason
- **My Requests tab** — view own request history and status
- **Approvals tab** — manager view of pending requests
- **Balance tab** — current leave balance per type
- **Analytics tab** — leave usage trends

### 💰 Payroll (`/payroll`)
- **Overview tab** — monthly KPI summary (gross, net, PAYE, headcount)
- **Records tab** — per-employee payroll records with status filter
- **Processing tab** — initialize period, select employees, process payroll
- **History tab** — past payroll periods
- Month/year selector
- Mark as paid modal with payment method
- Payslip PDF download

### 🏛️ SARS Compliance (`/sars`)
- **EMP201 tab** — monthly PAYE/SDL/UIF declarations, generate and view
- **UI-19 tab** — monthly UIF submissions with status tracking
- **IRP5 tab** — annual employee tax certificates (IT3(a) reconciliation)

### 📊 Accounting (`/accounting`)
- **Accounts tab** — chart of accounts (31 accounts), searchable by type
- **Journals tab** — generate payroll journal entries (standard or hospitality type)
- **GL Mappings tab** — view payroll-to-GL account mappings
- **Invoices tab** — create guest invoices with line items and VAT, record payments
- **Suppliers tab** — manage suppliers and accounts payable bills
- **Revenue tab** — log daily hotel revenue (rooms, F&B, other) by department
- **Financials tab** — P&L report and VAT return with period close

### 📈 Analytics (`/analytics`)
- **Overview tab** — 6 KPI cards + compliance status + quick stats
- **Payroll tab** — monthly payroll trends and department breakdown
- **Leave tab** — leave analytics by type and department
- **Attendance tab** — punctuality and hours trends
- **Compliance tab** — SARS submission and payment status
- **HR Insights tab** — headcount, turnover and salary analytics

### 📄 Reports (`/reports`)
13 individual report types, each with Excel and PDF export:

| Category | Reports |
|---|---|
| Full Reports | Full HR Report (all data) |
| Employees | Employee Register, Headcount by Department |
| Payroll | Summary, Detailed Breakdown, Year-to-Date |
| Attendance | Monthly, Date Range, Overtime |
| Leave | Leave Balances, Leave Taken |
| SARS & Tax | EMP201 PAYE, Tax Liability Summary |

- Sidebar navigation by category
- Smart filter panel (year, month, or date range — shown only when relevant)
- Period badge updates dynamically

---

## 🏗 Project Structure

```
src/
├── app/
│   ├── pages/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── shifts/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── sars/
│   │   ├── accounting/
│   │   ├── analytics/
│   │   └── reports/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── employees.service.ts
│   │   ├── payroll.service.ts
│   │   ├── shifts.service.ts
│   │   └── accounting.service.ts
│   └── interceptors/
│       └── auth.interceptor.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Angular CLI 18+

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://employee-api-xpno.onrender.com/api',
};
```

### Development server

```bash
ng serve
```

Navigate to `http://localhost:4200/`

---

## 📦 Build

```bash
# Development build
ng build

# Production build
ng build --configuration=production
```

Build artifacts output to `dist/`.

---

## 🔒 Auth & Security

- JWT token stored in `localStorage`
- `AuthInterceptor` automatically attaches `Authorization: Bearer <token>` to all API requests
- Route guards redirect unauthenticated users to `/login`
- Role-based UI — admin/manager tabs and actions hidden from employees

---

## 🧠 Code Quality

- **Zero memory leaks** — all HTTP subscriptions use `takeUntilDestroyed(destroyRef)`
- **Zero hardcoded URLs** — all API calls use `environment.apiUrl`
- **Standalone components** throughout — no NgModule
- **OnPush change detection** where applicable
- All services use typed interfaces for API responses

---

## 🧪 Testing

```bash
# Unit tests
ng test

# E2E tests
ng e2e
```

---

## 👤 Author

**Gezino Linden**
- GitHub: [@Gezino-Linden](https://github.com/Gezino-Linden)

---

## 📄 License

This project is part of the PeopleOS full-stack HR management system.