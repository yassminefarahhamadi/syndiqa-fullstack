import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
    
    /**
     * Generate dynamic billing periods for the current year and next year
     * @param yearsAhead Number of years to generate (default: 2)
     * @returns Array of period strings
     */
    generateBillingPeriods(yearsAhead: number = 2): string[] {
        const periods: string[] = [];
        const currentYear = new Date().getFullYear();
        
        // Generate periods for current year and future years
        for (let yearOffset = 0; yearOffset < yearsAhead; yearOffset++) {
            const year = currentYear + yearOffset;
            
            // Monthly periods
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            months.forEach(month => {
                periods.push(`${month} ${year}`);
            });
            
            // Quarterly periods
            periods.push(`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`);
            
            // Annual period
            periods.push(`Annual ${year}`);
        }
        
        return periods;
    }
    
    /**
     * Get the current month period (e.g., "April 2026")
     */
    getCurrentMonthPeriod(): string {
        const now = new Date();
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    /**
     * Get the current quarter period (e.g., "Q2 2026")
     */
    getCurrentQuarterPeriod(): string {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
    }
    
    /**
     * Get the current year period (e.g., "Annual 2026")
     */
    getCurrentYearPeriod(): string {
        return `Annual ${new Date().getFullYear()}`;
    }
    
    /**
     * Parse a period string to get the date range
     * @param period Period string (e.g., "April 2026", "Q2 2026", "Annual 2026")
     * @returns Object with start and end dates
     */
    parsePeriod(period: string): { start: Date; end: Date } | null {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Monthly period (e.g., "April 2026")
        const monthMatch = period.match(/^(\w+) (\d{4})$/);
        if (monthMatch) {
            const [, monthName, yearStr] = monthMatch;
            const monthIndex = months.indexOf(monthName);
            const year = parseInt(yearStr);
            
            if (monthIndex !== -1) {
                const start = new Date(year, monthIndex, 1);
                const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);
                return { start, end };
            }
        }
        
        // Quarterly period (e.g., "Q2 2026")
        const quarterMatch = period.match(/^Q(\d) (\d{4})$/);
        if (quarterMatch) {
            const [, quarterStr, yearStr] = quarterMatch;
            const quarter = parseInt(quarterStr);
            const year = parseInt(yearStr);
            
            const startMonth = (quarter - 1) * 3;
            const start = new Date(year, startMonth, 1);
            const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
            return { start, end };
        }
        
        // Annual period (e.g., "Annual 2026")
        const annualMatch = period.match(/^Annual (\d{4})$/);
        if (annualMatch) {
            const [, yearStr] = annualMatch;
            const year = parseInt(yearStr);
            
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31, 23, 59, 59);
            return { start, end };
        }
        
        return null;
    }
}
