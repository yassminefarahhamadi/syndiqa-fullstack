/**
 * Expense Categories Configuration
 * Centralized definition of all expense categories used across the application
 */

export interface ExpenseCategory {
    value: string;
    label: string;
    icon: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
    description?: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    {
        value: 'ELEVATOR',
        label: 'Elevator',
        icon: 'pi pi-arrow-up-down',
        severity: 'warn',
        description: 'Elevator maintenance and repairs'
    },
    {
        value: 'MAINTENANCE',
        label: 'Maintenance',
        icon: 'pi pi-wrench',
        severity: 'warn',
        description: 'General building maintenance'
    },
    {
        value: 'PLUMBING',
        label: 'Plumbing',
        icon: 'pi pi-droplet',
        severity: 'info',
        description: 'Plumbing repairs and maintenance'
    },
    {
        value: 'ELECTRICAL',
        label: 'Electrical',
        icon: 'pi pi-bolt',
        severity: 'warn',
        description: 'Electrical work and repairs'
    },
    {
        value: 'UTILITIES',
        label: 'Utilities',
        icon: 'pi pi-bolt',
        severity: 'info',
        description: 'Utility bills and services'
    },
    {
        value: 'CLEANING',
        label: 'Cleaning',
        icon: 'pi pi-sparkles',
        severity: 'success',
        description: 'Cleaning services'
    },
    {
        value: 'SECURITY',
        label: 'Security',
        icon: 'pi pi-shield',
        severity: 'danger',
        description: 'Security services and equipment'
    },
    {
        value: 'INSURANCE',
        label: 'Insurance',
        icon: 'pi pi-file-check',
        severity: 'info',
        description: 'Insurance premiums'
    },
    {
        value: 'GREEN_SPACES',
        label: 'Green Spaces',
        icon: 'pi pi-leaf',
        severity: 'success',
        description: 'Garden and green space maintenance'
    },
    {
        value: 'ADMINISTRATIVE',
        label: 'Administrative',
        icon: 'pi pi-briefcase',
        severity: 'secondary',
        description: 'Administrative costs'
    },
    {
        value: 'STEG',
        label: 'STEG (Electricity)',
        icon: 'pi pi-bolt',
        severity: 'warn',
        description: 'STEG electricity bills'
    },
    {
        value: 'SONEDE',
        label: 'SONEDE (Water)',
        icon: 'pi pi-droplet',
        severity: 'info',
        description: 'SONEDE water bills'
    },
    {
        value: 'OTHER',
        label: 'Other',
        icon: 'pi pi-ellipsis-h',
        severity: 'secondary',
        description: 'Other miscellaneous expenses'
    }
];

/**
 * Helper functions for expense categories
 */
export class ExpenseCategoryHelper {
    
    /**
     * Get all category values
     */
    static getCategories(): string[] {
        return EXPENSE_CATEGORIES.map(cat => cat.value);
    }
    
    /**
     * Get category label by value
     */
    static getCategoryLabel(value: string): string {
        const category = EXPENSE_CATEGORIES.find(cat => cat.value === value);
        return category?.label || value;
    }
    
    /**
     * Get category icon by value
     */
    static getCategoryIcon(value: string): string {
        const category = EXPENSE_CATEGORIES.find(cat => cat.value === value);
        return category?.icon || 'pi pi-circle';
    }
    
    /**
     * Get category severity by value
     */
    static getCategorySeverity(value: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const category = EXPENSE_CATEGORIES.find(cat => cat.value === value);
        return category?.severity || 'secondary';
    }
    
    /**
     * Get category description by value
     */
    static getCategoryDescription(value: string): string {
        const category = EXPENSE_CATEGORIES.find(cat => cat.value === value);
        return category?.description || '';
    }
    
    /**
     * Get full category object by value
     */
    static getCategory(value: string): ExpenseCategory | undefined {
        return EXPENSE_CATEGORIES.find(cat => cat.value === value);
    }
    
    /**
     * Get categories for dropdown
     */
    static getCategoriesForDropdown(): { label: string; value: string }[] {
        return EXPENSE_CATEGORIES.map(cat => ({
            label: cat.label,
            value: cat.value
        }));
    }
}
