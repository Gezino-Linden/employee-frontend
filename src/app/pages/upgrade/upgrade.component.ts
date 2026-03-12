import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;">
      <div style="background:white;border-radius:16px;padding:48px;max-width:480px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="font-size:48px;margin-bottom:16px;"></div>
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px;">Feature Locked</h1>
        <p style="color:#64748b;margin-bottom:8px;">
          <strong style="color:#f59e0b;text-transform:capitalize;">{{ currentPlan }}</strong> plan does not include
          <strong style="color:#1e293b;">{{ featureName }}</strong>.
        </p>
        <p style="color:#64748b;margin-bottom:32px;">
          Upgrade to <strong style="color:#6366f1;">{{ requiredPlan }}</strong> to unlock this feature.
        </p>

        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:32px;text-align:left;">
          <p style="font-weight:600;color:#1e293b;margin-bottom:12px;">{{ requiredPlan }} includes:</p>
          <div *ngFor="let f of planFeatures" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="color:#10b981;"></span>
            <span style="color:#475569;font-size:14px;">{{ f }}</span>
          </div>
        </div>

        <button (click)="goBack()"
          style="width:100%;padding:14px;background:#6366f1;color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:12px;">
          Contact Nexorum Tech to Upgrade
        </button>
        <button (click)="goBack()"
          style="width:100%;padding:14px;background:transparent;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;cursor:pointer;">
          ← Go Back
        </button>
      </div>
    </div>
  `
})
export class UpgradeComponent implements OnInit {
  feature = '';
  featureName = '';
  currentPlan = '';
  requiredPlan = '';
  planFeatures: string[] = [];

  private featureLabels: Record<string, string> = {
    ar_ageing: 'AR Ageing Report',
    ap_ageing: 'AP Ageing Report',
    department_analytics: 'Department Analytics',
    labour_dashboards: 'Labour Cost Insights',
    cash_flow: 'Cash Flow Summary',
    collection_alerts: 'Collection Alerts',
    advanced_reporting: 'Advanced Reporting',
    multi_property: 'Multi-Property Analytics',
    forecasting: 'Advanced Forecasting',
    budget_tracking: 'Budget vs Labour Tracking',
    api_access: 'API Access',
  };

  private planFeaturesMap: Record<string, string[]> = {
    Intelligence: [
      'Department analytics dashboard',
      'Labour cost insights',
      'AR/AP ageing reports',
      'Cash flow summary',
      'Collection alerts',
      'Advanced reporting',
    ],
    Performance: [
      'Everything in Intelligence',
      'Multi-property analytics',
      'Advanced forecasting',
      'Budget vs labour tracking',
      'Custom dashboards',
      'API access',
    ],
    Enterprise: [
      'Everything in Performance',
      'Dedicated infrastructure',
      'Dedicated account manager',
      'Custom feature development',
      '24/7 phone support',
    ],
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.feature = params['feature'] || '';
      this.currentPlan = params['current_plan'] || 'operations';
      this.requiredPlan = params['required_plan'] || 'Intelligence';
      this.featureName = this.featureLabels[this.feature] || this.feature;
      this.planFeatures = this.planFeaturesMap[this.requiredPlan] || [];
    });
  }

  goBack() { this.router.navigateByUrl('/dashboard'); }
}
