import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LicenseService } from '../services/license.service';
import { map, catchError, of } from 'rxjs';

export function featureGuard(feature: string): CanActivateFn {
  return () => {
    const licenseService = inject(LicenseService);
    const router = inject(Router);

    // If already loaded, check immediately
    if (licenseService.hasFeature(feature)) return true;

    // Otherwise load then check
    return licenseService.loadLicense().pipe(
      map(license => {
        const hasAccess = license.feature_map?.[feature] === true;
        if (!hasAccess) {
          router.navigate(['/upgrade'], {
            queryParams: {
              feature,
              required_plan: licenseService.getUpgradePlan(feature),
              current_plan: license.plan_name
            }
          });
          return false;
        }
        return true;
      }),
      catchError(() => {
        router.navigateByUrl('/dashboard');
        return of(false);
      })
    );
  };
}
