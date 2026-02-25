// File: src/app/services/employees.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  is_active: boolean;
  created_at: string;
  company_id: number;
};

export type EmployeesApiResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Employee[];
};

export type CreateEmployeeDto = {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
};

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private baseUrl = 'https://employee-api-xpno.onrender.com/api';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 10) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<EmployeesApiResponse>(`${this.baseUrl}/employees`, { params });
  }

  getById(id: number) {
    return this.http.get<Employee>(`${this.baseUrl}/employees/${id}`);
  }

  create(data: CreateEmployeeDto) {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, data);
  }

  update(id: number, data: Partial<CreateEmployeeDto>) {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/employees/${id}`);
  }

  restore(id: number) {
    return this.http.patch<Employee>(`${this.baseUrl}/employees/${id}/restore`, {});
  }

  updateSalary(id: number, salary: number) {
    return this.http.patch<Employee>(`${this.baseUrl}/employees/${id}/salary`, { salary });
  }
}
