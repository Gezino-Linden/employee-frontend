import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeatureMap {
  payroll: boolean; leave: boolean; attendance: boolean; hr: boolean;
  shifts: boolean; sars: boolean; basic_accounting: boolean;
  standard_reports: boolean; reports_basic: boolean; reports_all: boolean;
  department_analytics: boolean; labour_dashboards: boolean;
  ap_ageing: boolean; ar_ageing: boolean; cash_flow: boolean;
  collection_alerts: boolean; advanced_reporting: boolean;
  multi_property: boolean; forecasting: boolean; budget_tracking: boolean;
  custom_dashboards: boolean; api_access: boolean; priority_support: boolean;
  dedicated_infra: boolean; custom_integrations: boolean;
  sla_support: boolean; onboarding_team: boolean;
  [key: string]: boolean;
}

export interface LicenseInfo {
  plan_name: string;
  plan_tier: string;
  display_name: string;
  license_key: string;
  license_active: boolean;
  subscription_status: string;
  max_employees: number;
  active_employees: number;
  pepm_rate: string;
  features: FeatureMap;
  feature_map: FeatureMap;
}

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private licenseSubject = new BehaviorSubject<LicenseInfo | null>(null);
  license$ = this.licenseSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadLicense(): Observable<LicenseInfo> {
    const token = localStorage.getItem('token');
    return this.http.get<LicenseInfo>(`${environment.apiUrl}/license/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(tap(license => this.licenseSubject.next(license)));
  }

  hasFeature(feature: string): boolean {
    const license = this.licenseSubject.value;
    if (!license) return false;
    return license.feature_map?.[feature] === true;
  }

  getPlanName(): string {
    return this.licenseSubject.value?.plan_name || 'operations';
  }

  getPlanDisplayName(): string {
    return this.licenseSubject.value?.display_name || 'Operations';
  }

  getUpgradePlan(feature: string): string {
    const intelligenceFeatures = [
      'department_analytics','labour_dashboards','ap_ageing','ar_ageing',
      'cash_flow','collection_alerts','advanced_reporting','reports_all'
    ];
    const performanceFeatures = [
      'multi_property','forecasting','budget_tracking','custom_dashboards',
      'api_access','priority_support'
    ];
    if (intelligenceFeatures.includes(feature)) return 'Intelligence';
    if (performanceFeatures.includes(feature)) return 'Performance';
    return 'Enterprise';
  }

  clearLicense(): void {
    this.licenseSubject.next(null);
  }
}
