/**
 * Offline Training Script for SyndiQA Neural Engine
 * Run with: node scripts/train-model.js
 * Outputs: src/assets/model-weights.json
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, '../src/assets/property-prices.csv');
const OUT_PATH = path.join(__dirname, '../public/model-weights.json');
const EPOCHS    = 500;
const BATCH     = 64;
const LR        = 0.03;
const H1        = 64;
const H2        = 32;

// ─── CSV PARSING ─────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function repairEncoding(s) {
  if (!s) return '';
  return s
    .replace(/A\?/g, 'À')
    .replace(/Bja/g, 'Béja')
    .replace(/Gabs/g, 'Gabès')
    .replace(/Kbili/g, 'Kébili')
    .replace(/Mdenine/g, 'Médenine');
}

function titleCase(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const data  = [];
  let skipped = 0, total = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    total++;

    const fields = parseCSVLine(line);
    if (fields.length < 8) { skipped++; continue; }

    const category  = fields[0];
    const roomCount = parseFloat(fields[1]);
    const size      = parseFloat(fields[3]);
    const type      = fields[4];
    const price     = parseFloat(fields[5]);
    let   city      = repairEncoding(fields[6]).trim();
    let   region    = repairEncoding(fields[7]).trim();

    const cat  = category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const typ  = type.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

    if (!cat.includes('appartement')) { skipped++; continue; }

    let mappedType = '';
    if (typ.includes('vendre')) mappedType = 'À Vendre';
    else if (typ.includes('louer')) mappedType = 'À Louer';
    else { skipped++; continue; }

    if (isNaN(roomCount) || roomCount < 0 || roomCount > 10) { skipped++; continue; }
    if (isNaN(size) || size < 10 || size > 600)              { skipped++; continue; }
    if (isNaN(price))                                         { skipped++; continue; }
    if (mappedType === 'À Vendre' && (price < 30000 || price > 5000000)) { skipped++; continue; }
    if (mappedType === 'À Louer'  && (price < 100   || price > 15000))   { skipped++; continue; }

    city   = titleCase(city);
    region = titleCase(region);
    if (city === 'La Manouba') city = 'Manouba';
    if (city === 'Le Kef')     city = 'Kef';

    data.push({ city, region, roomCount, size, price, transactionType: mappedType });
  }

  console.log(`📦 CSV: ${total} rows → ${data.length} valid apartment records (${skipped} skipped)`);
  return data;
}

// ─── MATH HELPERS ────────────────────────────────────────────────────────────
function relu(x)      { return Math.max(0, x); }
function reluD(x)     { return x > 0 ? 1 : 0; }
function mean(arr)    { return arr.reduce((a,b)=>a+b,0)/arr.length; }
function std(arr, m)  { return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/arr.length) || 1; }

function initW(rows, cols) {
  const lim = Math.sqrt(6/(rows+cols));
  return Array.from({length:rows}, ()=>Array.from({length:cols}, ()=>(Math.random()*2-1)*lim));
}

// ─── ENCODE ──────────────────────────────────────────────────────────────────
function encode(row, allCities, allRegions, inputSize, roomMean, roomStd, sizeMean, sizeStd) {
  const f = new Array(inputSize).fill(0);
  const ci = allCities.indexOf(row.city);
  if (ci >= 0) f[ci] = 1;
  const ri = allRegions.indexOf(row.region);
  if (ri >= 0) f[allCities.length + ri] = 1;
  f[inputSize-3] = row.transactionType === 'À Vendre' ? 1 : 0;
  f[inputSize-2] = (row.roomCount - roomMean) / roomStd;
  f[inputSize-1] = (row.size     - sizeMean)  / sizeStd;
  return f;
}

// ─── TRAIN ───────────────────────────────────────────────────────────────────
function train(data) {
  const n = data.length;
  const allCities  = [...new Set(data.map(d=>d.city))].sort();
  const allRegions = [...new Set(data.map(d=>d.region))].sort();
  const inputSize  = allCities.length + allRegions.length + 3;

  const sizes = data.map(d=>d.size);
  const sizMean = mean(sizes), sizStd = std(sizes, sizMean);
  const rooms = data.map(d=>d.roomCount);
  const romMean = mean(rooms), romStd = std(rooms, romMean);

  const salePrices = data.filter(d=>d.transactionType==='À Vendre').map(d=>d.price);
  const rentPrices = data.filter(d=>d.transactionType==='À Louer').map(d=>d.price);
  const saleMean = mean(salePrices), saleStd = std(salePrices, saleMean);
  const rentMean = mean(rentPrices), rentStd = std(rentPrices, rentMean);

  console.log(`🧠 Network: ${inputSize} → ${H1} → ${H2} → 1`);
  console.log(`   Sale mean: ${Math.round(saleMean)} TND   Rent mean: ${Math.round(rentMean)} TND`);

  let w1 = initW(H1, inputSize), b1 = new Array(H1).fill(0);
  let w2 = initW(H2, H1),       b2 = new Array(H2).fill(0);
  let w3 = Array.from({length:H2}, ()=>(Math.random()*2-1)*Math.sqrt(6/(H2+1)));
  let b3 = 0;

  const X = data.map(d => encode(d, allCities, allRegions, inputSize, romMean, romStd, sizMean, sizStd));
  const Y = data.map(d => d.transactionType==='À Vendre'
    ? (d.price-saleMean)/saleStd
    : (d.price-rentMean)/rentStd
  );

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    // Shuffle
    const idx = Array.from({length:n},(_,i)=>i);
    for (let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }

    let epochLoss = 0;

    for (let i = 0; i < n; i += BATCH) {
      const end = Math.min(i+BATCH, n);
      const bs  = end-i;

      const dw1 = Array.from({length:H1},()=>new Array(inputSize).fill(0));
      const db1 = new Array(H1).fill(0);
      const dw2 = Array.from({length:H2},()=>new Array(H1).fill(0));
      const db2 = new Array(H2).fill(0);
      const dw3 = new Array(H2).fill(0);
      let   db3 = 0;

      for (let k=i; k<end; k++) {
        const x = X[idx[k]], target = Y[idx[k]];

        const z1 = b1.map((b,j)=>b+x.reduce((s,v,m)=>s+v*w1[j][m],0));
        const h1 = z1.map(relu);
        const z2 = b2.map((b,j)=>b+h1.reduce((s,v,m)=>s+v*w2[j][m],0));
        const h2 = z2.map(relu);
        const out = b3 + h2.reduce((s,v,m)=>s+v*w3[m],0);

        const dOut = out - target;
        epochLoss += dOut*dOut;
        db3 += dOut;
        h2.forEach((v,j)=>dw3[j]+=dOut*v);

        const dh2 = w3.map(w=>dOut*w);
        const dz2 = z2.map((v,j)=>dh2[j]*reluD(v));
        dz2.forEach((dz,j)=>{ db2[j]+=dz; h1.forEach((v,m)=>dw2[j][m]+=dz*v); });

        const dh1 = new Array(H1).fill(0);
        for(let j=0;j<H2;j++) for(let m=0;m<H1;m++) dh1[m]+=dz2[j]*w2[j][m];
        const dz1 = z1.map((v,j)=>dh1[j]*reluD(v));
        dz1.forEach((dz,j)=>{ db1[j]+=dz; x.forEach((v,m)=>dw1[j][m]+=dz*v); });
      }

      const step = LR/bs;
      b3 -= step*db3;
      for(let j=0;j<H2;j++){ w3[j]-=step*dw3[j]; b2[j]-=step*db2[j]; for(let m=0;m<H1;m++) w2[j][m]-=step*dw2[j][m]; }
      for(let j=0;j<H1;j++){ b1[j]-=step*db1[j]; for(let m=0;m<inputSize;m++) w1[j][m]-=step*dw1[j][m]; }
    }

    if ((epoch+1) % 50 === 0 || epoch === 0) {
      const rmse = Math.sqrt(epochLoss/n);
      console.log(`  Epoch ${String(epoch+1).padStart(3)} / ${EPOCHS}  |  RMSE(norm): ${rmse.toFixed(4)}`);
    }
  }

  return { w1, b1, w2, b2, w3, b3, allCities, allRegions, inputSize,
    sizeMean: sizMean, sizeStd: sizStd, roomMean: romMean, roomStd: romStd,
    saleMean, saleStd, rentMean, rentStd };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log('🚀 SyndiQA Neural Engine — Offline Training');
console.log(`   CSV   : ${CSV_PATH}`);
console.log(`   Output: ${OUT_PATH}`);
console.log(`   Epochs: ${EPOCHS}  |  Batch: ${BATCH}  |  LR: ${LR}\n`);

const csv  = fs.readFileSync(CSV_PATH, 'utf8');
const data = parseCSV(csv);

if (data.length === 0) { console.error('❌ No data parsed. Check CSV path.'); process.exit(1); }

console.log(`\n⚙️  Training started...\n`);
const t0 = Date.now();
const weights = train(data);
const elapsed = ((Date.now()-t0)/1000).toFixed(1);

// Build regions map for fast lookup
const regionsMap = {};
data.forEach(d => {
  if (!regionsMap[d.city]) regionsMap[d.city] = new Set();
  regionsMap[d.city].add(d.region);
});
const regionsMapSorted = {};
for (const city of Object.keys(regionsMap).sort()) {
  regionsMapSorted[city] = [...regionsMap[city]].sort();
}

const output = { ...weights, regionsMap: regionsMapSorted, trainedOn: data.length, epochs: EPOCHS };
fs.writeFileSync(OUT_PATH, JSON.stringify(output));

console.log(`\n✅ Training complete in ${elapsed}s`);
console.log(`   Weights saved → ${OUT_PATH}`);
console.log(`   Trained on ${data.length} records | ${EPOCHS} epochs`);
console.log(`   Cities: ${weights.allCities.length}  |  Regions: ${weights.allRegions.length}`);
