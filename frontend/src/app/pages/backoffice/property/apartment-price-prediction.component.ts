import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApartmentPriceModel } from './apartment-price-model';

interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  pricePerM2: number;
  marketComparison: string;
  priceRange: { min: number; max: number };
}

@Component({
  selector: 'app-apartment-price-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, SelectModule, SliderModule, TagModule, TooltipModule],
  template: `
    <!-- Hero Header -->
    <div class="mb-10 p-10 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
      <div class="absolute -right-20 -top-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      <div class="absolute -left-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px]"></div>
      
      <div class="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div class="flex items-center gap-6">
           <div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-2xl group overflow-hidden relative">
              <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <i class="pi pi-sparkles text-4xl text-primary-400 animate-pulse"></i>
           </div>
           <div>
              <h1 class="text-4xl font-black text-white m-0 tracking-tighter flex items-center gap-3">
                 SyndiQA Neural Engine
                 <p-tag value="BETA 2.0" severity="info" [rounded]="true" styleClass="text-[10px] py-1 px-3 border border-primary-500/30 bg-primary-500/10" />
              </h1>
              <p class="text-indigo-200 mt-2 m-0 opacity-80 text-lg font-medium">Predicting Tunisian Real Estate market values with deep learning</p>
           </div>
        </div>
        
        <div class="flex flex-col gap-2">
           <div *ngIf="modelReady" class="px-5 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
              <span class="text-xs font-bold text-white uppercase tracking-widest">Core Ready: {{ stats.totalSamples | number }} Datapoints</span>
           </div>
           <div *ngIf="!modelReady && !error" class="px-5 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center gap-3">
              <i class="pi pi-spin pi-spinner text-primary-400"></i>
              <span class="text-xs font-bold text-white uppercase tracking-widest italic">Synchronizing Neural Weights...</span>
           </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Configuration Panel -->
      <div class="lg:col-span-7 space-y-8">
        <div class="bg-surface-0 dark:bg-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
           <div class="flex items-center justify-between mb-10">
              <h3 class="text-xl font-black m-0 flex items-center gap-3">
                 <i class="pi pi-sliders-h text-primary-500"></i>
                 Asset Parameters
              </h3>
              <div class="flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
                 <button 
                   class="px-6 py-2 rounded-lg text-xs font-bold transition-all"
                   [ngClass]="transactionType === 'À Vendre' ? 'bg-surface-0 dark:bg-surface-900 shadow-md text-primary-500' : 'text-surface-500 hover:text-surface-900'"
                   (click)="transactionType = 'À Vendre'">
                   BUY
                 </button>
                 <button 
                   class="px-6 py-2 rounded-lg text-xs font-bold transition-all"
                   [ngClass]="transactionType === 'À Louer' ? 'bg-surface-0 dark:bg-surface-900 shadow-md text-primary-500' : 'text-surface-500 hover:text-surface-900'"
                   (click)="transactionType = 'À Louer'">
                   RENT
                 </button>
              </div>
           </div>

           <div class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Governorate</label>
                    <p-select 
                      [options]="cities" 
                      [(ngModel)]="city" 
                      (onChange)="onCityChange()" 
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Governorate" 
                      styleClass="w-full h-12 rounded-xl" />
                 </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Neighborhood</label>
                    <p-select 
                      [options]="regions" 
                      [(ngModel)]="region" 
                      [disabled]="!city" 
                      [filter]="true"
                      filterPlaceholder="Search Neighborhood..."
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Neighborhood" 
                      styleClass="w-full h-12 rounded-xl" />
                 </div>
              </div>

              <div class="flex flex-col gap-4">
                 <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1 flex justify-between">
                    Structural Volume
                    <span class="text-primary-500 font-black">{{ roomCount }} Rooms</span>
                 </label>
                 <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button *ngFor="let r of roomOptions"
                       (click)="roomCount = r.value"
                       class="aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all duration-300"
                       [ngClass]="roomCount === r.value ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'">
                       <span class="text-lg">{{ r.icon }}</span>
                       <span class="text-[10px] font-bold mt-1">{{ r.label }}</span>
                    </button>
                 </div>
              </div>

              <div class="flex flex-col gap-4">
                 <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1 flex justify-between">
                    Surface Area
                    <span class="text-primary-500 font-black">{{ surface }} m²</span>
                 </label>
                 <div class="px-2 py-4 bg-surface-50 dark:bg-surface-800 rounded-2xl">
                    <p-slider [(ngModel)]="surface" [min]="20" [max]="400" [step]="5" styleClass="mx-4" />
                    <div class="flex justify-between px-4 mt-3 text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
                       <span>Compact (20m²)</span>
                       <span>Standard</span>
                       <span>Estate (400m²)</span>
                    </div>
                 </div>
              </div>
           </div>

           <p-button 
              [label]="loading ? 'PROCESSING NEURAL PATHS...' : (!modelReady ? 'SYNCHRONIZING WEIGHTS...' : 'EXECUTE PREDICTION')" 
              [icon]="loading ? 'pi pi-spin pi-spinner' : (!modelReady ? 'pi pi-spin pi-spinner' : 'pi pi-bolt')"
              styleClass="w-full mt-10 py-5 rounded-2xl text-lg font-black tracking-widest shadow-xl shadow-primary-500/20"
              [disabled]="loading || !city || roomCount === null || !modelReady"
              (onClick)="predict()" />
        </div>
      </div>

      <!-- Analysis Results -->
      <div class="lg:col-span-5 space-y-8">
        <!-- AI Insight Card -->
        <div *ngIf="!result && !loading" class="bg-indigo-50 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-[2rem] p-10 text-center">
           <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="pi pi-search-plus text-2xl text-indigo-500"></i>
           </div>
           <h4 class="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-3">Awaiting Parameters</h4>
           <p class="text-indigo-600 dark:text-indigo-400 text-sm leading-relaxed">Configure the apartment specifications to initiate the deep learning valuation analysis.</p>
        </div>

        <!-- Result Display -->
        <div *ngIf="result && !loading" class="bg-surface-0 dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
           <div class="p-8 bg-gradient-to-br from-primary-600 to-indigo-800 text-white text-center">
              <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Estimated Market Value</div>
              <div class="text-5xl font-black mb-2 tracking-tighter">{{ result.predictedPrice | number: '1.0-0' }} <span class="text-2xl font-light opacity-80">TND</span></div>
              <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-md text-xs font-bold border border-white/10">
                 <i class="pi pi-shield-check text-green-400"></i>
                 {{ result.confidence }}% Confidence Score
              </div>
           </div>

           <div class="p-8 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                 <div class="p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700">
                    <div class="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-1">Price per m²</div>
                    <div class="text-xl font-black text-surface-900 dark:text-surface-0">{{ result.pricePerM2 | number: '1.0-0' }} <span class="text-xs">TND</span></div>
                 </div>
                 <div class="p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700">
                    <div class="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-1">Market Sentiment</div>
                    <div class="text-xl font-black text-primary-500">{{ result.marketComparison }}</div>
                 </div>
              </div>

              <div class="p-6 bg-surface-50 dark:bg-surface-800 rounded-2xl">
                 <div class="flex justify-between items-center mb-4">
                    <span class="text-xs font-black text-surface-400 uppercase tracking-widest">Market Range Analysis</span>
                    <span class="text-[10px] font-bold text-surface-500 italic">Expected Variance</span>
                 </div>
                 <div class="flex items-center gap-3">
                    <span class="text-[11px] font-bold text-surface-500">{{ result.priceRange.min | number: '1.0-0' }}</span>
                    <div class="flex-1 h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden relative shadow-inner">
                       <div class="absolute inset-y-0 left-1/4 right-1/4 bg-primary-500/30 border-x-2 border-primary-500 animate-pulse"></div>
                    </div>
                    <span class="text-[11px] font-bold text-surface-500">{{ result.priceRange.max | number: '1.0-0' }}</span>
                 </div>
              </div>
           </div>
        </div>

        <!-- Logic Card -->
        <div class="bg-surface-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
           <div class="absolute right-0 top-0 p-4 opacity-10">
              <i class="pi pi-code text-6xl"></i>
           </div>
           <h4 class="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
              <i class="pi pi-cog text-primary-500"></i>
              Neural Logic
           </h4>
           <div class="space-y-4">
              <div class="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary-500/30 transition-all">
                 <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20">
                    <i class="pi pi-share-alt text-primary-400"></i>
                 </div>
                 <div>
                    <div class="text-xs font-bold mb-1">Multi-Layer Perceptron</div>
                    <p class="text-[11px] text-surface-400 leading-relaxed">Hidden layers detect non-linear correlations between neighborhood prestige and floor ratios.</p>
                 </div>
              </div>
              <div class="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary-500/30 transition-all">
                 <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20">
                    <i class="pi pi-filter text-emerald-400"></i>
                 </div>
                 <div>
                    <div class="text-xs font-bold mb-1">Feature Scaling</div>
                    <p class="text-[11px] text-surface-400 leading-relaxed">Data is normalized using Z-Score standardization to ensure high-fidelity weight distribution.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-slider .p-slider-handle { 
       width: 1.5rem; 
       height: 1.5rem; 
       background: #6366f1; 
       border: 3px solid white;
       box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
    }
    :host ::ng-deep .p-slider .p-slider-range { background: #6366f1; }
  `]
})
export class ApartmentPricePredictionComponent implements OnInit {
  transactionType: 'À Vendre' | 'À Louer' = 'À Vendre';
  city: string = '';
  region: string = '';
  surface: number = 100;
  roomCount: number = 3;
  loading = false;
  modelReady = false;
  error: string | null = null;
  result: PredictionResult | null = null;
  
  // Hardcoded — Tunisia has exactly 24 governorates, always available
  cities: any[] = [
    { label: 'Ariana', value: 'Ariana' },
    { label: 'Béja', value: 'Béja' },
    { label: 'Ben Arous', value: 'Ben Arous' },
    { label: 'Bizerte', value: 'Bizerte' },
    { label: 'Gabès', value: 'Gabès' },
    { label: 'Gafsa', value: 'Gafsa' },
    { label: 'Jendouba', value: 'Jendouba' },
    { label: 'Kairouan', value: 'Kairouan' },
    { label: 'Kasserine', value: 'Kasserine' },
    { label: 'Kébili', value: 'Kébili' },
    { label: 'Kef', value: 'Kef' },
    { label: 'Mahdia', value: 'Mahdia' },
    { label: 'Manouba', value: 'Manouba' },
    { label: 'Médenine', value: 'Médenine' },
    { label: 'Monastir', value: 'Monastir' },
    { label: 'Nabeul', value: 'Nabeul' },
    { label: 'Sfax', value: 'Sfax' },
    { label: 'Sidi Bouzid', value: 'Sidi Bouzid' },
    { label: 'Siliana', value: 'Siliana' },
    { label: 'Sousse', value: 'Sousse' },
    { label: 'Tataouine', value: 'Tataouine' },
    { label: 'Tozeur', value: 'Tozeur' },
    { label: 'Tunis', value: 'Tunis' },
    { label: 'Zaghouan', value: 'Zaghouan' }
  ];
  regions: any[] = [];
  stats: any = { sales: 0, rentals: 0 };
  
  roomOptions = [
    { label: 'S+0', value: 0, icon: '🏙️' },
    { label: 'S+1', value: 1, icon: '🏠' },
    { label: 'S+2', value: 2, icon: '🏘️' },
    { label: 'S+3', value: 3, icon: '🏛️' }
  ];

  private model = new ApartmentPriceModel();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeModel();
  }

  // Hardcoded neighborhoods per governorate, sourced directly from dataset
  private neighborhoodMap: { [city: string]: string[] } = {
    'Ariana': ['Ariana', 'Ariana Ville', 'Autres villes', 'Borj Louzir', 'Chotrana', 'Ennasr', 'Ettadhamen', 'Ghazela', 'Jardins D\'el Menzah', 'La Soukra', 'Mnihla', 'Raoued', 'Sidi Thabet'],
    'Béja': ['Autres villes', 'Béja', 'Béja Nord', 'Béja Sud', 'Medjez El-Bab'],
    'Ben Arous': ['Autres villes', 'Ben Arous', 'Boumhel', 'El Mourouj', 'Ezzahra', 'Fouchana', 'Hammam Chott', 'Hammam Lif', 'Mégrine', 'Medina Jedida', 'Mohamedia', 'Mornag', 'Radès'],
    'Bizerte': ['Autres villes', 'Bizerte', 'Bizerte Nord', 'Bizerte Sud', 'Menzel Bourguiba', 'Ras Jebel', 'Zarzouna'],
    'Gabès': ['Autres villes', 'Gabès', 'Gabès Médina', 'Gabès Sud', 'Métouia'],
    'Gafsa': ['Autres villes', 'Gafsa Nord', 'Gafsa Sud'],
    'Jendouba': ['Ain Draham', 'Autres villes', 'Jendouba', 'Tabarka'],
    'Kairouan': ['Autres villes', 'Kairouan', 'Kairouan Nord', 'Kairouan Sud'],
    'Kasserine': ['Autres villes', 'Kasserine Nord'],
    'Kébili': ['Autres villes', 'Kébili'],
    'Kef': ['Autres villes', 'Kef Ouest', 'Le Kef'],
    'Mahdia': ['Autres villes', 'Ksour Essef', 'Mahdia'],
    'Manouba': ['Autres villes', 'Denden', 'Djedeida', 'Douar Hicher', 'Manouba', 'Manouba Ville', 'Oued Ellil'],
    'Médenine': ['Autres villes', 'Djerba - Midoun', 'Djerba-Houmt Souk'],
    'Monastir': ['Autres villes', 'Ksar Hellal', 'Moknine', 'Monastir', 'Sahline', 'Téboulba'],
    'Nabeul': ['Autres villes', 'Dar Chaâbane El Fehri', 'Grombalia', 'Hammam Ghezèze', 'Hammamet', 'Hammamet Centre', 'Hammamet Nord', 'Kélibia', 'Mrezga', 'Nabeul'],
    'Sfax': ['Autres villes', 'Menzel Chaker', 'Route el Afrane', 'Route el Ain', 'Route Mehdia', 'Route Menzel Chaker', 'Route Soukra', 'Route Tunis', 'Sakiet Eddaïer', 'Sakiet Ezzit', 'Sfax', 'Sfax Médina', 'Sfax Ville'],
    'Sidi Bouzid': ['Autres villes', 'Sidi Bouzid Ouest'],
    'Siliana': ['Autres villes', 'Siliana'],
    'Sousse': ['Akouda', 'Autres villes', 'Enfidha', 'Hammam Sousse', 'Hergla', 'Kalâa Kebira', 'Kalâa Sghira', 'Kantaoui', 'M\'saken', 'Sahloul', 'Sidi Bou Ali', 'Sousse', 'Sousse Jawhara', 'Sousse Médina', 'Sousse Riadh', 'Sousse Sidi Abdelhamid'],
    'Tataouine': ['Autres villes', 'Tataouine'],
    'Tozeur': ['Autres villes', 'Tozeur'],
    'Tunis': ['Autres villes', 'Agba', 'Carthage', 'Centre Urbain Nord', 'Centre Ville - Lafayette', 'Cité El Khadra', 'Cité Olympique', 'El Kabaria', 'El Omrane', 'El Omrane Supérieur', 'El Ouardia', 'Ettahrir', 'Ezzouhour', 'Hrairia', 'La Goulette', 'La Marsa', 'L\'Aouina', 'Le Bardo', 'Le Kram', 'Médina', 'Manar', 'Menzah', 'Mutuelleville', 'Sidi Bou Saïd', 'Sidi Daoud', 'Sidi El Béchir', 'Sidi Hassine', 'Tunis'],
    'Zaghouan': ['Autres villes', 'El Fahs']
  };

  private initializeModel(): void {
    console.log('📡 Requesting model weights from /model-weights.json...');
    this.http.get<any>('/model-weights.json').subscribe({
      next: (weights) => {
        console.log('✅ Weights received, loading into engine...');
        this.model.loadWeights(weights);
        this.stats = { sales: 0, rentals: 0, totalSamples: weights.trainedOn, trained: true };
        this.modelReady = true;
        this.error = null;
      },
      error: (err: any) => {
        console.error('❌ Failed to load model weights:', err);
        this.error = 'Neural Engine synchronization failed. Please refresh the page.';
      }
    });
  }

  onCityChange(): void {
    this.region = '';
    // Use hardcoded map first — immediately available
    const neighborhoods = this.neighborhoodMap[this.city] || [];
    this.regions = neighborhoods.map(r => ({ label: r, value: r }));
  }

  predict(): void {
    if (!this.modelReady) {
      this.error = 'Model is still training, please wait a moment and try again.';
      return;
    }
    this.loading = true;
    this.result = null;
    this.error = null;
    
    // Artificial delay for neural effect
    setTimeout(() => {
      const prediction = this.model.predict(
        this.city,
        this.region,
        this.roomCount + 1,
        this.surface,
        this.transactionType
      );
      
      if (prediction) {
        this.result = prediction;
      } else {
        this.error = 'Model processing failure. Please try again.';
      }
      this.loading = false;
    }, 1500);
  }
}
