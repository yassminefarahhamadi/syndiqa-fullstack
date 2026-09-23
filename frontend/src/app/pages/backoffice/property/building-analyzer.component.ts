import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';

interface BuildingAnalysis {
  buildings: number;
  floors: number;
  apartments_per_floor: number;
  confidence: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-building-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ButtonModule],
  template: `
    <div class="analyzer-wrap">

      <!-- STEP 1: Upload -->
      <div class="upload-zone"
           (dragover)="$event.preventDefault()"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />

        <ng-container *ngIf="!previewUrl">
          <i class="pi pi-image" style="font-size:2.5rem; color:#94a3b8"></i>
          <p>Click or drag a building photo here</p>
        </ng-container>

        <img *ngIf="previewUrl" [src]="previewUrl" class="preview-img" />
      </div>

      <!-- STEP 2: Analyze button -->
      <button *ngIf="selectedFile && !result && !loading"
              class="btn-analyze" (click)="analyze()">
        🔍 Analyze with AI
      </button>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-box">
        <i class="pi pi-spin pi-spinner"></i> AI is analyzing the photo...
      </div>

      <!-- STEP 3: Results (editable) -->
      <div *ngIf="result" class="result-box">

        <div class="confidence" [ngClass]="'conf-'+result.confidence">
          AI Confidence: {{ result.confidence | uppercase }}
        </div>

        <div class="fields-grid">
          <div class="field">
            <label>🏢 Number of Buildings</label>
            <input type="number" [(ngModel)]="result.buildings" min="1" />
          </div>
          <div class="field">
            <label>📐 Floors per Building</label>
            <input type="number" [(ngModel)]="result.floors" min="1" />
          </div>
          <div class="field">
            <label>🚪 Apartments per Floor</label>
            <input type="number" [(ngModel)]="result.apartments_per_floor" min="1" />
          </div>
          <div class="field total">
            <label>🏠 Total Apartments</label>
            <span>{{ result.buildings * result.floors * result.apartments_per_floor }}</span>
          </div>
        </div>

        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;" />

        <div class="residence-form">
          <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Residence Details</h4>
          <div class="field">
            <label>📍 Residence Name</label>
            <input type="text" [(ngModel)]="residenceName" placeholder="Enter name..." />
          </div>
          <div class="field">
            <label>🗺️ Address</label>
            <input type="text" [(ngModel)]="residenceAddress" placeholder="Enter address..." />
          </div>
          <div class="field">
            <label>🏙️ City</label>
            <input type="text" [(ngModel)]="residenceCity" placeholder="Enter city..." />
          </div>
          <div class="field" *ngIf="!authService.isSyndicAdmin()">
            <label>🏢 Organization</label>
            <select [(ngModel)]="organizationId" class="org-select">
              <option *ngIf="organizations.length === 0" value="99">Default Organization (99)</option>
              <option *ngFor="let org of organizations" [value]="org.id">
                {{ org.name }} ({{ org.city }})
              </option>
            </select>
          </div>
          <div class="field" *ngIf="authService.isSyndicAdmin()">
            <label>🏢 Organization</label>
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg font-bold text-primary">
              ID: {{ authService.organizationId() || 'Your Organization' }}
            </div>
          </div>
        </div>

        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;" />

        <div class="residence-form">
          <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Apartment Settings (Default for all)</h4>
          <div class="grid-2">
            <div class="field">
              <label>📏 Default Surface (m²)</label>
              <input type="number" [(ngModel)]="defaultSurface" min="1" />
            </div>
            <div class="field">
              <label>🏠 Apartment Type</label>
              <select [(ngModel)]="defaultType" class="org-select">
                <option value="Studio">Studio</option>
                <option value="S+1">S+1</option>
                <option value="S+2">S+2</option>
                <option value="S+3">S+3</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>
          </div>
        </div>

        <div class="btn-row" style="margin-top: 1.5rem;">
          <button class="btn-confirm" [disabled]="creating" (click)="createResidence()">
            <i class="pi" [ngClass]="creating ? 'pi-spin pi-spinner' : 'pi-check'"></i>
            {{ creating ? 'Creating...' : '✅ Create Residence' }}
          </button>
          <button class="btn-reset" (click)="reset()">🔄 Reset</button>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-box">⚠️ {{ error }}</div>

    </div>
  `,
  styles: [`
    .analyzer-wrap {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 500px;
    }

    /* Upload zone */
    .upload-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: border-color 0.2s;
    }
    .upload-zone:hover { border-color: #6366f1; }
    .upload-zone p { margin: 0; color: #64748b; font-weight: 500; }
    .preview-img {
      max-height: 220px;
      border-radius: 8px;
      object-fit: cover;
      width: 100%;
    }

    /* Buttons */
    .btn-analyze {
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-analyze:hover { background: #4f46e5; }

    /* Loading */
    .loading-box {
      text-align: center;
      color: #6366f1;
      font-weight: 500;
      padding: 1rem;
    }

    /* Results */
    .result-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .confidence {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .conf-high   { background: #dcfce7; color: #166534; }
    .conf-medium { background: #fef9c3; color: #854d0e; }
    .conf-low    { background: #fee2e2; color: #991b1b; }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }
    .field input, .org-select {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 1.1rem;
      font-weight: 700;
      width: 100%;
    }
    .org-select {
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
    }
    .field.total span {
      font-size: 1.6rem;
      font-weight: 800;
      color: #6366f1;
    }

    .btn-row { display: flex; gap: 0.75rem; }
    .btn-confirm {
      background: #22c55e;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
    }
    .btn-reset {
      background: #f1f5f9;
      color: #475569;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .residence-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .btn-confirm:disabled {
      background: #86efac;
      cursor: not-allowed;
    }

    /* Error */
    .error-box {
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 8px;
    }
  `]
})
export class BuildingAnalyzerComponent implements OnInit {
  @Output() confirmed = new EventEmitter<BuildingAnalysis>();
  @Output() residenceCreated = new EventEmitter<BuildingAnalysis>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = false;
  creating = false;
  result: BuildingAnalysis | null = null;
  error: string | null = null;

  // New fields for Residence
  residenceName: string = '';
  residenceAddress: string = '';
  residenceCity: string = '';
  organizationId: string = '99';
  organizations: any[] = [];

  // Apartment defaults
  defaultSurface: number = 80;
  defaultType: string = 'S+1';

  public authService = inject(AuthService);

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    if (this.authService.isSyndicAdmin()) {
      this.organizationId = this.authService.organizationId() || '99';
    } else {
      this.fetchOrganizations();
    }
  }

  fetchOrganizations() {
    // Try standard API first
    this.http.get<any[]>('http://localhost:8089/api/organizations').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.organizations = data;
          this.organizationId = this.organizations[0].id;
        } else {
          // If empty, try admin endpoint as fallback
          this.fetchFromAdminFallback();
        }
      },
      error: (err) => {
        console.warn('API organizations failed, trying admin fallback...', err);
        this.fetchFromAdminFallback();
      }
    });
  }

  fetchFromAdminFallback() {
    this.http.get<any[]>('http://localhost:8089/admin/organizations').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.organizations = data;
          this.organizationId = this.organizations[0].id;
        } else {
          this.fetchFromV1Fallback();
        }
      },
      error: () => this.fetchFromV1Fallback()
    });
  }

  fetchFromV1Fallback() {
    this.http.get<any[]>('http://localhost:8089/api/v1/organizations').subscribe({
      next: (data) => {
        this.organizations = data || [];
        if (this.organizations.length > 0) {
          this.organizationId = this.organizations[0].id;
        } else {
          this.organizationId = '99';
        }
      },
      error: (err) => {
        console.error('All organization endpoints failed (API, Admin, V1):', err);
        this.organizationId = '99';
      }
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.loadFile(file);
  }

  loadFile(file: File) {
    this.selectedFile = file;
    this.result = null;
    this.error = null;
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  analyze() {
    if (!this.selectedFile || !this.previewUrl) return;
    this.loading = true;
    this.error = null;

    console.log('Sending request to http://localhost:8089/api/buildings/analyze');

    this.http.post<{ result: string }>('http://localhost:8089/api/buildings/analyze', {
      image: this.previewUrl,
      mimeType: this.selectedFile.type
    }).subscribe({
      next: (res) => {
        console.log('Backend response:', res);
        try {
          // Clean up markdown fences if Gemini wraps in ```json
          const clean = res.result.replace(/```json|```/g, '').trim();
          this.result = JSON.parse(clean);
          console.log('Parsed result:', this.result);
        } catch (e) {
          console.error('Parse error:', e);
          this.error = 'AI returned an unexpected format. Please try again.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Full backend error:', err);
        console.error('Status:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('Message:', err.message);
        console.error('URL:', err.url);
        const backendMessage = err.error?.message || err.statusText || err.message;
        this.error = `Backend Error (${err.status}): ${backendMessage}`;
        this.loading = false;
      }
    });
  }

  confirm() {
    if (this.result) this.confirmed.emit(this.result);
  }

  createResidence() {
    if (!this.result || !this.residenceName || !this.residenceAddress || !this.residenceCity) {
      this.error = 'Please fill in all residence details (Name, Address, City).';
      return;
    }

    this.creating = true;
    this.error = null;

    // Build the BulkResidenceDTO structure
    const bulkData = {
      name: this.residenceName,
      address: this.residenceAddress,
      city: this.residenceCity,
      organizationId: this.organizationId,
      buildings: [] as any[]
    };

    // Create buildings based on AI result
    for (let i = 1; i <= this.result.buildings; i++) {
      const building = {
        name: `Building ${i}`,
        floorsCount: this.result.floors,
        parkingSpotsCount: 5, // Default
        apartments: [] as any[]
      };

      // Create apartments for each floor
      for (let f = 1; f <= this.result.floors; f++) {
        for (let a = 1; a <= this.result.apartments_per_floor; a++) {
          building.apartments.push({
            floor: f,
            unitNumber: `${String.fromCharCode(64 + i)}${f}${a < 10 ? '0' + a : a}`,
            surfaceM2: this.defaultSurface,
            type: this.defaultType,
            status: 'AVAILABLE'
          });
        }
      }
      bulkData.buildings.push(building);
    }

    console.log('Sending bulk creation request:', bulkData);

    this.http.post('http://localhost:8089/api/residences/bulk', bulkData)
      .subscribe({
        next: (res) => {
          console.log('Bulk creation success:', res);
          alert('Residence and its buildings/apartments created successfully!');
          this.creating = false;
          this.router.navigate(['/pages/backoffice/property/residences']);
        },
        error: (err) => {
          console.error('Bulk creation error:', err);
          this.error = `Creation Failed: ${err.error?.message || err.message}`;
          this.creating = false;
        }
      });
  }

  reset() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.result = null;
    this.error = null;
  }
}
