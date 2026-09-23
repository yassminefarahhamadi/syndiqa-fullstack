export interface Profile {
    id?: string;
    accountId: string;

    salary: number;
    monthlyExpenses: number;

    yearsEmployed: number;

    hasPaymentIncidents: boolean;
    creditHistoryLength: number;

    rentToIncomeRatio?: number | null;
    disposableIncome?: number | null;

    riskScore?: number | null;

    createdAt?: string;
    updatedAt?: string;
}
