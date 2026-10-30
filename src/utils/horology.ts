export type WatchModelId = 'tourbillon-souverain' | 'chronographe-astral' | 'squelette-royal';
export type CaseFinishId = 'rose-gold' | 'platinum-950' | 'grade5-titanium' | 'yellow-gold';
export type CameraPresetId = 'scroll-sync' | 'dial-front' | 'calibre-exploded' | 'tourbillon-macro' | 'crown-profile';
export type CalibreLayerId = 'all' | 'crystal' | 'hands-dial' | 'tourbillon' | 'geartrain' | 'mainplate-case';

export interface WatchModelSpec {
  id: WatchModelId;
  referenceCode: string;
  name: string;
  subtitle: string;
  calibreName: string;
  basePriceChf: number;
  frequencyVph: number;
  frequencyHz: number;
  jewels: number;
  componentsCount: number;
  powerReserveHours: number;
  caseDiameterMm: number;
  caseThicknessMm: number;
  waterResistanceBar: number;
  dialStyle: 'guilloche' | 'chronograph' | 'skeleton';
  dialColorHex: string;
  subdialAccentHex: string;
  editionNotice: string;
  description: string;
  imageUrl: string;
  defaultFinish: CaseFinishId;
}

export interface CaseFinishSpec {
  id: CaseFinishId;
  name: string;
  shortName: string;
  alloyCode: string;
  colorHex: string;
  secondaryHex: string;
  metalness: number;
  roughness: number;
  anisotropy: number;
  priceDeltaChf: number;
  strapColorHex: string;
  strapName: string;
}

export interface CalibreLayerSpec {
  id: Exclude<CalibreLayerId, 'all'>;
  indexNumber: string;
  name: string;
  frenchTerm: string;
  materialSpec: string;
  toleranceMicrons: number;
  partCount: number;
  summary: string;
  recommendedExplode: number;
  cameraPreset: CameraPresetId;
}

export interface ScrollChoreographyState {
  activeChapter: number;
  chapterProgress: number;
  cameraAzimuth: number;
  cameraPolar: number;
  cameraDistance: number;
  watchRotationX: number;
  watchRotationY: number;
  watchRotationZ: number;
  targetExplode: number;
  watchOffsetX: number;
  watchOffsetY: number;
}

export interface LayerAxialOffsets {
  crystalZ: number;
  handsZ: number;
  dialZ: number;
  tourbillonZ: number;
  geartrainZ: number;
  mainplateZ: number;
  casebackZ: number;
  bezelZ: number;
}

export interface VaultItem {
  id: string;
  modelId: WatchModelId;
  finishId: CaseFinishId;
  engravingText: string;
  quantity: number;
  unitPriceChf: number;
}

export interface CommissionFormInput {
  fullName: string;
  email: string;
  phone: string;
  salonCity: string;
  notes: string;
}

export const WATCH_MODELS: WatchModelSpec[] = [
  {
    id: 'tourbillon-souverain',
    referenceCode: 'REF. 940.18R',
    name: 'Tourbillon Souverain',
    subtitle: 'One-Minute Flying Tourbillon with Hand-Engine-Turned Clous de Paris Dial',
    calibreName: 'Calibre AG-940 Manufacture',
    basePriceChf: 148000,
    frequencyVph: 21600,
    frequencyHz: 3.0,
    jewels: 33,
    componentsCount: 386,
    powerReserveHours: 72,
    caseDiameterMm: 40.5,
    caseThicknessMm: 9.8,
    waterResistanceBar: 3,
    dialStyle: 'guilloche',
    dialColorHex: '#1D1E22',
    subdialAccentHex: '#C89D66',
    editionNotice: 'Limited Production · 25 Pieces Annually',
    description:
      'Anchored by a 0.42-gram titanium flying tourbillon carriage at six o’clock, the Tourbillon Souverain balances gravitational rate deviations while showcasing hand-guilloché anthracite gold dial work.',
    imageUrl: '/src/assets/images/watch_tourbillon_macro_1793331451101.jpg',
    defaultFinish: 'rose-gold',
  },
  {
    id: 'chronographe-astral',
    referenceCode: 'REF. 812.95P',
    name: 'Chronographe Astral',
    subtitle: 'Column-Wheel Flyback Chronograph with Sidereal Tachymeter Scale',
    calibreName: 'Calibre AG-812 Rattrapante',
    basePriceChf: 116500,
    frequencyVph: 28800,
    frequencyHz: 4.0,
    jewels: 38,
    componentsCount: 412,
    powerReserveHours: 65,
    caseDiameterMm: 41.0,
    caseThicknessMm: 10.4,
    waterResistanceBar: 5,
    dialStyle: 'chronograph',
    dialColorHex: '#10213A',
    subdialAccentHex: '#E2E6EC',
    editionNotice: 'Numbered Edition · Geneva Hallmark',
    description:
      'Engineered with a horizontal clutch and polished steel column wheel, the Chronographe Astral pairs a deep PVD midnight blue sunray dial with contrasting silvered chronograph registers.',
    imageUrl: '/src/assets/images/watch_chronograph_platinum_1793331452290.jpg',
    defaultFinish: 'platinum-950',
  },
  {
    id: 'squelette-royal',
    referenceCode: 'REF. 705.T5',
    name: 'Squelette Royal',
    subtitle: 'Openworked Architectural Movement with 148 Hand-Chamfered Interior Angles',
    calibreName: 'Calibre AG-705 Squelette',
    basePriceChf: 164000,
    frequencyVph: 21600,
    frequencyHz: 3.0,
    jewels: 31,
    componentsCount: 342,
    powerReserveHours: 80,
    caseDiameterMm: 40.0,
    caseThicknessMm: 8.9,
    waterResistanceBar: 5,
    dialStyle: 'skeleton',
    dialColorHex: '#151619',
    subdialAccentHex: '#D4AF37',
    editionNotice: 'Atelier Allocation · Bespoke Order',
    description:
      'Every bridge of the Squelette Royal is pierced with a jeweler’s fretsaw and bevelled by hand with gentian wood, exposing the full kinetic transmission from twin mainspring barrels to the escapement.',
    imageUrl: '/src/assets/images/watch_skeleton_titanium_1793331452482.jpg',
    defaultFinish: 'grade5-titanium',
  },
];

export const CASE_FINISHES: CaseFinishSpec[] = [
  {
    id: 'rose-gold',
    name: '18K 5N Rose Gold',
    shortName: 'Rose Gold',
    alloyCode: 'Au750 · Cu205 · Ag45',
    colorHex: '#D99B72',
    secondaryHex: '#F3C6A4',
    metalness: 0.94,
    roughness: 0.16,
    anisotropy: 0.75,
    priceDeltaChf: 0,
    strapColorHex: '#261813',
    strapName: 'Hand-Stitched Bark Brown Mississippiensis Alligator',
  },
  {
    id: 'platinum-950',
    name: '950 Platinum',
    shortName: '950 Platinum',
    alloyCode: 'Pt950 · Ru50',
    colorHex: '#DCE1E7',
    secondaryHex: '#F4F7FA',
    metalness: 0.96,
    roughness: 0.12,
    anisotropy: 0.85,
    priceDeltaChf: 14500,
    strapColorHex: '#131B28',
    strapName: 'Abyssal Navy Matte Alligator & Platinum Folding Clasp',
  },
  {
    id: 'grade5-titanium',
    name: 'Grade 5 Brushed Titanium',
    shortName: 'Grade 5 Titanium',
    alloyCode: 'Ti6Al4V · Micro-Satin',
    colorHex: '#9BA2AB',
    secondaryHex: '#C2C8D0',
    metalness: 0.88,
    roughness: 0.24,
    anisotropy: 0.9,
    priceDeltaChf: -6000,
    strapColorHex: '#1C1E22',
    strapName: 'Integrated Grade 5 Titanium Bracelet with Micro-Link',
  },
  {
    id: 'yellow-gold',
    name: '18K 3N Yellow Gold',
    shortName: 'Yellow Gold',
    alloyCode: 'Au750 · Ag125 · Cu125',
    colorHex: '#DFB75B',
    secondaryHex: '#F7E09E',
    metalness: 0.95,
    roughness: 0.15,
    anisotropy: 0.75,
    priceDeltaChf: 2500,
    strapColorHex: '#171512',
    strapName: 'Obsidian Black Glazed Alligator with 18K Ardillon Buckle',
  },
];

export const CALIBRE_LAYERS: CalibreLayerSpec[] = [
  {
    id: 'crystal',
    indexNumber: '01',
    name: 'Domed Sapphire Crystal & Fluted Bezel',
    frenchTerm: 'Glace Saphir Bombée',
    materialSpec: 'Corundum Al₂O₃ · 1,800 Vickers Hardness',
    toleranceMicrons: 1.5,
    partCount: 4,
    summary:
      'Machined from a single boules of synthetic corundum and treated with seven layers of internal and external anti-reflective vapor deposition.',
    recommendedExplode: 0.85,
    cameraPreset: 'calibre-exploded',
  },
  {
    id: 'hands-dial',
    indexNumber: '02',
    name: 'Guilloché Dial & Faceted Dauphine Hands',
    frenchTerm: 'Cadran Guilloché Main & Aiguilles',
    materialSpec: 'Solid 18K Gold Blank · Diamond-Cut Facets',
    toleranceMicrons: 2.0,
    partCount: 19,
    summary:
      'Engine-turned on a 19th-century rose engine lathe by a single master artisan over 18 hours, paired with diamond-polished Dauphine hands.',
    recommendedExplode: 0.75,
    cameraPreset: 'dial-front',
  },
  {
    id: 'tourbillon',
    indexNumber: '03',
    name: 'One-Minute Flying Tourbillon & Balance Assembly',
    frenchTerm: 'Cage de Tourbillon Volant',
    materialSpec: 'Grade 5 Titanium Carriage · Free-Sprung Breguet Overcoil',
    toleranceMicrons: 0.5,
    partCount: 78,
    summary:
      'Rotating 360 degrees every 60 seconds on a ceramic ball bearing without an upper bridge, neutralizing positional gravity errors.',
    recommendedExplode: 0.55,
    cameraPreset: 'tourbillon-macro',
  },
  {
    id: 'geartrain',
    indexNumber: '04',
    name: 'Going Train Wheels, Skeleton Bridges & Ruby Jewels',
    frenchTerm: 'Rouage de Finissage & Ponts Anglés',
    materialSpec: 'CuBe2 Beryllium Bronze Gears · 33 Synthetic Rubies',
    toleranceMicrons: 0.8,
    partCount: 164,
    summary:
      'Involute tooth profiles minimize torque loss between the center, third, and fourth wheels, supported by hand-bevelled German silver bridges.',
    recommendedExplode: 0.92,
    cameraPreset: 'calibre-exploded',
  },
  {
    id: 'mainplate-case',
    indexNumber: '05',
    name: 'Perlage Mainplate, Twin Barrels & Case Architecture',
    frenchTerm: 'Platine Perlée & Double Barillet',
    materialSpec: 'Maillechort German Silver · Nivaflex Mainsprings',
    toleranceMicrons: 1.2,
    partCount: 121,
    summary:
      'Coaxial twin barrels deliver a constant 72-hour torque curve, housed inside a three-part water-resistant case with double-sealed knurled crown.',
    recommendedExplode: 1.0,
    cameraPreset: 'crown-profile',
  },
];

export function getWatchModelById(id: WatchModelId): WatchModelSpec {
  return WATCH_MODELS.find((m) => m.id === id) ?? WATCH_MODELS[0];
}

export function getCaseFinishById(id: CaseFinishId): CaseFinishSpec {
  return CASE_FINISHES.find((f) => f.id === id) ?? CASE_FINISHES[0];
}

export function calculateConfiguredPrice(modelId: WatchModelId, finishId: CaseFinishId): number {
  const model = getWatchModelById(modelId);
  const finish = getCaseFinishById(finishId);
  return Math.max(0, model.basePriceChf + finish.priceDeltaChf);
}

export function formatChfPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `CHF ${rounded.toLocaleString('en-US')}`;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep01(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * Maps normalized document scroll progress [0..1] into smooth 3D camera,
 * rotation, position, and exploded-view keyframes across 4 chapters.
 */
export function computeScrollChoreography(scrollProgress: number): ScrollChoreographyState {
  const p = clamp01(scrollProgress);

  const keyframes = [
    // Chapter 0: Hero Showcase (Front three-quarter presentation on right side, assembled)
    {
      azimuth: 0.0,
      polar: 1.52,
      distance: 7.4,
      rotX: -0.18,
      rotY: -0.32,
      rotZ: 0.05,
      explode: 0.0,
      offsetX: 1.45,
      offsetY: 0.12,
    },
    // Chapter 1: Exploded Calibre Anatomy (True 62-degree oblique side profile on left stage, full axial explosion)
    {
      azimuth: 0.0,
      polar: 1.48,
      distance: 8.2,
      rotX: -0.28,
      rotY: 1.08,
      rotZ: -0.08,
      explode: 0.95,
      offsetX: -1.45,
      offsetY: 0.12,
    },
    // Chapter 2: Bespoke Atelier & Tourbillon Macro (Close dial & tourbillon inspection on right stage)
    {
      azimuth: 0.0,
      polar: 1.5,
      distance: 6.8,
      rotX: -0.15,
      rotY: -0.48,
      rotZ: 0.04,
      explode: 0.35,
      offsetX: 1.4,
      offsetY: 0.1,
    },
    // Chapter 3: Collection & Heritage (Balanced horological portrait, assembled)
    {
      azimuth: 0.0,
      polar: 1.52,
      distance: 7.6,
      rotX: -0.12,
      rotY: 0.28,
      rotZ: 0.0,
      explode: 0.0,
      offsetX: 0.0,
      offsetY: 0.1,
    },
  ];

  const totalSegments = keyframes.length - 1;
  const scaled = p * totalSegments;
  const segmentIndex = Math.min(totalSegments - 1, Math.floor(scaled));
  const localT = smoothstep01(scaled - segmentIndex);

  const k0 = keyframes[segmentIndex];
  const k1 = keyframes[segmentIndex + 1];

  return {
    activeChapter: Math.min(keyframes.length - 1, Math.round(scaled)),
    chapterProgress: localT,
    cameraAzimuth: lerp(k0.azimuth, k1.azimuth, localT),
    cameraPolar: lerp(k0.polar, k1.polar, localT),
    cameraDistance: lerp(k0.distance, k1.distance, localT),
    watchRotationX: lerp(k0.rotX, k1.rotX, localT),
    watchRotationY: lerp(k0.rotY, k1.rotY, localT),
    watchRotationZ: lerp(k0.rotZ, k1.rotZ, localT),
    targetExplode: lerp(k0.explode, k1.explode, localT),
    watchOffsetX: lerp(k0.offsetX, k1.offsetX, localT),
    watchOffsetY: lerp(k0.offsetY, k1.offsetY, localT),
  };
}

/**
 * Computes exact Z-axis separation offsets for the 8 watch component groups
 * given an explodeFactor in [0..1]. At explodeFactor = 0, all layers sit at
 * their true assembled mechanical depth without protruding through the dial.
 */
export function computeLayerOffsets(explodeFactor: number): LayerAxialOffsets {
  const e = clamp01(explodeFactor);
  return {
    crystalZ: 0.26 + e * 2.25,
    bezelZ: 0.19 + e * 1.55,
    handsZ: 0.15 + e * 1.05,
    dialZ: 0.09 + e * 0.55,
    tourbillonZ: 0.02 + e * 0.05,
    geartrainZ: -0.09 - e * 0.55,
    mainplateZ: -0.18 - e * 1.15,
    casebackZ: -0.26 - e * 1.85,
  };
}

/**
 * Computes rotation angles (in radians) for the watch's mechanical hands,
 * tourbillon carriage, and balance wheel oscillation.
 */
export function calculateWatchKinematics(elapsedSeconds: number, speedMultiplier: number) {
  const safeSpeed = Math.max(0, speedMultiplier);
  const t = elapsedSeconds * safeSpeed;

  // Tourbillon completes 1 full revolution every 60 seconds (clockwise = negative Z in right-hand coords)
  const tourbillonAngle = -((t % 60) / 60) * Math.PI * 2 || 0;

  // Balance wheel oscillates at 3 Hz (6 beats per second) with ±240 deg amplitude
  const balanceOscillation = Math.sin(t * Math.PI * 2 * 3.0) * 1.35 || 0;

  // Second / chronograph hand: 1 revolution per 60s
  const secondHandAngle = -((t % 60) / 60) * Math.PI * 2 || 0;

  // Minute hand: offset at 10:10 aesthetic base + progression
  const baseMinutes = 10.25 + t / 60;
  const minuteHandAngle = -((baseMinutes % 60) / 60) * Math.PI * 2;

  // Hour hand: offset at 10 hours + 10 minutes base + progression
  const baseHours = 10 + baseMinutes / 60;
  const hourHandAngle = -((baseHours % 12) / 12) * Math.PI * 2;

  return {
    tourbillonAngle,
    balanceOscillation,
    secondHandAngle,
    minuteHandAngle,
    hourHandAngle,
  };
}

export function validateEngravingText(text: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length > 24) {
    return {
      valid: false,
      sanitized: trimmed.slice(0, 24),
      error: 'Caseback engraving cannot exceed 24 characters.',
    };
  }
  return { valid: true, sanitized: trimmed };
}

export function calculateVaultSummary(items: VaultItem[]) {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalChf = items.reduce((acc, item) => acc + item.unitPriceChf * item.quantity, 0);
  const armoredLogisticsChf = subtotalChf > 0 ? 0 : 0; // Complimentary Ferrari Group armored courier included
  return {
    totalQuantity,
    subtotalChf,
    armoredLogisticsChf,
    totalChf: subtotalChf + armoredLogisticsChf,
  };
}

export function validateCommissionForm(input: CommissionFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name for the provenance dossier.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.email = 'Please provide a valid private email address.';
  }
  if (!input.phone || input.phone.trim().length < 6) {
    errors.phone = 'Please enter a direct telephone number for concierge verification.';
  }
  if (!input.salonCity || input.salonCity.trim().length === 0) {
    errors.salonCity = 'Please select your preferred private salon or delivery vault.';
  }
  return errors;
}
