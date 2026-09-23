import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8089/api/v1/financial-assistant';

@Injectable({
  providedIn: 'root'
})
export class FinancialAssistantService {
  private http = inject(HttpClient);

  /**
   * Analyze bank statement
   * @param formData FormData containing the bank statement file
   * @returns Observable with bank statement and analysis data
   */
  analyzeBankStatement(formData: FormData): Observable<any> {
    return this.http.post(`${API_BASE_URL}/analyze-bank-statement`, formData);
  }

  /**
   * Ask financial question to the chatbot
   * @param question The financial question
   * @param userId The user ID
   * @returns Observable with chat response
   */
  askFinancialQuestion(question: string, userId: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/chat`, {
      userId,
      question
    });
  }

  /**
   * Analyze smart bill
   * @param formData FormData containing the bill file, userId, and organizationId
   * @returns Observable with bill analysis data
   */
  analyzeSmartBill(formData: FormData): Observable<any> {
    return this.http.post(`${API_BASE_URL}/analyze-smart-bill`, formData);
  }
}
