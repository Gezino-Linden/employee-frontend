# MaeRoll — HR & Accounting Frontend (Angular 18)

> **Full-stack SaaS HR, Payroll & Accounting frontend** for the hospitality industry.
> Built with Angular 18 standalone components. Deployed on Netlify.

---

## 🔗 Links

| | |
|---|---|
| **Live App** | https://gentle-kulfi-c11ec3.netlify.app |
| **Backend Repo** | https://github.com/Gezino-Linden/employee-api |
| **Live API** | https://employee-api-xpno.onrender.com |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 18 (standalone components) |
| Language | TypeScript |
| Reactive | RxJS + `takeUntilDestroyed` |
| HTTP | Angular HttpClient + AuthInterceptor |
| Styling | Custom CSS / SCSS (dark theme) |
| Auth | JWT stored in localStorage |
| Charts | Chart.js 4.4 (CDN) |
| Excel Export | SheetJS / XLSX 0.18 (CDN) |
| PDF Export | jsPDF 2.5 + jsPDF-AutoTable 3.8 (CDN) |
| Deployment | Netlify (CI/CD from GitHub main) |

---

## ✨ Pages & Features

### 🔐 Login (`/login`)
- JWT authentication
- Token stored in localStorage
- Auto-redirect to dashboard on valid token
- Employee Portal login (separate PIN-based auth)

---

### 📊 Dashboard (`/dashboard`)
- 9 KPI cards: Employees, Attendance, Shifts, Leave, Payroll, Accounting, SARS Compliance, Analytics, Reports
- Quick navigation to all modules
- Role-aware display (admin badge)

---

### 👥 Employees (`/employees`)
- Paginated employee list with search
- Add / edit / deactivate / restore employees
- Salary update with full history modal
- Employment type, ID number, tax number fields
- Department and position management

---

### 🕐 Attendance (`/attendance`)
- Live clock with real-time display
- Clock in / clock out for current user
- Today's status and summary
- Monthly attendance report with hours and overtime
- Admin override tab for corrections

---

### 📅 Shifts (`/shifts`)
- **Templates tab** — create and manage shift types (Morning / Evening / Night) with pay rates and multipliers
- **Assign Shifts tab** — assign employees to shifts by date
- **Weekly Calendar tab** — visual week view of all assignments
- **Swap Requests tab** — employee shift swap requests with manager approval

---

### 🏖️ Leave (`/leave`)
- **Request tab** — submit leave with date range and reason
- **My Requests tab** — view own request history and status
- **Approvals tab** — manager view of pending requests
- **Balance tab** — current leave balance per type
- **Analytics tab** — leave usage trends

---

### 💰 Payroll (`/payroll`)
- **Overview tab** — monthly KPI summary (gross, net, PAYE, headcount)
- **Records tab** — per-employee payroll records with status filter
- **Processing tab** — initialize period, select employees, process payroll
- **History tab** — past payroll periods
- Month / year selector
- Mark as paid modal with payment method
- **Payslip PDF download**

---

### 🏛️ SARS Compliance (`/sars`)
- **EMP201 tab** — monthly PAYE/SDL/UIF declarations, generate and view
- **UI-19 tab** — monthly UIF submissions with status tracking
- **IRP5 tab** — annual employee tax certificates (IT3(a) reconciliation)

---

### 📊 Accounting (`/accounting`)

#### Chart of Accounts & Journals
- 31-account chart of accounts, searchable by type
- Payroll journal entry generation (standard or hospitality type)
- GL account mappings for payroll-to-accounts linking

#### AR Invoices
- Create guest invoices with line items and VAT
- Record partial and full payments
- Invoice status tracking (draft / issued / partial / paid / overdue)

#### AP (Accounts Payable)
- Manage suppliers with bank details and payment terms
- Create and track supplier bills
- Record bill payments

#### Revenue
- Log daily hotel revenue by department (Rooms, F&B, Conferencing, Spa, Other)
- Monthly revenue summaries

#### Financials
- P&L report with period selection
- VAT return with period close

---

### 📈 AR Ageing (`/ar-ageing`)

**14-bucket ageing with opening balances and running totals.**

#### Summary Cards (top)
- Total Outstanding | Current | 1–30 Days | 31–60 Days | 61–90 Days | 90+ Days
- Each card has a contextual action message (e.g. "Send reminder now", "Escalate to management")

#### Collection Alert Banner
- Auto-detects customers with 90+ days overdue
- One-click **Send Payment Reminders** bulk action

#### Table View
| Column | Description |
|---|---|
| Opening Bal | Brought-forward balance (amber) |
| Current | Not yet due |
| 1–30 | 1–30 days overdue |
| 31–60 | 31–60 days overdue |
| 61–90 | 61–90 days overdue |
| 90–120 ⚠ | Always highlighted red |
| Balance | Running balance = OB + all buckets (purple) |
| Total | Invoice total + opening balance |
| Risk | OK / Medium / High / Critical |
| Action | 🔔 Alert button (visible at 61+ days) |

#### Extended 120–360+ Toggle
- Button **"Show 120–360+ Buckets"** expands 9 additional columns:
  `120–150`, `150–180`, `180–210`, `210–240`, `240–270`, `270–300`, `300–330`, `330–360`, `360+`
- Each cell shows the bucket amount + running balance below it

#### Running Balance Logic
```
Balance = Opening Balance + 360+ + 330–360 + ... + Current
```
Cumulates oldest → newest, matching standard accounting procedure.

#### Charts View
- Bar chart: outstanding by bucket (8 grouped ranges)
- Doughnut chart: risk distribution

#### Export
- **Excel** — full ageing table with all buckets
- **PDF** — formatted ageing report with totals

---

### 📈 AP Ageing (`/ap-ageing`)

Identical feature set to AR Ageing, scoped to suppliers.

- Same 14-bucket model with opening balances
- Same extended 120–360+ toggle
- Same running balance columns
- Alert bells trigger at 61+ days (overdue supplier payments)
- Export to Excel and PDF

---

### 📉 Analytics (`/analytics`)
- **Overview tab** — 6 KPI cards + compliance status
- **Payroll tab** — monthly trends and department breakdown
- **Leave tab** — leave analytics by type and department
- **Attendance tab** — punctuality and hours trends
- **Compliance tab** — SARS submission and payment status
- **HR Insights tab** — headcount, turnover and salary analytics

---

### 📄 Reports (`/reports`)

13 individual report types with Excel and PDF export:

| Category | Reports |
|---|---|
| Full | Full HR Report (all data) |
| Employees | Employee Register, Headcount by Department |
| Payroll | Summary, Detailed Breakdown, Year-to-Date |
| Attendance | Monthly, Date Range, Overtime |
| Leave | Leave Balances, Leave Taken |
| SARS & Tax | EMP201 PAYE, Tax Liability Summary |

- Sidebar navigation by category
- Smart filter panel (year, month, or date range — shown only when relevant)
- Period badge updates dynamically

---

### 👤 Employee Portal
- Employees log in with PIN or password (separate from admin)
- View own payslips, leave balances, attendance summary
- Submit leave requests

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
│   │   │   ├── ar-ageing/        # 14-bucket AR ageing
│   │   │   └── ap-ageing/        # 14-bucket AP ageing
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── portal/
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
git clone https://github.com/Gezino-Linden/employee-frontend
cd employee-frontend
npm install
```

### Environment Config
Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://employee-api-xpno.onrender.com/api',
};
```

### Run locally
```bash
ng serve
# Navigate to http://localhost:4200
```

### Build
```bash
ng build --configuration=production
# Output in dist/
```

---

## 🔒 Auth & Security

- JWT stored in `localStorage`
- `AuthInterceptor` attaches `Authorization: Bearer <token>` to all API requests
- Route guards redirect unauthenticated users to `/login`
- Role-based UI — admin / manager tabs and actions hidden from employees

---

## 🧠 Code Quality

- **Zero memory leaks** — all subscriptions use `takeUntilDestroyed(destroyRef)`
- **Zero hardcoded URLs** — all API calls use `environment.apiUrl`
- **Standalone components** throughout — no NgModule
- All services use typed interfaces for API responses
- SCSS per-component with shared dark theme variables

---

## 🌐 Deployment

Hosted on **Netlify** — auto-deploys from `main` branch.

`netlify.toml` handles SPA routing redirects:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📦 CDN Dependencies (index.html)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
```

---

## 🗺️ Roadmap

- [ ] Drill-down to invoice details from ageing table
- [ ] Ageing trend over time chart
- [ ] Email collection alerts (automated sending)
- [ ] License Settings page (admin plan view + key entry)
- [ ] Shift data for employee portal
- [ ] Ageing report Excel/PDF export includes all 14 buckets

---

## 👤 Author

**Gezino Linden** — [@Gezino-Linden](https://github.com/Gezino-Linden)

---

## 📄 License

Part of the **MaeRoll** full-stack SaaS HR & Accounting system for the hospitality industry.