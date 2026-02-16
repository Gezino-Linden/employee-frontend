# Employee SaaS Dashboard

Angular-based dashboard for employee management with role-based access control.

## 🔗 Related Projects

- **Backend API**: [employee-api](https://github.com/Gezino-Linden/employee-api)
- **Live API**: https://employee-api-xpno.onrender.com

## 🛠️ Tech Stack

- Angular 18
- TypeScript
- RxJS
- Tailwind CSS / Custom Styling

## ✨ Features

- JWT Authentication
- Role-based authorization (Admin/Manager)
- Employee listing with pagination
- Search and filter employees
- Responsive design
- Real-time data from deployed API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
# Update src/environments/environment.ts with your API URL

# Start development server
ng serve
```

Navigate to `http://localhost:4200/`

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── login/
│   │   └── dashboard/
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── employees.service.ts
│   └── interceptors/
│       └── auth.interceptor.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

## 🔧 Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://employee-api-xpno.onrender.com/api',
};
```

## 📦 Building

```bash
# Development build
ng build

# Production build
ng build --configuration=production
```

Build artifacts will be stored in the `dist/` directory.

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e
```

## 📝 Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev)

## 👤 Author

**Gezino Linden**

- GitHub: [@Gezino-Linden](https://github.com/Gezino-Linden)

## 📄 License

This project is part of a full-stack employee management system.
