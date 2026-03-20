# MaeRoll — HR & Accounting Frontend (Angular 21)

> **Full-stack SaaS HR, Payroll & Accounting frontend** for the hospitality industry.
> Built with Angular 21 standalone components. Deployed on Cloudflare Pages.

---

## 🔗 Links

|                  |                                                              |
| ---------------- | ------------------------------------------------------------ |
| **Live App**     | https://employee-frontend-dyl.pages.dev                      |
| **Backend Repo** | https://github.com/Gezino-Linden/employee-api                |
| **Live API**     | https://employee-api-xpno.onrender.com                       |

---

## 🛠 Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Framework   | Angular 21 (standalone components)                |
| Language    | TypeScript                                        |
| Reactive    | RxJS + `takeUntilDestroyed`                       |
| HTTP        | Angular HttpClient + Auth/Error Interceptors      |
| Styling     | Custom CSS (dark theme)                           |
| Auth        | JWT (localStorage) + Refresh Token auto-rotation  |
| Charts      | Chart.js 4.4 (CDN)                                |
| Excel Export| SheetJS / XLSX 0.18 (CDN)                         |
| PDF Export  | jsPDF 2.5 + jsPDF-AutoTable 3.8 (CDN)             |
| Deployment  | Cloudflare Pages (Wrangler CLI)                   |
| CI/CD       | GitHub Actions (build check on every push)        |

---

## ✨ Pages & Features

### 🔐 Login (`/login`)
- JWT authentication with refresh token support
- Auto-redirect to dashboard on valid token
- Employee Portal login (separate PIN-based auth)
- Session auto-renews silently — no unexpected logouts

---

### 📊 Dashboard (`/dashboard`)
- 9 KPI cards: Employees, Attendance, Shifts, Leave, Payroll, Accounting, SARS, Analytics, Reports
- Quick navigation to all modules
- Role-aware display

---

### 👥 Employees (`/employees`)
- Paginated employee list with search
- Add / edit / deactivate / restore employees
- Salary update with full history modal
- Soft delete with audit trail
- Department and position management

---

### 🕐 Attendance (`/attendance`)
- Live clock with real-time display
- Clock in / clock out
- Monthly attendance report with hours and overtime
- Admin override tab for corrections

---

### 📅 Shifts (`/shifts`)
- **Templates tab** — create shift types with pay rates and multipliers
- **Assign Shifts tab** — assign employees to shifts by date
- **Weekly Calendar tab** — visual week view
- **Swap Requests tab** — employee swap requests with manager approval

---

### 🏖️ Leave (`/leave`)
- **Request tab** — submit leave with date range and reason
- **My Requests tab** — view own request history
- **Approvals tab** — manager view of pending requests
- **Balance tab** — current leave balance per type
- **Analytics tab** — leave usage trends

---

### 💰 Payroll (`/payroll`)
- **Overview tab** — monthly KPI summary
- **Records tab** — per-employee records with status filter
- **Processing tab** — initialize period, process payroll
- **History tab** — past payroll periods
- Mark as paid with payment method
- **Payslip PDF download**
- Pay All Processed button with sequential processing

---

### 🏛️ SARS Compliance (`/sars`)
- **EMP201 tab** — monthly PAYE/SDL/UIF declarations
- **UI-19 tab** — monthly UIF submissions
- **IRP5 tab** — annual employee tax certificates

---

### 📊 Accounting (`/accounting`)
- Chart of accounts (31 accounts), journals, GL mappings
- AR invoices with line items, VAT, payment recording
- AP suppliers, bills, payment tracking
- Daily revenue by department
- P&L report, VAT return

---

### 📈 AR Ageing (`/ar-ageing`)
- 14-bucket ageing with opening balances and running totals
- Collection alert banner for 90+ day overdue customers
- Expandable 120—360+ bucket columns
- Risk scoring (OK / Medium / High / Critical)
- Export to Excel and PDF

---

### 📈 AP Ageing (`/ap-ageing`)
- Identical feature set to AR Ageing, scoped to suppliers

---

### 📉 Analytics (`/analytics`)
- **Overview** — 6 KPI cards + compliance status
- **Payroll** — monthly trends and department breakdown
- **Leave** — analytics by type and department
- **Attendance** — punctuality and hours trends
- **Compliance** — SARS submission status
- **HR Insights** — headcount, turnover, salary analytics
- **Tips** — monthly tip pool breakdown by recipient

---

### 📄 Reports (`/reports`)
13 report types with Excel and PDF export across HR, payroll, attendance, leave, and SARS categories.

---

### 👤 Employee Portal (`/employee-portal`)
- Employees log in with PIN or password
- View own payslips, leave balances, attendance
- Submit leave requests

---

## 🔐 Auth & Security

- JWT access tokens (8h) stored in `localStorage`
- Refresh tokens (30 days) — auto-renew on 401 with silent retry
- `AuthInterceptor` attaches `Authorization: Bearer <token>` to all requests
- `ErrorInterceptor` retries failed GET requests up to 3 times (handles Render cold starts)
- Route guards redirect unauthenticated users to `/login`
- Role-based UI — admin/manager actions hidden from employees

---

## 🗺️ Project Structure
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
│   │   │   ├── ar-ageing/
│   │   │   └── ap-ageing/
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── employee-portal/
│   ├── services/
│   │   ├── auth.service.ts         # Login, refresh token, logout
│   │   ├── employees.service.ts
│   │   ├── payroll.service.ts
│   │   ├── analytics.service.ts
│   │   └── accounting.service.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts     # Attaches JWT to requests
│   │   └── error.interceptor.ts    # 401 refresh, retry logic
│   └── guards/
│       └── auth-guard.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Angular CLI 21+

### Installation
```bash
git clone https://github.com/Gezino-Linden/employee-frontend
cd employee-frontend
npm install
```

### Run locally
```bash
ng serve
# Navigate to http://localhost:4200
```

### Build & Deploy
```bash
ng build --configuration=production
wrangler pages deploy dist/employee-saas-frontend/browser --project-name employee-frontend
```

---

## 🌐 Deployment

Hosted on **Cloudflare Pages**. Deploy manually via Wrangler CLI or push to `main` to trigger GitHub Actions build check.
```
_redirects file handles Angular SPA routing:
/* /index.html 200
```

---

## 🗺️ Roadmap

- [ ] Jest test suite for auth and payroll flows
- [ ] Drill-down to invoice details from ageing table
- [ ] Email collection alerts (automated sending)
- [ ] Shift data in employee portal
- [ ] NgRx state management for large datasets
- [ ] PWA support for offline capability

---

## 👤 Author

**Gezino Linden** — [@Gezino-Linden](https://github.com/Gezino-Linden)

---

## 📄 License

Part of the **MaeRoll** full-stack SaaS HR & Accounting system for the hospitality industry.
