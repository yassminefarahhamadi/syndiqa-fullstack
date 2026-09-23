export interface Residence {
    id: string;
    name: string;
    address: string;
    city: string;
}

export interface Building {
    id: string;
    organizationId: string;
    residenceId?: string;
    name: string;
    numberOfFloors?: number;
    floorsCount?: number;
    totalApartments?: number;
    parkingSpotsCount?: number;
    createdAt?: string;
}

export interface Apartment {
    id: string;
    buildingId: string;
    organizationId: string;
    apartmentNumber?: string;
    unitNumber?: string;
    floorNumber?: number;
    floor?: number;
    surfaceM2: number;
    type?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Payment {
    id: string;
    organizationId: string;
    chargeId: string;
    userId: string;
    amount: number;
    paymentDate: string;
    method: string;
    createdAt: string;
}

export interface WalletTransaction {
    id: string;
    type: 'TOP_UP' | 'CHARGE_PAYMENT' | 'REFUND';
    amount: number;
    balanceAfter: number;
    description: string;
    referenceId?: string;
    timestamp: string;
}

export interface Wallet {
    id: string;
    userId: string;
    organizationId: string;
    balance: number;
    transactions: WalletTransaction[];
    createdAt: string;
    updatedAt: string;
}

export interface ResidentProfile {
    id: string;
    accountId: string;
    organizationId: string;
    apartmentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    moveInDate?: string;
    leaseEndDate?: string;
}

export interface FinancialSummary {
    totalRevenue: number;
    totalExpenses: number;
    totalPending: number;
    totalOverdue: number;
    collectionRate: number;
}

export interface BuildingFinancialData {
    building: Building;
    summary: FinancialSummary;
    apartments: ApartmentFinancialData[];
}

export interface ApartmentFinancialData {
    apartment: Apartment;
    residents: ResidentProfile[];
    charges: any[];
    payments: Payment[];
    totalDue: number;
    totalPaid: number;
}
