#!/usr/bin/env node
/**
 * CLOUD4SAYA — demo data seeder
 * -----------------------------------------------------------------------------
 * Populates every module with realistic demo data by calling the real REST API,
 * so the dashboards, tables and charts are not empty in a portfolio demo.
 *
 * Usage:
 *   1. Start MongoDB + backend (npm run dev:backend) so the API is on :8089
 *   2. node scripts/seed-demo.mjs           (or: npm run seed:demo)
 *
 * Safe to re-run: it detects the demo organizations and skips re-seeding them.
 * Requires Node 20+ (native fetch / FormData / Blob).
 */

const BASE = process.env.SEED_API_URL || 'http://localhost:8089';

// ─── tiny http helpers ───────────────────────────────────────────────────────
const j = (r) => r.text().then((t) => { try { return JSON.parse(t); } catch { return t; } });

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await j(res);
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function apiForm(path, { token, parts }) {
  const fd = new FormData();
  for (const [name, value] of parts) fd.append(name, value.blob, value.filename);
  // JSON parts must carry an application/json content-type so Spring @RequestPart can bind them
  for (const [name, value] of (parts.jsonParts || [])) {
    fd.append(name, new Blob([value], { type: 'application/json' }));
  }
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: fd,
  });
  const data = await j(res);
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

const decodeJwt = (t) => JSON.parse(Buffer.from(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

async function login(email, password) {
  const r = await api('POST', '/auth/login', { body: { email, password } });
  const claims = decodeJwt(r.accessToken);
  return { token: r.accessToken, accountId: claims.sub, organizationId: claims.organizationId, role: claims.role, email };
}

// 1x1 transparent PNG, used where an endpoint requires a photo part
const PNG_1PX = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
), (c) => c.charCodeAt(0));
const pngBlob = () => new Blob([PNG_1PX], { type: 'image/png' });

const pad = (n, w = 2) => String(n).padStart(w, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoDateTime = (d) => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const monthsAgo = (m) => { const d = new Date(); d.setMonth(d.getMonth() - m); return d; };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(18, 0, 0, 0); return d; };
const pick = (arr, i) => arr[i % arr.length];

let created = { orgs: 0, residences: 0, buildings: 0, apartments: 0, residents: 0, staff: 0, leases: 0, charges: 0, expenses: 0, mrequests: 0, mtasks: 0, events: 0, participations: 0, announcements: 0, incidents: 0 };
const step = (label) => process.stdout.write(`  • ${label}\n`);

// ─── name pools (Tunisian context) ───────────────────────────────────────────
const FIRST = ['Mohamed', 'Ahmed', 'Yassine', 'Sofien', 'Karim', 'Nizar', 'Wael', 'Bilel', 'Hedi', 'Aymen',
  'Sana', 'Ines', 'Rania', 'Mariem', 'Nour', 'Emna', 'Syrine', 'Dorra', 'Amira', 'Salma'];
const LAST = ['Ben Salah', 'Trabelsi', 'Gharbi', 'Jendoubi', 'Bouazizi', 'Khelifi', 'Mansour', 'Chaabane',
  'Ferchichi', 'Haddad', 'Bel Hadj', 'Ayari', 'Sassi', 'Miled', 'Zouari'];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '');

// reported-incident templates, shared by fresh + top-up paths
const INC_TEMPLATES = [
  ['WATER_LEAK', 'TECHNICAL', 'Infiltration d\'eau dans le parking niveau -1.', 'MEDIUM'],
  ['ELECTRICITY', 'TECHNICAL', 'Disjoncteur général qui saute régulièrement le soir.', 'HIGH'],
  ['SECURITY', 'SAFETY', 'Porte du hall qui ne se verrouille plus automatiquement.', 'HIGH'],
  ['ELEVATOR', 'TECHNICAL', 'Bruit anormal dans l\'ascenseur du Bloc C.', 'MEDIUM'],
  ['COMPLAINT', 'COMPLAINT', 'Nuisances sonores répétées après 23h.', 'LOW'],
];

async function seedIncidents(buildings, residents, count) {
  for (let i = 0; i < Math.min(count, INC_TEMPLATES.length); i++) {
    const [type, category, description, userSeverity] = INC_TEMPLATES[i];
    try {
      const r = residents[i % residents.length];
      const rt = await login(r.email, r.password);
      const parts = [['files', { blob: pngBlob(), filename: 'evidence.png' }]];
      parts.jsonParts = [['data', JSON.stringify({
        type, category, description, buildingId: pick(buildings, i).id, userSeverity,
      })]];
      await apiForm('/api/incidents', { token: rt.token, parts });
      created.incidents++;
    } catch (e) { step(`  incident skipped: ${e.message.slice(0, 140)}`); }
  }
}

// ─── seed one organization ───────────────────────────────────────────────────
async function seedOrg({ orgName, orgCity, orgAddress, adminEmail, adminPassword, size }) {
  // 1) create the syndic admin + organization (idempotent-ish: login if it already exists)
  let admin;
  try {
    admin = await login(adminEmail, adminPassword);
    step(`org "${orgName}" already exists — reusing (${admin.organizationId})`);
    // top up incidents if that step failed on a previous run
    const existing = await api('GET', '/api/incidents', { token: admin.token }).catch(() => []);
    if (Array.isArray(existing) && existing.length === 0) {
      const bs = await api('GET', '/api/buildings', { token: admin.token }).catch(() => []);
      const rs = (await api('GET', '/admin/syndic/residents', { token: admin.token }).catch(() => []))
        .map((a) => ({ ...a, email: a.email, password: 'Resident123!' }));
      if (bs.length && rs.length) { step('topping up incidents…'); await seedIncidents(bs, rs, size.incidents); }
    }
    return { admin, skipped: true };
  } catch { /* not created yet */ }

  await api('POST', '/auth/register', {
    body: {
      email: adminEmail, password: adminPassword, firstName: 'Syndic', lastName: orgName.split(' ').pop(),
      phone: '+216 71 ' + Math.floor(100000 + Math.random() * 899999), orgName, orgAddress, orgCity,
    },
  });
  admin = await login(adminEmail, adminPassword);
  const orgId = admin.organizationId;
  created.orgs++;
  step(`org "${orgName}" (${orgId}) + syndic ${adminEmail}`);

  // 2) residence + buildings
  const residence = await api('POST', '/api/residences', {
    token: admin.token,
    body: { name: orgName, address: orgAddress, city: orgCity, organizationId: orgId },
  });
  created.residences++;

  const buildingNames = ['Bloc A', 'Bloc B', 'Bloc C'].slice(0, size.buildings);
  const buildings = [];
  for (const name of buildingNames) {
    const b = await api('POST', '/api/buildings', {
      token: admin.token,
      body: { residenceId: residence.id, organizationId: orgId, name, floorsCount: 5, parkingSpotsCount: 12 },
    });
    buildings.push(b);
    created.buildings++;
  }

  // 3) apartments
  const apartments = [];
  const types = ['S+1', 'S+2', 'S+2', 'S+3', 'S+3', 'S+4'];
  for (const b of buildings) {
    for (let f = 1; f <= size.floorsWithFlats; f++) {
      for (let u = 1; u <= size.flatsPerFloor; u++) {
        const a = await api('POST', '/api/apartments', {
          token: admin.token,
          body: {
            buildingId: b.id, organizationId: orgId, floor: f, unitNumber: `${f}${pad(u)}`,
            surfaceM2: 60 + ((f * u * 7) % 90), type: pick(types, f + u), status: 'OCCUPIED',
          },
        });
        apartments.push({ ...a, buildingId: b.id });
        created.apartments++;
      }
    }
  }

  // 4) residents + technical staff (need PLATFORM_ADMIN token)
  const residents = [];
  for (let i = 0; i < size.residents; i++) {
    const first = pick(FIRST, i * 3 + 1), last = pick(LAST, i * 2 + 1);
    const email = `${slug(first)}.${slug(last)}${i}@${slug(orgName)}.demo`;
    const acc = await api('POST', '/admin/accounts', {
      token: platformAdmin.token,
      body: {
        email, firstName: first, lastName: last, phone: '+216 2' + Math.floor(1000000 + Math.random() * 8999999),
        role: 'RESIDENT', organizationId: orgId, password: 'Resident123!',
      },
    });
    residents.push({ ...acc, email, password: 'Resident123!' });
    created.residents++;
  }

  const staff = [];
  const trades = ['Plomberie', 'Électricité', 'Ascenseur', 'Nettoyage'];
  for (let i = 0; i < size.staff; i++) {
    const first = pick(FIRST, i * 5), last = pick(LAST, i * 4 + 2);
    const email = `tech.${slug(last)}${i}@${slug(orgName)}.demo`;
    const acc = await api('POST', '/admin/accounts', {
      token: platformAdmin.token,
      body: {
        email, firstName: first, lastName: last, phone: '+216 5' + Math.floor(1000000 + Math.random() * 8999999),
        role: 'TECHNICAL_STAFF', organizationId: orgId, password: 'Staff123!',
        jobTitle: 'Technicien ' + pick(trades, i), department: pick(trades, i), specializations: [pick(trades, i)],
      },
    });
    staff.push(acc);
    created.staff++;
  }

  // 5) leases (one per resident, mapped onto an apartment)
  const leases = [];
  for (let i = 0; i < residents.length; i++) {
    const ap = apartments[i % apartments.length];
    const start = monthsAgo(6 + (i % 12));
    const end = new Date(start); end.setFullYear(end.getFullYear() + 2);
    const rent = 550 + (i % 6) * 120;
    const lease = await api('POST', '/api/leases', {
      token: admin.token,
      body: {
        accountId: residents[i].id, apartmentId: ap.id, buildingId: ap.buildingId, organizationId: orgId,
        startDate: isoDate(start), endDate: isoDate(end),
        monthlyRent: rent, depositAmount: rent * 2, status: 'ACTIVE', isOwner: i % 4 === 0,
      },
    });
    leases.push(lease);
    created.leases++;
  }

  // 6) charges — 6 months of monthly assessments, mixed payment states
  const chargeStates = [
    { status: 'PAID', ratio: 1 }, { status: 'PAID', ratio: 1 }, { status: 'PAID', ratio: 1 },
    { status: 'PARTIALLY_PAID', ratio: 0.5 }, { status: 'PENDING', ratio: 0 }, { status: 'OVERDUE', ratio: 0 },
  ];
  for (let m = 5; m >= 0; m--) {
    const due = monthsAgo(m); due.setDate(5);
    const period = `${due.getFullYear()}-${pad(due.getMonth() + 1)}`;
    for (let i = 0; i < residents.length; i++) {
      const ap = apartments[i % apartments.length];
      const amount = 180 + (i % 5) * 25;
      const st = m === 0 ? chargeStates[i % chargeStates.length]
        : (i % 7 === 0 ? { status: 'OVERDUE', ratio: 0 } : { status: 'PAID', ratio: 1 });
      await api('POST', '/charge', {
        token: admin.token,
        body: {
          organizationId: orgId, buildingId: ap.buildingId, userId: residents[i].id,
          label: `Charges communes ${period}`, amount,
          paidAmount: Math.round(amount * st.ratio * 100) / 100,
          dueDate: isoDate(due), status: st.status, period,
        },
      });
      created.charges++;
    }
  }

  // 7) expenses by category
  const expenseCats = [
    ['Contrat entretien ascenseur', 'ELEVATOR', 480],
    ['Nettoyage parties communes', 'CLEANING', 620],
    ['Consommation électricité communs', 'UTILITIES', 340],
    ['Réparation plomberie sous-sol', 'PLUMBING', 210],
    ['Espaces verts / jardinage', 'GARDENING', 260],
    ['Assurance immeuble', 'INSURANCE', 900],
    ['Fournitures & petit matériel', 'SUPPLIES', 130],
  ];
  for (let m = 5; m >= 0; m--) {
    const d = monthsAgo(m); d.setDate(12);
    for (let k = 0; k < expenseCats.length; k++) {
      const [description, category, base] = expenseCats[k];
      if (m > 0 && k > 3) continue; // fewer in older months
      await api('POST', '/expense', {
        token: admin.token,
        body: {
          organizationId: orgId, buildingId: pick(buildings, k).id,
          description, category, amount: base + ((m + k) % 4) * 45, expenseDate: isoDate(d),
        },
      });
      created.expenses++;
    }
  }

  // 8) maintenance requests + tasks
  const mrTemplates = [
    ['Fuite d\'eau au 3e étage', 'PLUMBING', 'HIGH', 'IN_PROGRESS'],
    ['Ampoule grillée hall d\'entrée', 'ELECTRICAL', 'LOW', 'COMPLETED'],
    ['Ascenseur bloqué au RDC', 'ELEVATOR', 'CRITICAL', 'IN_PROGRESS'],
    ['Interphone en panne Bloc B', 'ELECTRICAL', 'MEDIUM', 'OPEN'],
    ['Nettoyage garage à programmer', 'CLEANING', 'LOW', 'OPEN'],
    ['Porte de garage grince', 'STRUCTURAL', 'MEDIUM', 'COMPLETED'],
    ['Climatisation local poubelles', 'HVAC', 'MEDIUM', 'VERIFIED'],
    ['Serrure boîtes aux lettres', 'SECURITY', 'HIGH', 'OPEN'],
  ].slice(0, size.maintenance);

  for (let i = 0; i < mrTemplates.length; i++) {
    const [title, category, severity, status] = mrTemplates[i];
    const ap = apartments[i % apartments.length];
    const mr = await api('POST', '/api/maintenance/requests', {
      token: admin.token,
      body: {
        title, description: `${title} — signalé par un résident. Intervention requise.`,
        category, source: 'SYNDIC_ADMIN', priority: pick(['LOW', 'MEDIUM', 'HIGH'], i),
        severity, status, buildingId: ap.buildingId, apartmentId: ap.id,
        residenceId: residence.id, locationDetails: `Bloc ${pick(['A', 'B', 'C'], i)}, étage ${1 + (i % 5)}`,
      },
    });
    created.mrequests++;
    // one or two tasks
    for (let t = 0; t < 1 + (i % 2); t++) {
      await api('POST', '/api/maintenance/tasks', {
        token: admin.token,
        body: {
          maintenanceRequestId: mr.id, title: `Étape ${t + 1} — ${title}`,
          description: 'Diagnostic puis réparation.', orderIndex: t,
          assignedTo: staff.length ? pick(staff, i + t).id : undefined,
          estimatedMinutes: 45 + t * 30,
          status: status === 'COMPLETED' || status === 'VERIFIED' ? 'COMPLETED' : pick(['PENDING', 'IN_PROGRESS'], t),
        },
      });
      created.mtasks++;
    }
  }

  // 9) community events (dates must be in the future) + publish + participations
  const evTemplates = [
    ['Assemblée générale annuelle', 'MEETING', 3, 'Salle polyvalente'],
    ['Nettoyage collectif du jardin', 'SOCIAL', 10, 'Jardin intérieur'],
    ['Tournoi de foot inter-blocs', 'SPORTS', 18, 'Terrain extérieur'],
    ['Réunion travaux façade', 'MAINTENANCE', 25, 'Hall Bloc A'],
  ].slice(0, size.events);

  const events = [];
  for (let i = 0; i < evTemplates.length; i++) {
    const [title, category, inDays, location] = evTemplates[i];
    const start = daysFromNow(inDays);
    const end = new Date(start); end.setHours(end.getHours() + 2);
    const ev = await api('POST', '/api/community-events', {
      token: admin.token,
      body: {
        title, description: `${title}. Présence des résidents souhaitée.`,
        category, startDate: isoDateTime(start), endDate: isoDateTime(end),
        location, maxCapacity: 40, buildingId: pick(buildings, i).id,
      },
    });
    events.push(ev);
    created.events++;
    try { await api('PATCH', `/api/community-events/${ev.id}/publish`, { token: admin.token }); } catch { /* ok */ }
  }

  // participations: a handful of residents register for each published event
  for (const ev of events) {
    for (let i = 0; i < Math.min(6, residents.length); i++) {
      try {
        const r = residents[(i + events.indexOf(ev)) % residents.length];
        const rt = await login(r.email, r.password);
        await api('POST', '/api/event-participations', { token: rt.token, body: { eventId: ev.id } });
        created.participations++;
      } catch { /* capacity / dup — ignore */ }
    }
  }

  // 10) announcements
  const annTemplates = [
    ['Coupure d\'eau programmée', 'MAINTENANCE', 'HIGH', 'Une coupure d\'eau aura lieu mardi de 9h à 12h pour maintenance du surpresseur.', true, true],
    ['Nouveaux badges d\'accès', 'GENERAL', 'MEDIUM', 'Les nouveaux badges sont disponibles au bureau du syndic sur présentation d\'une pièce d\'identité.', false, false],
    ['Rappel : tri sélectif', 'GENERAL', 'LOW', 'Merci de respecter les bacs de tri au niveau du local poubelles.', false, false],
    ['Travaux ravalement façade', 'MAINTENANCE', 'MEDIUM', 'Le ravalement de la façade sud débutera le mois prochain, durée estimée 6 semaines.', false, true],
    ['Assemblée générale', 'EVENT_RELATED', 'HIGH', 'L\'AG annuelle se tiendra prochainement. Convocation officielle à venir par courrier.', true, false],
    ['Stationnement visiteurs', 'GENERAL', 'LOW', 'Les places visiteurs sont limitées à 24h. Tout abus sera signalé.', false, false],
  ].slice(0, size.announcements);

  for (const [title, type, priority, content, requiresAck, pinned] of annTemplates) {
    await api('POST', '/api/announcements', {
      token: admin.token,
      body: { title, content, type, priority, targetScope: 'ORGANIZATION', requiresAcknowledgement: requiresAck, pinned },
    });
    created.announcements++;
  }

  // 11) incidents (multipart) — reported by residents
  await seedIncidents(buildings, residents, size.incidents);

  return { admin, orgId, buildings, residents };
}

// ─── main ────────────────────────────────────────────────────────────────────
let platformAdmin;

(async () => {
  console.log(`\nCLOUD4SAYA demo seeder → ${BASE}\n`);

  // health check
  try { await fetch(BASE + '/api/health').catch(() => fetch(BASE + '/auth/login', { method: 'OPTIONS' })); }
  catch { console.error('Backend not reachable on ' + BASE + '. Start it first (npm run dev:backend).'); process.exit(1); }

  // platform admin (idempotent seed endpoint) + technician seed
  await api('POST', '/auth/seed-admin').catch(() => {});
  await api('POST', '/auth/seed-tech').catch(() => {});
  platformAdmin = await login('admin1@syndiqa.com', 'password123')
    .catch(() => { throw new Error('Cannot log in as platform admin (admin1@syndiqa.com / password123).'); });
  step(`platform admin ready (${platformAdmin.accountId})`);

  console.log('\n▸ Organization 1 — Résidence El Manar (Tunis)');
  await seedOrg({
    orgName: 'Résidence El Manar', orgCity: 'Tunis', orgAddress: '14 Avenue Habib Bourguiba, El Manar 2092',
    adminEmail: 'admin@elmanar.demo', adminPassword: 'Syndic123!',
    size: { buildings: 3, floorsWithFlats: 4, flatsPerFloor: 2, residents: 14, staff: 4,
      maintenance: 8, events: 4, announcements: 6, incidents: 5 },
  });

  console.log('\n▸ Organization 2 — Carthage Résidences (Sousse)');
  await seedOrg({
    orgName: 'Carthage Résidences', orgCity: 'Sousse', orgAddress: '3 Rue de la Corniche, Sousse 4000',
    adminEmail: 'admin@carthage.demo', adminPassword: 'Syndic123!',
    size: { buildings: 2, floorsWithFlats: 3, flatsPerFloor: 2, residents: 7, staff: 2,
      maintenance: 4, events: 2, announcements: 4, incidents: 2 },
  });

  console.log('\n▸ Gamification & solar-energy demo (/dev/seed-engagement-demo)');
  try { const r = await api('POST', '/dev/seed-engagement-demo'); step(r.message || 'seeded'); }
  catch (e) { step('skipped: ' + e.message.slice(0, 120)); }

  console.log('\n─────────────────────────────────────────────');
  console.log(' Created:', JSON.stringify(created, null, 0).replace(/[{}"]/g, '').replace(/,/g, '  '));
  console.log('─────────────────────────────────────────────');
  console.log('\n Demo logins (password shown):');
  console.log('   Platform admin   admin1@syndiqa.com     password123');
  console.log('   Syndic (El Manar) admin@elmanar.demo    Syndic123!');
  console.log('   Syndic (Carthage) admin@carthage.demo   Syndic123!');
  console.log('   Any resident      <name>.<surname>N@residenceelmanar.demo   Resident123!');
  console.log('   Any technician    tech.<surname>N@residenceelmanar.demo     Staff123!');
  console.log('   (also kept)       dev.test@example.com   password123\n');
})().catch((e) => { console.error('\n✗ Seeder failed:', e.message, '\n'); process.exit(1); });
