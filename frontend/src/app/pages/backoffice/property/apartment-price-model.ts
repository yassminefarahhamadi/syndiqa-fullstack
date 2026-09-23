/**
 * AI Apartment Price Prediction Model — Pre-trained Weight Loader
 * Loads pre-computed weights from model-weights.json instead of training in-browser.
 * Train offline with: node scripts/train-model.js
 */

export interface ApartmentDataPoint {
  city: string;
  region: string;
  roomCount: number;
  size: number;
  price: number;
  transactionType: string;
}

interface ModelWeights {
  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];
  w3: number[];
  b3: number;
  allCities: string[];
  allRegions: string[];
  inputSize: number;
  sizeMean: number;
  sizeStd: number;
  roomMean: number;
  roomStd: number;
  saleMean: number;
  saleStd: number;
  rentMean: number;
  rentStd: number;
  regionsMap: { [city: string]: string[] };
  trainedOn: number;
  epochs: number;
}

export class ApartmentPriceModel {
  private weights: ModelWeights | null = null;
  private trained = false;

  private relu(x: number): number { return Math.max(0, x); }

  /**
   * Load pre-trained weights from JSON file.
   * Call this instead of train() for instant model readiness.
   */
  loadWeights(w: ModelWeights): void {
    this.weights = w;
    this.trained = true;
    console.log(`✅ Model loaded: ${w.trainedOn} samples | ${w.epochs} epochs | ${w.allCities.length} cities | ${w.allRegions.length} regions`);
  }

  /**
   * Run inference — no training required.
   */
  predict(city: string, region: string, roomCount: number, size: number, type: 'À Vendre' | 'À Louer') {
    if (!this.trained || !this.weights) return null;
    const w = this.weights;

    // --- HYBRID NEURAL-MATH ARCHITECTURE ---
    // 1. Get Region Baseline using Neutral Inputs for Size/Rooms
    // We pass "Average" rooms (3) and "Average" size (100) to the model
    // to get the pure "Location Prestige" factor.
    const baselineInput = this.encode(city, region, 3, 100, type);
    const b1h = w.b1.map((b, j) => this.relu(b + baselineInput.reduce((s, v, m) => s + v * w.w1[j][m], 0)));
    const b2h = w.b2.map((b, j) => this.relu(b + b1h.reduce((s, v, m) => s + v * w.w2[j][m], 0)));
    const baselineNorm = w.b3 + b2h.reduce((s, v, m) => s + v * w.w3[m], 0);

    const mean = type === 'À Vendre' ? w.saleMean : w.rentMean;
    const std  = type === 'À Vendre' ? w.saleStd  : w.rentStd;
    const baseRegionPrice = baselineNorm * std + mean;

    // 2. Apply Logical Real Estate Scaling
    // Base is 100m² / 3 Rooms (S+2)
    const sizeFactor = size / 100;
    const roomFactor = 1 + ((roomCount - 3) * 0.1); // +/- 10% per room relative to S+2
    
    let predicted = baseRegionPrice * sizeFactor * roomFactor;

    // 3. Final Calibration
    const floorPrice = type === 'À Louer' ? 250 : 55000;
    predicted = Math.max(floorPrice, Math.round(predicted));

    return {
      predictedPrice: predicted,
      confidence: this.calculateConfidence(city, region),
      pricePerM2: Math.round(predicted / size),
      marketComparison: this.getMarketComparison(predicted / size, type),
      priceRange: {
        min: Math.round(predicted * (type === 'À Louer' ? 0.92 : 0.88)),
        max: Math.round(predicted * (type === 'À Louer' ? 1.08 : 1.12))
      }
    };
  }

  private encode(city: string, region: string, roomCount: number, size: number, type: string): number[] {
    if (!this.weights) return [];
    const w = this.weights;
    const f = new Array(w.inputSize).fill(0);
    const ci = w.allCities.indexOf(city);
    if (ci >= 0) f[ci] = 1;
    const ri = w.allRegions.indexOf(region);
    if (ri >= 0) f[w.allCities.length + ri] = 1;
    f[w.inputSize - 3] = type === 'À Vendre' ? 1 : 0;
    f[w.inputSize - 2] = (roomCount - w.roomMean) / w.roomStd;
    f[w.inputSize - 1] = (size     - w.sizeMean)  / w.sizeStd;
    return f;
  }

  private calculateConfidence(city: string, region: string): number {
    if (!this.weights) return 55;
    const cityRegions = this.weights.regionsMap[city] || [];
    let confidence = 60;
    if (cityRegions.length >= 5)  confidence += 15;
    if (cityRegions.includes(region)) confidence += 15;
    if (['Tunis', 'Sousse', 'Sfax', 'Nabeul', 'Ariana'].includes(city)) confidence += 6;
    return Math.min(confidence, 96);
  }

  private getMarketComparison(pricePerM2: number, type: string): string {
    if (!this.weights) return 'Average';
    const w = this.weights;
    const avg = type === 'À Vendre'
      ? (w.saleMean / w.sizeMean)
      : (w.rentMean / w.sizeMean);
    if (pricePerM2 > avg * 1.5)  return 'Premium';
    if (pricePerM2 > avg * 1.15) return 'Above Average';
    if (pricePerM2 < avg * 0.7)  return 'Budget';
    if (pricePerM2 < avg * 0.9)  return 'Below Average';
    return 'Average';
  }

  getCities(): string[] {
    return this.weights?.allCities || [];
  }

  getRegions(city: string): string[] {
    return this.weights?.regionsMap[city] || [];
  }

  getStats() {
    return {
      sales: 0,
      rentals: 0,
      totalSamples: this.weights?.trainedOn || 0,
      trained: this.trained
    };
  }
}
