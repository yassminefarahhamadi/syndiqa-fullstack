export type InspectionType = 'INITIAL' | 'FINAL' | 'ROUTINE' | 'DAMAGE_REPORT';

export type InspectionCondition = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'DAMAGED' | 'MISSING';

export type ItemCategory = 'ELECTROMENAGER' | 'MOBILIER' | 'EQUIPEMENT' | 'SANITAIRE' | 'MENUISERIE' | 'AUTRE';

export type LeaseInspectionStatus = 'COMPLETED' | 'PENDING' | 'DISPUTED';

export interface InspectionItem {
    id?: string;
    itemName: string;
    category?: ItemCategory;
    condition: InspectionCondition;
    notes?: string;
    photosUrls: string[];
    estimatedRepairCost?: number;
    aiAnalyzed?: boolean;
}

export interface LeaseInspection {
    id?: string;
    leaseId: string;
    apartmentId: string;
    organizationId: string;
    inspectionType: InspectionType;
    inspectorAccountId?: string;
    tenantAccountId?: string;
    managerAccountId?: string;
    inspectionDate: string;
    condition: InspectionCondition;
    items: InspectionItem[];
    overallCondition?: string;
    damagesFound: string[];
    costsEstimated?: number;
    photosUrls: string[];
    reportUrl?: string;
    signedBy?: string;
    status: LeaseInspectionStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ItemComparison {
    itemName: string;
    initialCondition: InspectionCondition;
    finalCondition: InspectionCondition;
    degraded: boolean;
    missing: boolean;
    degradationGap: number;
    estimatedDeduction: number;
}

export interface InspectionComparison {
    leaseId: string;
    initialInspectionId: string;
    finalInspectionId: string;
    itemComparisons: ItemComparison[];
    degradationScore: number;
    totalEstimatedDeduction: number;
    totalItems: number;
    degradedItems: number;
    missingItems: number;
}
