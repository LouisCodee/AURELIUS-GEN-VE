import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  WatchModelId,
  CaseFinishId,
  CameraPresetId,
  CalibreLayerId,
  getWatchModelById,
  getCaseFinishById,
  computeScrollChoreography,
  computeLayerOffsets,
  calculateWatchKinematics,
} from '../utils/horology';

interface WatchCanvas3DProps {
  modelId: WatchModelId;
  finishId: CaseFinishId;
  cameraPreset: CameraPresetId;
  manualExplode: number | null;
  selectedLayer: CalibreLayerId;
  speedMultiplier: number;
  scrollProgress: number;
  onSelectLayer?: (layer: CalibreLayerId) => void;
  onExplodeChange?: (val: number) => void;
}

// Reusable scratch vectors at module scope (zero GC inside animation loop)
const _targetCamPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();

function createToothedGearGeometry(
  innerRadius: number,
  outerRadius: number,
  teethCount: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teethCount;
  const toothHalf = step * 0.24;

  for (let i = 0; i < teethCount; i++) {
    const baseAngle = i * step;
    const a1 = baseAngle - toothHalf * 1.3;
    const a2 = baseAngle - toothHalf * 0.75;
    const a3 = baseAngle + toothHalf * 0.75;
    const a4 = baseAngle + toothHalf * 1.3;

    const rRoot = outerRadius * 0.87;
    if (i === 0) {
      shape.moveTo(Math.cos(a1) * rRoot, Math.sin(a1) * rRoot);
    } else {
      shape.lineTo(Math.cos(a1) * rRoot, Math.sin(a1) * rRoot);
    }
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * rRoot, Math.sin(a4) * rRoot);
  }
  shape.closePath();

  if (innerRadius > 0.04) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: thickness * 0.18,
    bevelThickness: thickness * 0.18,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

function createDialCanvasTexture(
  dialStyle: 'guilloche' | 'chronograph' | 'skeleton',
  dialHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const cx = 512;
  const cy = 512;

  ctx.clearRect(0, 0, 1024, 1024);

  // Outer dial background
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 495);
  grad.addColorStop(0, dialHex);
  grad.addColorStop(0.75, dialHex);
  grad.addColorStop(1, '#090A0D');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 500, 0, Math.PI * 2);
  ctx.fill();

  // Guilloche or Sunray pattern
  if (dialStyle === 'guilloche') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.lineWidth = 1.25;
    for (let r = 55; r < 370; r += 8) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.03) {
        const wave = Math.sin(a * 36) * 2.2 + Math.cos(a * 18) * 1.2;
        const x = cx + Math.cos(a) * (r + wave);
        const y = cy + Math.sin(a) * (r + wave);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (dialStyle === 'chronograph') {
    // Sunray metallic brushing + dual subdials
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 485, cy + Math.sin(rad) * 485);
      ctx.stroke();
    }
    // Left and right chronograph sub-registers
    const drawSubdial = (sx: number, sy: number, label: string) => {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.78)';
      ctx.beginPath();
      ctx.arc(sx, sy, 108, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      for (let t = 0; t < 12; t++) {
        const a = (t * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 88, sy + Math.sin(a) * 88);
        ctx.lineTo(sx + Math.cos(a) * 102, sy + Math.sin(a) * 102);
        ctx.stroke();
      }
      ctx.fillStyle = accentHex;
      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, sx, sy + 52);
    };
    drawSubdial(cx - 175, cy, '30 MIN');
    drawSubdial(cx + 175, cy, '60 SEC');
  } else {
    // Skeleton chapter ring architectural frame
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160);
      ctx.lineTo(cx + Math.cos(a) * 420, cy + Math.sin(a) * 420);
      ctx.stroke();
    }
  }

  // Outer precision railway minute & 1/5th second track
  ctx.strokeStyle = 'rgba(244, 241, 234, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 465, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 442, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 300; i++) {
    const a = (i * Math.PI * 2) / 300;
    const isHour = i % 25 === 0;
    const isMinute = i % 5 === 0;
    const innerR = isHour ? 434 : isMinute ? 442 : 450;
    ctx.strokeStyle = isHour ? accentHex : 'rgba(244, 241, 234, 0.48)';
    ctx.lineWidth = isHour ? 3.2 : isMinute ? 1.8 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * 465, cy + Math.sin(a) * 465);
    ctx.stroke();
  }

  // Maison Branding at 12 o'clock
  ctx.fillStyle = '#F4F1EA';
  ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('AURELIUS', cx, 260);
  ctx.fillStyle = accentHex;
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GENÈVE · MANUFACTURE', cx, 292);
  ctx.fillStyle = 'rgba(244, 241, 234, 0.55)';
  ctx.font = '400 15px "JetBrains Mono", monospace';
  ctx.fillText('SWISS MADE', cx, 945);

  // Tourbillon frame ring at 6 o'clock (in canvas Y, 6 o'clock is cy + 195)
  const tY = cy + 195;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, tY, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // If skeleton style, also cut out upper architectural windows so gear train shines through
  if (dialStyle === 'skeleton') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy - 35, 225, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Metallic chapter ring around tourbillon aperture
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, tY, 130, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createPerlageMainplateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2B2D34';
  ctx.fillRect(0, 0, 512, 512);

  // Overlapping circular perlage engine-turning pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.4;
  for (let y = 16; y < 512; y += 24) {
    for (let x = 16; x < 512; x += 24) {
      for (let r = 4; r <= 14; r += 4) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const WatchCanvas3D: React.FC<WatchCanvas3DProps> = ({
  modelId,
  finishId,
  cameraPreset,
  manualExplode,
  selectedLayer,
  speedMultiplier,
  scrollProgress,
  onSelectLayer,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Mutable ref state so React prop updates never tear down the WebGLRenderer
  const stateRef = useRef({
    modelId,
    finishId,
    cameraPreset,
    manualExplode,
    selectedLayer,
    speedMultiplier,
    scrollProgress,
    onSelectLayer,
  });

  useEffect(() => {
    stateRef.current = {
      modelId,
      finishId,
      cameraPreset,
      manualExplode,
      selectedLayer,
      speedMultiplier,
      scrollProgress,
      onSelectLayer,
    };
  }, [modelId, finishId, cameraPreset, manualExplode, selectedLayer, speedMultiplier, scrollProgress, onSelectLayer]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.045);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(1.5, 0.8, 6.4);

    // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced 3-Point Horological Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbe6ff, 0x1c1612, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.4);
    keyLight.position.set(5, 7, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9ab4ff, 1.1);
    fillLight.position.set(-6, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf6d39c, 1.85);
    rimLight.position.set(0, -5, -6);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxTop = new THREE.RectAreaLight(0xfff8ee, 3.5, 5, 3);
      softboxTop.position.set(0, 5, 3);
      softboxTop.lookAt(0, 0, 0);
      scene.add(softboxTop);
    }

    // 4. Shared PBR Materials
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const initialModel = getWatchModelById(stateRef.current.modelId);
    const initialFinish = getCaseFinishById(stateRef.current.finishId);

    const caseMetalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialFinish.colorHex),
      metalness: initialFinish.metalness,
      roughness: initialFinish.roughness,
      anisotropy: initialFinish.anisotropy,
      anisotropyRotation: 0.4,
      clearcoat: 0.25,
      clearcoatRoughness: 0.15,
    });

    const polishedBezelMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialFinish.secondaryHex),
      metalness: Math.min(1, initialFinish.metalness + 0.04),
      roughness: Math.max(0.06, initialFinish.roughness - 0.08),
      clearcoat: 0.4,
    });

    const strapMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialFinish.strapColorHex),
      roughness: 0.62,
      metalness: 0.12,
    });

    const brassGearMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd6a84f),
      metalness: 0.94,
      roughness: 0.18,
      anisotropy: 0.6,
    });

    const bridgeSteelMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x9ca3af),
      metalness: 0.9,
      roughness: 0.24,
      anisotropy: 0.75,
    });

    const bluedSteelMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1d4ed8),
      metalness: 0.92,
      roughness: 0.12,
      clearcoat: 0.6,
    });

    const rubyJewelMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe11d48),
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    });

    const perlageTex = createPerlageMainplateTexture(maxAniso);
    const mainplateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: perlageTex,
      metalness: 0.85,
      roughness: 0.28,
    });

    let currentDialTex = createDialCanvasTexture(
      initialModel.dialStyle,
      initialModel.dialColorHex,
      initialModel.subdialAccentHex,
      maxAniso
    );
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: currentDialTex,
      roughness: 0.32,
      metalness: 0.45,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0,
      roughness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.93,
      transparent: true,
      opacity: isSoftwareGl ? 0.2 : 1.0,
      ior: 1.77,
      thickness: 0.35,
      clearcoat: 1.0,
      depthWrite: false,
    });

    // 5. Composite 7-Layer Procedural Watch Hierarchy (THREE.Group)
    const watchRoot = new THREE.Group();
    watchRoot.scale.setScalar(0.72);
    scene.add(watchRoot);

    const caseAndStrapsGroup = new THREE.Group();
    const bezelGroup = new THREE.Group();
    const casebackGroup = new THREE.Group();
    const mainplateGroup = new THREE.Group();
    const geartrainGroup = new THREE.Group();
    const tourbillonGroup = new THREE.Group();
    const dialGroup = new THREE.Group();
    const handsGroup = new THREE.Group();
    const crystalGroup = new THREE.Group();

    watchRoot.add(
      caseAndStrapsGroup,
      bezelGroup,
      casebackGroup,
      mainplateGroup,
      geartrainGroup,
      tourbillonGroup,
      dialGroup,
      handsGroup,
      crystalGroup
    );

    // Layer A: Outer Case Middle, Sculpted Lugs, Knurled Crown, Pushers & Curved Straps
    const caseMiddleGeo = new THREE.CylinderGeometry(2.12, 2.08, 0.44, 64, 1, true);
    caseMiddleGeo.rotateX(Math.PI / 2);
    const caseMiddleMesh = new THREE.Mesh(caseMiddleGeo, caseMetalMat);
    caseMiddleMesh.castShadow = !isSoftwareGl;
    caseAndStrapsGroup.add(caseMiddleMesh);

    const innerCaseRingGeo = new THREE.RingGeometry(1.88, 2.12, 64);
    const innerCaseRing = new THREE.Mesh(innerCaseRingGeo, caseMetalMat);
    caseAndStrapsGroup.add(innerCaseRing);

    // 4 Sculpted Curved Lugs
    const lugGeo = new THREE.BoxGeometry(0.28, 0.65, 0.32);
    const lugPositions: [number, number, number, number][] = [
      [-1.18, 2.12, -0.04, 0.14],
      [1.18, 2.12, -0.04, -0.14],
      [-1.18, -2.12, -0.04, -0.14],
      [1.18, -2.12, -0.04, 0.14],
    ];
    lugPositions.forEach(([lx, ly, lz, rotZ]) => {
      const lug = new THREE.Mesh(lugGeo, caseMetalMat);
      lug.position.set(lx, ly, lz);
      lug.rotation.z = rotZ;
      lug.rotation.x = ly > 0 ? -0.22 : 0.22;
      caseAndStrapsGroup.add(lug);
    });

    // Knurled Winding Crown at 3 o'clock (+X)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(2.26, 0, 0);
    const crownStem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.25, 20), polishedBezelMat);
    crownStem.rotation.z = Math.PI / 2;
    crownGroup.add(crownStem);
    const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 28), polishedBezelMat);
    crownBody.rotation.z = Math.PI / 2;
    crownBody.position.x = 0.12;
    crownGroup.add(crownBody);
    caseAndStrapsGroup.add(crownGroup);

    // Chronograph Pushers at 2 o'clock and 4 o'clock
    [0.52, -0.52].forEach((angle) => {
      const pusher = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.26, 20), polishedBezelMat);
      pusher.position.set(Math.cos(angle) * 2.22, Math.sin(angle) * 2.22, 0);
      pusher.rotation.z = angle - Math.PI / 2;
      caseAndStrapsGroup.add(pusher);
    });

    // Articulated Top & Bottom Watch Straps (5 curved segments each)
    for (let dir of [1, -1]) {
      for (let seg = 0; seg < 5; seg++) {
        const segGeo = new THREE.BoxGeometry(1.78 - seg * 0.06, 0.36, 0.16);
        const segMesh = new THREE.Mesh(segGeo, strapMat);
        const dist = 2.28 + seg * 0.38;
        const dropZ = -0.06 - Math.pow(seg, 1.45) * 0.08;
        segMesh.position.set(0, dir * dist, dropZ);
        segMesh.rotation.x = dir * (0.12 + seg * 0.11);
        caseAndStrapsGroup.add(segMesh);
      }
    }

    // Layer B: Stepped & Fluted Bezel (`LatheGeometry`)
    const bezelPoints = [
      new THREE.Vector2(1.82, 0.12),
      new THREE.Vector2(1.92, 0.14),
      new THREE.Vector2(2.06, 0.04),
      new THREE.Vector2(2.12, -0.02),
      new THREE.Vector2(1.82, -0.02),
    ];
    const bezelLatheGeo = new THREE.LatheGeometry(bezelPoints, 64);
    bezelLatheGeo.rotateX(Math.PI / 2);
    const bezelMesh = new THREE.Mesh(bezelLatheGeo, polishedBezelMat);
    bezelGroup.add(bezelMesh);

    // Layer C: Exhibition Caseback Ring
    const casebackRingGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(1.75, -0.08),
        new THREE.Vector2(2.08, -0.08),
        new THREE.Vector2(2.02, 0.08),
        new THREE.Vector2(1.75, 0.08),
      ],
      64
    );
    casebackRingGeo.rotateX(Math.PI / 2);
    const casebackMesh = new THREE.Mesh(casebackRingGeo, caseMetalMat);
    casebackGroup.add(casebackMesh);

    // Layer D: Perlage Mainplate & Twin Mainspring Barrels
    const mainplateDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.06, 64), mainplateMat);
    mainplateDisc.rotation.x = Math.PI / 2;
    mainplateGroup.add(mainplateDisc);

    // Twin Mainspring Barrels at 11 and 1 o'clock
    const barrelGeo = createToothedGearGeometry(0.12, 0.56, 36, 0.06);
    [-0.68, 0.68].forEach((bx) => {
      const barrel = new THREE.Mesh(barrelGeo, brassGearMat);
      barrel.position.set(bx, 0.58, 0.04);
      mainplateGroup.add(barrel);
    });

    // Layer E: Going Train Wheels, Openworked Bridges & Instanced Ruby Jewels (strictly flush so they sit behind opaque dial when assembled)
    const centerWheel = new THREE.Mesh(createToothedGearGeometry(0.14, 0.62, 42, 0.04), brassGearMat);
    centerWheel.position.set(0, 0.1, -0.01);
    const thirdWheel = new THREE.Mesh(createToothedGearGeometry(0.08, 0.38, 28, 0.04), brassGearMat);
    thirdWheel.position.set(-0.55, -0.15, 0.0);
    const fourthWheel = new THREE.Mesh(createToothedGearGeometry(0.08, 0.34, 24, 0.04), brassGearMat);
    fourthWheel.position.set(0.55, -0.15, 0.0);
    geartrainGroup.add(centerWheel, thirdWheel, fourthWheel);

    // Architectural Skeleton Bridges (local z = 0.02 so geartrainZ (-0.09) + 0.02 = -0.07 < dialZ (0.09))
    const bridgeBarGeo = new THREE.BoxGeometry(2.5, 0.2, 0.035);
    const upperBridge = new THREE.Mesh(bridgeBarGeo, bridgeSteelMat);
    upperBridge.position.set(0, 0.58, 0.02);
    const centerBridge = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.16, 0.035), bridgeSteelMat);
    centerBridge.position.set(0, -0.15, 0.02);
    geartrainGroup.add(upperBridge, centerBridge);

    // Instanced Ruby Jewels & Blued Screws (24 instances)
    const jewelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
    jewelGeo.rotateX(Math.PI / 2);
    const jewelInstanced = new THREE.InstancedMesh(jewelGeo, rubyJewelMat, 24);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = i < 12 ? 1.42 : 0.72;
      _dummyPos.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.03);
      _dummyQuat.identity();
      _dummyScale.set(1, 1, 1);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      jewelInstanced.setMatrixAt(i, _dummyMatrix);
    }
    jewelInstanced.instanceMatrix.needsUpdate = true;
    jewelInstanced.computeBoundingSphere();
    geartrainGroup.add(jewelInstanced);

    // Layer F: Flying Tourbillon Cage & Oscillating Balance Wheel at 6 o'clock (y = -0.76)
    tourbillonGroup.position.set(0, -0.76, 0);
    const tourbillonCarriage = new THREE.Group();
    tourbillonGroup.add(tourbillonCarriage);

    const cageRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 16, 48), bridgeSteelMat);
    tourbillonCarriage.add(cageRing);

    for (let p = 0; p < 3; p++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.025), bridgeSteelMat);
      arm.rotation.z = (p * Math.PI) / 3;
      tourbillonCarriage.add(arm);
    }

    const balanceWheelGroup = new THREE.Group();
    const balanceRim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.024, 12, 36), brassGearMat);
    const balanceCrossbar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.032, 0.02), brassGearMat);
    balanceWheelGroup.add(balanceRim, balanceCrossbar);
    tourbillonCarriage.add(balanceWheelGroup);

    const tourbillonBridge = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.055, 0.03), polishedBezelMat);
    tourbillonBridge.position.set(0, 0, 0.04);
    tourbillonGroup.add(tourbillonBridge);

    // Layer G: Guilloché Dial & Applied Metallic Hour Indices (`InstancedMesh`)
    const dialPlateGeo = new THREE.CircleGeometry(1.86, 64);
    const dialMesh = new THREE.Mesh(dialPlateGeo, dialMat);
    dialGroup.add(dialMesh);

    const indexBatonGeo = new THREE.BoxGeometry(0.06, 0.22, 0.035);
    const indicesInstanced = new THREE.InstancedMesh(indexBatonGeo, polishedBezelMat, 12);
    for (let i = 0; i < 12; i++) {
      // Skip 6 o'clock index where the Tourbillon aperture sits
      if (i === 6) {
        _dummyScale.set(0.001, 0.001, 0.001);
      } else {
        _dummyScale.set(i === 0 ? 1.4 : 1.0, 1.0, 1.0);
      }
      const angle = Math.PI / 2 - (i * Math.PI) / 6;
      const r = 1.54;
      _dummyPos.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.02);
      _dummyQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle - Math.PI / 2);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      indicesInstanced.setMatrixAt(i, _dummyMatrix);
    }
    indicesInstanced.instanceMatrix.needsUpdate = true;
    indicesInstanced.computeBoundingSphere();
    dialGroup.add(indicesInstanced);

    // Layer H: Faceted Dauphine Hands (Hour, Minute, Blued Chronograph Second Hand)
    const createHandMesh = (length: number, width: number, mat: THREE.Material, zOffset: number) => {
      const pivot = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0, -length * 0.18);
      shape.lineTo(width, 0);
      shape.lineTo(0, length);
      shape.lineTo(-width, 0);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.018,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.007,
        bevelThickness: 0.007,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = zOffset;
      pivot.add(mesh);
      return pivot;
    };

    const hourHandPivot = createHandMesh(1.05, 0.075, polishedBezelMat, 0);
    const minuteHandPivot = createHandMesh(1.48, 0.055, polishedBezelMat, 0.025);
    const secondHandPivot = createHandMesh(1.56, 0.022, bluedSteelMat, 0.05);
    const centerPinion = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 24), polishedBezelMat);
    centerPinion.rotation.x = Math.PI / 2;
    centerPinion.position.z = 0.035;
    handsGroup.add(hourHandPivot, minuteHandPivot, secondHandPivot, centerPinion);

    // Layer I: Domed Anti-Reflective Sapphire Crystal (`LatheGeometry`, renderOrder 10)
    const crystalProfile = [
      new THREE.Vector2(0, 0.14),
      new THREE.Vector2(0.8, 0.13),
      new THREE.Vector2(1.45, 0.09),
      new THREE.Vector2(1.86, 0.0),
    ];
    const crystalDomeGeo = new THREE.LatheGeometry(crystalProfile, 64);
    crystalDomeGeo.rotateX(Math.PI / 2);
    const crystalMesh = new THREE.Mesh(crystalDomeGeo, crystalMat);
    crystalMesh.renderOrder = 10;
    crystalGroup.add(crystalMesh);

    // Subtle axial guide lines visible when exploded
    const guideLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -2.1),
      new THREE.Vector3(0, 0, 2.1),
    ]);
    const guideLineMat = new THREE.LineDashedMaterial({
      color: 0xc89d66,
      dashSize: 0.08,
      gapSize: 0.06,
      transparent: true,
      opacity: 0,
    });
    const axialGuideLine = new THREE.Line(guideLineGeo, guideLineMat);
    axialGuideLine.computeLineDistances();
    watchRoot.add(axialGuideLine);

    // 6. Contact Shadow Grounding Plane beneath watch
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.45;
    scene.add(shadowPlane);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Interactive Pointer Drag & Raycasting Setup
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let userDragRotY = 0;
    let userDragRotX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      userDragRotY += dx * 0.007;
      userDragRotX = THREE.MathUtils.clamp(userDragRotX + dy * 0.006, -0.85, 0.85);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Track last model/finish so we only regenerate textures or update materials when changed
    let appliedModelId = stateRef.current.modelId;
    let appliedFinishId = stateRef.current.finishId;

    // Smoothed state variables
    let currentExplode = 0;
    let currentCamAzimuth = 0.26;
    let currentCamPolar = 1.4;
    let currentCamDist = 7.2;
    let currentWatchRotX = -0.16;
    let currentWatchRotY = -0.34;
    let currentWatchRotZ = 0.05;
    let currentOffsetX = 1.45;
    let currentOffsetY = 0.12;

    const clock = new THREE.Clock();
    let accumulatedSimTime = 0;
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      // Check for model / dial change
      if (s.modelId !== appliedModelId) {
        appliedModelId = s.modelId;
        const spec = getWatchModelById(s.modelId);
        const nextTex = createDialCanvasTexture(spec.dialStyle, spec.dialColorHex, spec.subdialAccentHex, maxAniso);
        currentDialTex.dispose();
        currentDialTex = nextTex;
        dialMat.map = currentDialTex;
        dialMat.needsUpdate = true;
      }

      // Check for case finish change
      if (s.finishId !== appliedFinishId) {
        appliedFinishId = s.finishId;
        const fin = getCaseFinishById(s.finishId);
        caseMetalMat.color.set(fin.colorHex);
        caseMetalMat.metalness = fin.metalness;
        caseMetalMat.roughness = fin.roughness;
        caseMetalMat.anisotropy = fin.anisotropy;
        polishedBezelMat.color.set(fin.secondaryHex);
        strapMat.color.set(fin.strapColorHex);
      }

      // Determine target camera & explode from scroll choreography or active preset
      const scrollChoreo = computeScrollChoreography(s.scrollProgress);
      let targetAzimuth = scrollChoreo.cameraAzimuth;
      let targetPolar = scrollChoreo.cameraPolar;
      let targetDist = scrollChoreo.cameraDistance;
      let targetRotX = scrollChoreo.watchRotationX;
      let targetRotY = scrollChoreo.watchRotationY;
      let targetRotZ = scrollChoreo.watchRotationZ;
      let targetExplode = s.manualExplode !== null ? s.manualExplode : scrollChoreo.targetExplode;
      let targetOffsetX = window.innerWidth < 1024 ? 0 : scrollChoreo.watchOffsetX;
      let targetOffsetY = scrollChoreo.watchOffsetY;

      // When user manually explodes the watch while in scroll-sync, tilt into an oblique 3/4 view so axial separation is clearly showcased
      if (s.manualExplode !== null && s.manualExplode > 0.25 && s.cameraPreset === 'scroll-sync') {
        targetRotY = THREE.MathUtils.lerp(targetRotY, 1.05, s.manualExplode);
        targetRotX = THREE.MathUtils.lerp(targetRotX, -0.28, s.manualExplode);
        targetDist = THREE.MathUtils.lerp(targetDist, 8.2, s.manualExplode);
      }

      if (s.cameraPreset === 'dial-front') {
        targetAzimuth = 0.0;
        targetPolar = Math.PI / 2;
        targetDist = 6.8;
        targetRotX = 0.0;
        targetRotY = 0.0;
        targetRotZ = 0.0;
        targetOffsetX = 0.0;
      } else if (s.cameraPreset === 'calibre-exploded') {
        targetAzimuth = 0.0;
        targetPolar = 1.48;
        targetDist = 8.2;
        targetRotX = -0.28;
        targetRotY = 1.08;
        targetRotZ = -0.08;
        if (s.manualExplode === null) targetExplode = 0.95;
      } else if (s.cameraPreset === 'tourbillon-macro') {
        targetAzimuth = 0.0;
        targetPolar = 1.48;
        targetDist = 5.2;
        targetRotX = -0.12;
        targetRotY = -0.22;
        targetRotZ = 0.0;
        targetOffsetY = 0.45;
      } else if (s.cameraPreset === 'crown-profile') {
        targetAzimuth = 0.0;
        targetPolar = 1.5;
        targetDist = 6.8;
        targetRotX = -0.1;
        targetRotY = -1.22;
        targetRotZ = 0.0;
      }

      // Decay user manual drag slowly when scrolling
      if (!isDragging) {
        userDragRotX = THREE.MathUtils.damp(userDragRotX, 0, 2.5, dt);
        userDragRotY = THREE.MathUtils.damp(userDragRotY, 0, 2.5, dt);
      }

      // Exponential damping for silky-smooth camera & layer kinematics
      const dampLambda = 6.5;
      currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, dampLambda, dt);
      currentCamAzimuth = THREE.MathUtils.damp(currentCamAzimuth, targetAzimuth, dampLambda, dt);
      currentCamPolar = THREE.MathUtils.damp(currentCamPolar, targetPolar, dampLambda, dt);
      currentCamDist = THREE.MathUtils.damp(currentCamDist, targetDist, dampLambda, dt);
      currentWatchRotX = THREE.MathUtils.damp(currentWatchRotX, targetRotX + userDragRotX, dampLambda, dt);
      currentWatchRotY = THREE.MathUtils.damp(currentWatchRotY, targetRotY + userDragRotY, dampLambda, dt);
      currentWatchRotZ = THREE.MathUtils.damp(currentWatchRotZ, targetRotZ, dampLambda, dt);
      currentOffsetX = THREE.MathUtils.damp(currentOffsetX, targetOffsetX, dampLambda, dt);
      currentOffsetY = THREE.MathUtils.damp(currentOffsetY, targetOffsetY, dampLambda, dt);

      // Update camera spherical coordinates
      _targetCamPos.setFromSphericalCoords(currentCamDist, currentCamPolar, currentCamAzimuth);
      camera.position.copy(_targetCamPos);
      _lookAtPos.set(0, 0, 0);
      camera.lookAt(_lookAtPos);

      // Position and orient watch root
      watchRoot.position.set(currentOffsetX, currentOffsetY, 0);
      watchRoot.rotation.set(currentWatchRotX, currentWatchRotY, currentWatchRotZ);

      // Apply exploded Z-axis offsets to the mechanical groups
      const offsets = computeLayerOffsets(currentExplode);
      crystalGroup.position.z = offsets.crystalZ;
      bezelGroup.position.z = offsets.bezelZ;
      handsGroup.position.z = offsets.handsZ;
      dialGroup.position.z = offsets.dialZ;
      tourbillonGroup.position.z = offsets.tourbillonZ;
      geartrainGroup.position.z = offsets.geartrainZ;
      mainplateGroup.position.z = offsets.mainplateZ;
      caseAndStrapsGroup.position.z = -currentExplode * 1.45;
      casebackGroup.position.z = offsets.casebackZ;

      guideLineMat.opacity = currentExplode * 0.55;

      // Advance mechanical watch kinematics
      accumulatedSimTime += dt * s.speedMultiplier;
      const kin = calculateWatchKinematics(accumulatedSimTime, 1);
      tourbillonCarriage.rotation.z = kin.tourbillonAngle;
      balanceWheelGroup.rotation.z = kin.balanceOscillation;
      secondHandPivot.rotation.z = kin.secondHandAngle;
      minuteHandPivot.rotation.z = kin.minuteHandAngle;
      hourHandPivot.rotation.z = kin.hourHandAngle;

      // Rotate going-train wheels proportionally
      centerWheel.rotation.z = kin.minuteHandAngle * 2;
      thirdWheel.rotation.z = -kin.secondHandAngle * 0.5;
      fourthWheel.rotation.z = kin.secondHandAngle;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Perform initial synchronous render on mount so first paint is immediately populated
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      currentDialTex.dispose();
      perlageTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      data-testid="watch-3d-canvas"
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      aria-label="Interactive 3D Mechanical Watch Viewport — Drag to rotate timepiece"
    />
  );
};
