

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BuildingAnalyzerComponent } from './building-analyzer.component';
import { BuildingService } from './building-complete';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';

export interface Residence {
  id?: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  organizationId?: string;
}


@Injectable({ providedIn: 'root' })
export class ResidenceService {
  private apiUrl = 'http://localhost:8089/api/residences';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Residence[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<Residence[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<Residence[]>(this.apiUrl);
  }

  /**
   * Get residences by organization ID
   */
  getByOrganization(organizationId: string): Observable<Residence[]> {
    return this.http.get<Residence[]>(`${this.apiUrl}/organization/${organizationId}`);
  }

  /**
   * Get residence by ID
   */
  getById(id: string): Observable<Residence> {
    return this.http.get<Residence>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new residence
   */
  create(residence: Residence): Observable<Residence> {
    return this.http.post<Residence>(this.apiUrl, residence);
  }

  /**
   * Update existing residence
   */
  update(id: string, residence: Residence): Observable<Residence> {
    return this.http.put<Residence>(`${this.apiUrl}/${id}`, residence);
  }

  /**
   * Delete residence
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: RESIDENCE FORM
 * ============================================================================
 * Used for creating and editing residences
 */
@Component({
  selector: 'app-residence-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, CardModule, TagModule, TooltipModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
          <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
          {{ isEditMode ? 'Edit' : 'Add New' }} Residence
        </h3>
        <p class="text-primary-100 mt-2 m-0 opacity-80">Define the property location and basic information</p>
      </div>

      <div class="p-6">
        <!-- Search Section -->
        <div class="mb-8 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
          <div class="flex items-center gap-2 mb-4 text-primary-700 dark:text-primary-300">
            <i class="pi pi-search font-bold"></i>
            <h4 class="text-lg font-bold m-0">Quick Location Search</h4>
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <span class="relative w-full">
                <i class="pi pi-map-marker absolute top-1/2 -translate-y-1/2 left-3 text-surface-400"></i>
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="searchQuery" 
                  placeholder="Type an address in Tunisia..." 
                  (keyup.enter)="searchAddress()"
                  class="w-full pl-10 p-3"
                  [disabled]="isLoadingAddress" />
              </span>
            </div>
            <p-button 
                [label]="isLoadingAddress ? 'Searching...' : 'Search'" 
                [icon]="isLoadingAddress ? 'pi pi-spin pi-spinner' : 'pi pi-search'"
                [disabled]="isLoadingAddress" 
                (onClick)="searchAddress()" />
          </div>
          <p class="text-xs text-surface-500 mt-3 italic">Tip: You can also click directly on the map below to set the location.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left Column: Map -->
          <div class="lg:col-span-7">
            <div class="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-sm h-full flex flex-col min-h-[400px]">
              <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <span class="text-sm font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                  <i class="pi pi-map"></i> Interactive Map Selection
                </span>
                <span class="text-xs text-primary-600 font-medium" *ngIf="isLoadingAddress">
                   <i class="pi pi-spin pi-spinner mr-1"></i>Updating...
                </span>
              </div>
              <div id="residence-map" #residenceMap class="w-full flex-1 z-0 min-h-[400px]"></div>
            </div>
          </div>

          <!-- Right Column: Form Details -->
          <div class="lg:col-span-5 flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Property Name</label>
              <input pInputText [(ngModel)]="form.name" placeholder="e.g., Downtown Plaza, Sunset Towers" class="w-full p-3 shadow-sm" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest flex justify-between">
                Street Address
                <p-tag *ngIf="form.address && !isLoadingAddress" value="Detected" severity="info" [rounded]="true" styleClass="text-[9px] px-2" />
              </label>
              <input pInputText [(ngModel)]="form.address" placeholder="e.g., 123 Main Street" [readonly]="isLoadingAddress" class="w-full p-3 shadow-sm" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">City</label>
              <input pInputText [(ngModel)]="form.city" placeholder="e.g., Tunis, Sousse" [readonly]="isLoadingAddress" class="w-full p-3 shadow-sm" />
            </div>

            <!-- Coordinates Section -->
            <div class="mt-4 p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
               <h4 class="text-sm font-bold mb-4 flex items-center gap-2 text-surface-900 dark:text-surface-0">
                  <i class="pi pi-compass text-primary-500"></i>
                  Geographic Coordinates
               </h4>
               <div class="grid grid-cols-2 gap-4 mb-5">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Latitude</label>
                    <p-inputNumber [(ngModel)]="form.latitude" [minFractionDigits]="4" [maxFractionDigits]="8" [showButtons]="false" styleClass="w-full" inputStyleClass="w-full text-sm p-2.5 bg-white dark:bg-surface-900" (onBlur)="onCoordinatesChanged()" />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Longitude</label>
                    <p-inputNumber [(ngModel)]="form.longitude" [minFractionDigits]="4" [maxFractionDigits]="8" [showButtons]="false" styleClass="w-full" inputStyleClass="w-full text-sm p-2.5 bg-white dark:bg-surface-900" (onBlur)="onCoordinatesChanged()" />
                  </div>
               </div>
               
               <p-button 
                  [label]="isVerifying ? 'Verifying...' : 'Verify Address'" 
                  [icon]="isVerifying ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
                  severity="secondary" 
                  [outlined]="true"
                  styleClass="w-full text-sm font-bold py-2"
                  [disabled]="!form.latitude || !form.longitude || isVerifying"
                  (onClick)="verifyCoordinates()" />
                  
               <div *ngIf="verifiedAddress" class="mt-3 p-2.5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg text-[11px] text-green-700 dark:text-green-400 flex gap-2">
                  <i class="pi pi-check-circle mt-0.5"></i>
                  <span>{{ verifiedAddress }}</span>
               </div>

               <div *ngIf="verificationError" class="mt-3 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg text-[11px] text-red-700 dark:text-red-400 flex gap-2">
                  <i class="pi pi-exclamation-circle mt-0.5"></i>
                  <span>{{ verificationError }}</span>
               </div>
            </div>

            <!-- City Presets -->
            <div class="mt-auto">
               <div class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Tunisia Major Cities</div>
               <div class="flex flex-wrap gap-1.5">
                  <p-button *ngFor="let city of cityPresets" [label]="city.name" [text]="true" size="small" styleClass="text-[11px] py-1 px-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-surface-600 dark:text-surface-400" (onClick)="setCoordinates(city.lat, city.lng, city.name)" />
               </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex flex-col sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Residence' : 'Create Residence'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="primary" styleClass="px-8 shadow-lg shadow-primary-500/20" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class ResidenceFormComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() residence: Residence | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('residenceMap') mapElement!: ElementRef;

  form: Residence = { name: '', address: '', city: '' };
  isEditMode = false;
  searchQuery: string = '';
  isLoadingAddress = false;
  isVerifying = false;
  verifiedAddress: string = '';
  verificationError: string = '';

  cityPresets = [
    { name: 'Tunis', lat: 36.8065, lng: 10.1963 },
    { name: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
    { name: 'Bizerte', lat: 37.2746, lng: 9.8739 },
    { name: 'Monastir', lat: 35.7780, lng: 10.8262 },
    { name: 'Gabès', lat: 33.8881, lng: 10.0975 }
  ];
  
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor(
    private residenceService: ResidenceService,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    // Delay initialization to ensure DOM is fully ready
    setTimeout(() => this.initializeMap(), 100);
  }

  ngOnDestroy(): void {
    // Clean up map resources on component destroy
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  ngOnChanges(): void {
    if (this.residence) {
      this.form = { ...this.residence };
      this.isEditMode = true;
    } else {
      this.form = { name: '', address: '', city: '' };
      this.isEditMode = false;
      this.searchQuery = '';
    }
  }

  /**
   * Initialize Leaflet map
   */
  private initializeMap(): void {
    if (this.map) return; // Already initialized

    // Center map on Tunisia with proper zoom
    this.map = L.map('residence-map').setView([36.8065, 10.1963], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Handle map clicks
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.placeMarker(event.latlng.lat, event.latlng.lng);
    });

    // If in edit mode and has coordinates, place marker
    if (this.form.latitude && this.form.longitude) {
       this.placeMarker(this.form.latitude, this.form.longitude);
    }
  }

  /**
   * Place marker on map and reverse geocode
   */
  private placeMarker(lat: number, lng: number): void {
    // Remove existing marker
    if (this.marker) {
      this.map?.removeLayer(this.marker);
    }

    // Add new marker with default Leaflet icon
    this.marker = L.marker([lat, lng]).addTo(this.map!);
    this.marker.bindPopup(`<strong>Residence Location</strong><br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}`).openPopup();

    // Center map on marker
    this.map?.setView([lat, lng], 15);

    // Update form coordinates
    this.form.latitude = lat;
    this.form.longitude = lng;

    // Reverse geocode to get address if not already loading
    if (!this.isLoadingAddress) {
       this.reverseGeocode(lat, lng);
    }
  }

  /**
   * Search for an address using Nominatim API and populate form fields
   */
  searchAddress(): void {
    if (!this.searchQuery.trim()) {
      alert('Please enter an address to search');
      return;
    }

    this.isLoadingAddress = true;
    
    // Add Tunisia to search query if not already present
    const searchQuery = this.searchQuery.includes('Tunisia') || this.searchQuery.includes('Tunisie')
      ? this.searchQuery
      : `${this.searchQuery}, Tunisia`;
    
    // Add strict bounds for Tunisia: min/max lat/lon
    const tunisiaBounds = 'viewbox=8.5,30.2,12.0,37.5&bounded=1';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&${tunisiaBounds}&limit=5`;

    console.log('Searching for address in Tunisia:', searchQuery);

    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Get the top result
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Verify it's actually in Tunisia
          if (lat >= 30.2 && lat <= 37.5 && lng >= 8.5 && lng <= 12.0) {
            console.log('✓ Address found:', result.display_name);
            // Show confirmation before placing
            const confirmMsg = `Found: ${result.display_name}\n\nLatitude: ${lat.toFixed(4)}\nLongitude: ${lng.toFixed(4)}\n\nAccept this location?`;
            
            if (confirm(confirmMsg)) {
              this.placeMarker(lat, lng);
            } else {
              this.isLoadingAddress = false;
              alert('Location rejected. You can manually set coordinates below.');
            }
          } else {
            this.isLoadingAddress = false;
            alert('Address found but it\'s outside Tunisia boundaries.\nPlease use the city buttons below or enter coordinates manually.');
          }
        } else {
          this.isLoadingAddress = false;
          alert('Address not found in Tunisia.\nTry:\n1. Using city quick buttons\n2. Entering coordinates manually\n3. Searching with more details (e.g., "Avenue de Carthage, Tunis City Center")');
        }
      })
      .catch((error) => {
        console.error('Search error:', error);
        this.isLoadingAddress = false;
        alert('Error searching address. Please check your internet connection and try again.');
      });
  }

  /**
   * Reverse geocode coordinates to get address details
   */
  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const address = data.address;
          const street = address.road || address.street || '';
          const houseNumber = address.house_number || '';
          const fullAddress = houseNumber ? `${houseNumber} ${street}`.trim() : street;
          const city = address.city || address.town || address.village || address.county || data.address.state || '';

          // Fill the fields
          this.form.address = fullAddress || data.display_name || 'Address not determined';
          this.form.city = city || 'City not determined';
          this.form.latitude = lat;
          this.form.longitude = lng;

          console.log('✓ Address geocoded:', { address: this.form.address, city: this.form.city, lat, lng });
        } else {
          // Fallback: use display_name if address components not available
          this.form.address = data.display_name || 'Address not available';
          this.form.city = 'City not available';
          this.form.latitude = lat;
          this.form.longitude = lng;
          console.warn('Address components unavailable, using display_name');
        }
        
        this.isLoadingAddress = false;
        this.searchQuery = '';
      })
      .catch((error) => {
        console.error('Reverse geocoding error:', error);
        // Don't blank the fields - user can manually edit
        this.isLoadingAddress = false;
        alert('Could not auto-fill address details. Please enter them manually.');
      });
  }

  onSubmit(): void {
    if (!this.form.name?.trim()) {
      alert('Please enter a residence name');
      return;
    }
    
    if (!this.form.address?.trim()) {
      alert('Please enter a street address');
      return;
    }
    
    if (!this.form.city?.trim()) {
      alert('Please enter a city');
      return;
    }
    
    if (this.isEditMode && this.residence?.id) {
      this.residenceService.update(this.residence.id, this.form)
        .subscribe({
          next: () => {
            console.log('Residence updated successfully', this.form);
            alert('Residence updated successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error updating residence:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error updating residence: ' + errorMsg);
          }
        });
    } else {
      // Set organizationId for new residence if user is SYNDIC_ADMIN
      if (this.authService.isSyndicAdmin() && this.authService.organizationId()) {
        this.form.organizationId = this.authService.organizationId()!;
      }

      this.residenceService.create(this.form)
        .subscribe({
          next: (createdResidence) => {
            console.log('Residence created successfully', createdResidence);
            alert('Residence created successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error creating residence:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error creating residence: ' + errorMsg);
          }
        });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * Handle coordinate changes - update marker position on map
   */
  onCoordinatesChanged(): void {
    if (this.form.latitude && this.form.longitude && this.map) {
      // Remove existing marker
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      // Add new marker with updated coordinates
      this.marker = L.marker([this.form.latitude, this.form.longitude]).addTo(this.map);
      this.marker.bindPopup(`<strong>Updated Location</strong><br>Lat: ${this.form.latitude.toFixed(4)}<br>Lng: ${this.form.longitude.toFixed(4)}`);

      // Center map on marker
      this.map.setView([this.form.latitude, this.form.longitude], 16);
      console.log('✓ Coordinates updated on map:', { lat: this.form.latitude, lng: this.form.longitude });
    }
  }

  /**
   * Quick set coordinates for major Tunisian cities
   */
  setCoordinates(lat: number, lng: number, cityName: string): void {
    this.form.latitude = lat;
    this.form.longitude = lng;
    this.searchQuery = '';
    console.log(`✓ Set to ${cityName}:`, { lat, lng });
    this.onCoordinatesChanged();
  }

  /**
   * Verify coordinates by reverse geocoding to get actual address
   */
  verifyCoordinates(): void {
    if (!this.form.latitude || !this.form.longitude) {
      this.verificationError = 'Please enter latitude and longitude first';
      this.verifiedAddress = '';
      return;
    }

    this.isVerifying = true;
    this.verificationError = '';
    this.verifiedAddress = '';

    const lat = this.form.latitude;
    const lng = this.form.longitude;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          // Verify it's actually in Tunisia
          if (lat >= 30.2 && lat <= 37.5 && lng >= 8.5 && lng <= 12.0) {
            const address = data.address;
            const street = address.road || address.street || '';
            const city = address.city || address.town || address.village || '';
            const displayName = data.display_name || '';
            
            this.verifiedAddress = displayName;
            console.log('✓ Coordinates verified:', { address: this.verifiedAddress, lat, lng });
          } else {
            this.verificationError = 'Coordinates are outside Tunisia boundaries!';
          }
        } else {
          this.verificationError = 'Could not find address for these coordinates';
        }
        this.isVerifying = false;
      })
      .catch((error) => {
        console.error('Verification error:', error);
        this.verificationError = 'Error verifying coordinates. Check your connection.';
        this.isVerifying = false;
      });
  }
}

/**
 * ============================================================================
 * COMPONENT: RESIDENCE LIST
 * ============================================================================
 * Displays list of all residences with CRUD operations
 */
@Component({
  selector: 'app-residence-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ResidenceFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, DialogModule, TagModule, BuildingAnalyzerComponent],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header with Actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg text-white">
      <div>
        <h2 class="text-3xl font-bold m-0 flex items-center gap-3">
          <i class="pi pi-building text-3xl"></i>
          Residence Management
        </h2>
        <p class="text-primary-100 mt-1 opacity-90">Manage your property portfolio and residential assets</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <p-button label="AI Analysis" icon="pi pi-sparkles" [outlined]="true" styleClass="text-white border-white/30 hover:bg-white/10" (onClick)="showAnalyzerDialog = true" />
        <p-button label="Map View" icon="pi pi-map" [outlined]="true" styleClass="text-white border-white/30 hover:bg-white/10" (onClick)="goToMapView()" />
        <p-button label="Analytics" icon="pi pi-chart-bar" [outlined]="true" styleClass="text-white border-white/30 hover:bg-white/10" (onClick)="goToAnalytics()" />
        <p-button label="Add New" icon="pi pi-plus" severity="success" (onClick)="onAdd()" />
      </div>
    </div>

    <!-- AI Analyzer Dialog -->
    <p-dialog [(visible)]="showAnalyzerDialog" header="🏗️ AI Building Analyzer" [modal]="true" [style]="{width: '50vw'}" [breakpoints]="{'960px': '75vw', '640px': '90vw'}">
      <app-building-analyzer (confirmed)="onAnalysisConfirmed($event)"></app-building-analyzer>
    </p-dialog>

    <!-- Add/Edit Form Overlay -->
    <div *ngIf="showForm" class="mb-8">
      <app-residence-form
        [residence]="selectedResidence"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-residence-form>
    </div>

    <!-- Stats Overview (Optional but adds to the look) -->
    <div *ngIf="residences.length > 0 && !showForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
       <div class="card p-4 flex items-center gap-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
          <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
             <i class="pi pi-home text-xl"></i>
          </div>
          <div>
             <div class="text-surface-500 text-sm font-medium">Total Residences</div>
             <div class="text-2xl font-bold">{{ residences.length }}</div>
          </div>
       </div>
       <div class="card p-4 flex items-center gap-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
          <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
             <i class="pi pi-map-marker text-xl"></i>
          </div>
          <div>
             <div class="text-surface-500 text-sm font-medium">Cities Covered</div>
             <div class="text-2xl font-bold">{{ getUniqueCitiesCount() }}</div>
          </div>
       </div>
       <div class="card p-4 flex items-center gap-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
          <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
             <i class="pi pi-users text-xl"></i>
          </div>
          <div>
             <div class="text-surface-500 text-sm font-medium">Total Assets</div>
             <div class="text-2xl font-bold">In-Tree</div>
          </div>
       </div>
    </div>

    <!-- Residences Grid -->
    <div *ngIf="residences.length > 0 && !showForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div *ngFor="let residence of residences" class="group relative bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <!-- Card Header -->
        <div class="h-24 bg-gradient-to-r from-primary-500 to-primary-700 flex items-center px-6 relative overflow-hidden">
           <div class="absolute -right-4 -bottom-4 opacity-10 text-white transform -rotate-12">
              <i class="pi pi-building" style="font-size: 8rem"></i>
           </div>
           <h3 class="text-white text-xl font-bold truncate m-0 z-10">{{ residence.name }}</h3>
        </div>
        
        <!-- Card Content -->
        <div class="p-6">
          <div class="flex items-start gap-3 mb-4">
            <i class="pi pi-map-marker text-primary-500 mt-1"></i>
            <div>
              <div class="text-xs text-surface-500 uppercase font-bold tracking-wider mb-1">Address</div>
              <div class="text-surface-900 dark:text-surface-0 font-medium">{{ residence.address }}</div>
            </div>
          </div>

          <div class="flex items-start gap-3 mb-6">
            <i class="pi pi-directions text-primary-500 mt-1"></i>
            <div>
              <div class="text-xs text-surface-500 uppercase font-bold tracking-wider mb-1">City</div>
              <div class="text-surface-900 dark:text-surface-0 font-medium">{{ residence.city }}</div>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div class="grid grid-cols-2 gap-2 py-4 border-y border-surface-100 dark:border-surface-800 mb-6">
             <div class="text-center border-r border-surface-100 dark:border-surface-800">
                <div class="text-xs text-surface-500 mb-1 uppercase font-bold tracking-tighter">Buildings</div>
                <div class="font-bold text-lg text-primary-600">{{ buildingCounts[residence.id || ''] || 0 }}</div>
             </div>
             <div class="text-center">
                <div class="text-xs text-surface-500 mb-1 uppercase font-bold tracking-tighter">Status</div>
                <p-tag value="Active" severity="success" [rounded]="true" styleClass="text-[10px] px-3" />
             </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <p-button label="Manage Buildings" icon="pi pi-building" styleClass="w-full" (onClick)="onManage(residence)" />
            
            <div class="grid grid-cols-2 gap-2">
               <p-button label="Layout" icon="pi pi-map" [outlined]="true" styleClass="w-full text-sm" (onClick)="goToFloorPlan(residence)" />
               <p-button label="Tree" icon="pi pi-sitemap" [outlined]="true" styleClass="w-full text-sm" (onClick)="goToResidenceTree(residence)" />
            </div>

            <div class="flex justify-end gap-2 mt-2 pt-4 border-t border-surface-100 dark:border-surface-800">
              <p-button icon="pi pi-pencil" [text]="true" severity="info" (onClick)="onEdit(residence)" />
              <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(residence)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="residences.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-inbox text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Residences Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">Your residence portfolio is empty. Start by adding your first property manually or using our AI analyzer.</p>
      <div class="flex gap-3">
         <p-button label="Add Manually" icon="pi pi-plus" (onClick)="onAdd()" />
         <p-button label="Use AI Analyzer" icon="pi pi-sparkles" severity="help" [outlined]="true" (onClick)="showAnalyzerDialog = true" />
      </div>
    </div>
  `,
  styles: [``]
})
export class ResidenceListComponent implements OnInit {
  residences: Residence[] = [];
  selectedResidence: Residence | null = null;
  selectedResidences: Residence[] = [];
  showForm = false;
  showAnalyzerDialog = false;

  buildingCounts: { [residenceId: string]: number } = {};

  constructor(
    private residenceService: ResidenceService,
    private buildingService: BuildingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadResidences();
  }

  getUniqueCitiesCount(): number {
    return new Set(this.residences.map(r => r.city)).size;
  }

  loadResidences(): void {
    const orgId = this.authService.organizationId();
    const isSyndicAdmin = this.authService.isSyndicAdmin();

    const request = (isSyndicAdmin && orgId) 
      ? this.residenceService.getByOrganization(orgId)
      : this.residenceService.getAll();

    request.subscribe({
      next: (data) => {
        this.residences = data;
        console.log('Residences loaded:', this.residences);
        this.loadBuildingCounts();
      },
      error: (err) => {
        console.error('Error loading residences:', err);
        this.residences = [];
      }
    });
  }

  loadBuildingCounts(): void {
    if (this.residences.length === 0) return;
    
    console.log('🔄 Fetching building counts for', this.residences.length, 'residences...');
    
    // Create an array of observables to fetch buildings for each residence
    const requests = this.residences.map(res => {
      if (!res.id) return of([]);
      return this.buildingService.getByResidence(res.id).pipe(
        catchError(err => {
          console.error(`Error fetching buildings for residence ${res.id}:`, err);
          return of([]);
        })
      );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        this.buildingCounts = {};
        results.forEach((buildings, index) => {
          const resId = this.residences[index].id;
          if (resId) {
            this.buildingCounts[resId] = buildings.length;
          }
        });
        console.log('📊 Building counts updated via per-residence fetch:', this.buildingCounts);
      },
      error: (err) => console.error('❌ Error in forkJoin building counts:', err)
    });
  }

  onAdd(): void {
    this.selectedResidence = null;
    this.showForm = true;
  }

  onAnalysisConfirmed(analysis: any): void {
    console.log('Building analysis confirmed:', analysis);
    this.showAnalyzerDialog = false;
    // Optionally create a residence from the analysis
    if (analysis && analysis.buildingType) {
      const newResidence: Residence = {
        name: analysis.buildingType,
        address: 'Address from photo',
        city: 'City'
      };
      this.selectedResidence = newResidence;
      this.showForm = true;
    }
  }

  onEdit(residence: Residence): void {
    this.selectedResidence = { ...residence };
    this.showForm = true;
  }

  onManage(residence: Residence): void {
    if (residence.id) {
      this.router.navigate(['/pages/backoffice/property/buildings-by-residence', residence.id]);
    }
  }

  goToFloorPlan(residence: Residence): void {
    if (residence.id) {
      this.router.navigate(['/pages/backoffice/property/floor-plan', residence.id]);
    }
  }

  goToResidenceTree(residence: Residence): void {
    if (residence.id) {
      this.router.navigate(['/pages/backoffice/property/hierarchy-tree', residence.id]);
    }
  }

  goToAnalytics(): void {
    this.router.navigate(['/pages/backoffice/property/analytics']);
  }

  goToMapView(): void {
    this.router.navigate(['/pages/backoffice/property/map-overview']);
  }

  confirmDelete(residence: Residence): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this residence?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (residence.id) {
          this.residenceService.delete(residence.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Residence deleted' });
              this.loadResidences();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedResidences.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedResidences.length} residence(s)?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedResidences.forEach(r => {
          if (r.id) {
            this.residenceService.delete(r.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Residences deleted' });
        this.loadResidences();
        this.selectedResidences = [];
      }
    });
  }

  onDelete(id: string): void {
    this.residenceService.delete(id).subscribe(() => this.loadResidences());
  }

  onFormSaved(): void {
    this.showForm = false;
    this.loadResidences();
  }

  onFormCancelled(): void {
    this.showForm = false;
  }
}

/**
 * ============================================================================
 * COMPONENT: RESIDENCE APARTMENTS
 * ============================================================================
 * Displays residences with option to manage their apartments
 */
@Component({
  selector: 'app-residence-apartments',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="p-6">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3">
             <i class="pi pi-home text-primary-500"></i>
             Manage Apartments
          </h2>
          <p class="text-surface-600 dark:text-surface-400 mt-2">Select a residence to view and manage its units</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let r of residences" class="card p-0 overflow-hidden bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
          <div class="h-2 bg-primary-500"></div>
          <div class="p-6">
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2 truncate">{{ r.name }}</h3>
            <div class="flex items-center gap-2 text-surface-500 text-sm mb-4">
               <i class="pi pi-map-marker"></i>
               <span>{{ r.city }}</span>
            </div>
            
            <p-button 
               label="Manage Buildings & Apartments" 
               icon="pi pi-external-link" 
               styleClass="w-full font-bold"
               [routerLink]="['/apartments', r.id, 'buildings']" />
          </div>
        </div>
      </div>

      <div *ngIf="residences.length === 0" class="card text-center py-12 bg-surface-50 dark:bg-surface-800/50">
         <i class="pi pi-search text-4xl text-surface-300 mb-4"></i>
         <p class="text-surface-500">No residences found to manage.</p>
      </div>
    </div>
  `,
  styles: [``]
})
export class ResidenceApartmentsComponent implements OnInit {
  residences: Residence[] = [];

  constructor(
    private residenceService: ResidenceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadResidences();
  }

  loadResidences(): void {
    const orgId = this.authService.organizationId();
    const isSyndicAdmin = this.authService.isSyndicAdmin();

    const request = (isSyndicAdmin && orgId) 
      ? this.residenceService.getByOrganization(orgId)
      : this.residenceService.getAll();

    request.subscribe(data => {
      this.residences = data;
    });
  }
}

/**
 * ============================================================================
 * COMPONENT: RESIDENCE PARKING SPOTS
 * ============================================================================
 * Displays residences with option to manage their parking spots
 */
@Component({
  selector: 'app-residence-parking-spots',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  template: `
    <div class="p-6">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3">
             <i class="pi pi-car text-primary-500"></i>
             Parking Management
          </h2>
          <p class="text-surface-600 dark:text-surface-400 mt-2">Select a residence to manage its parking inventory</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let r of residences" class="card p-0 overflow-hidden bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
          <div class="h-2 bg-blue-500"></div>
          <div class="p-6">
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2 truncate">{{ r.name }}</h3>
            <div class="flex items-center gap-2 text-surface-500 text-sm mb-4">
               <i class="pi pi-map-marker"></i>
               <span>{{ r.city }}</span>
            </div>
            
            <p-button 
               label="Manage Parking Spots" 
               icon="pi pi-car" 
               severity="info"
               styleClass="w-full font-bold"
               [routerLink]="['/parking-spots', r.id, 'buildings']" />
          </div>
        </div>
      </div>

      <div *ngIf="residences.length === 0" class="card text-center py-12 bg-surface-50 dark:bg-surface-800/50">
         <i class="pi pi-search text-4xl text-surface-300 mb-4"></i>
         <p class="text-surface-500">No residences found to manage.</p>
      </div>
    </div>
  `,
  styles: [``]
})
export class ResidenceParkingSpotsComponent implements OnInit {
  residences: Residence[] = [];

  constructor(
    private residenceService: ResidenceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadResidences();
  }

  loadResidences(): void {
    const orgId = this.authService.organizationId();
    const isSyndicAdmin = this.authService.isSyndicAdmin();

    const request = (isSyndicAdmin && orgId) 
      ? this.residenceService.getByOrganization(orgId)
      : this.residenceService.getAll();

    request.subscribe(data => {
      this.residences = data;
    });
  }
}
