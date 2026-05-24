import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─── Simplex Noise ─── */
function snoise(x: number, y: number, z: number): number {
  const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  const P: number[] = [];
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]!;
  const F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;
  let i1 = 0, j1 = 0, k1 = 0, i2 = 0, j2 = 0, k2 = 0;
  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
    } else {
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }
  }
  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;
  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  function grad(h: number, xVal: number, yVal: number, zVal: number) {
    const v = h & 15;
    const u = v < 8 ? xVal : yVal;
    const w = v < 4 ? yVal : (v === 12 || v === 14 ? xVal : zVal);
    return ((v & 1) ? -u : u) + ((v & 2) ? -w : w);
  }
  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 > 0) {
    t0 *= t0;
    n0 = t0 * t0 * grad(P[ii + P[jj + P[kk]!]!]!, x0, y0, z0);
  }
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 > 0) {
    t1 *= t1;
    n1 = t1 * t1 * grad(P[ii + i1 + P[jj + j1 + P[kk + k1]!]!]!, x1, y1, z1);
  }
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 > 0) {
    t2 *= t2;
    n2 = t2 * t2 * grad(P[ii + i2 + P[jj + j2 + P[kk + k2]!]!]!, x2, y2, z2);
  }
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 > 0) {
    t3 *= t3;
    n3 = t3 * t3 * grad(P[ii + 1 + P[jj + 1 + P[kk + 1]!]!]!, x3, y3, z3);
  }
  return 32 * (n0 + n1 + n2 + n3);
}

export type VoiceOrbProps = {
  onToggle?: () => void;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  size = 380,
  className = "",
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set layout dimensions
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;

    const SEG = 80;
    const disposables: any[] = [];

    // Outer blob — deep blue rim, almost black core
    const outerGeo = new THREE.SphereGeometry(1, SEG, SEG);
    const outerMat = new THREE.MeshPhongMaterial({
      color: 0x0a1a6e,       // deep navy blue
      emissive: 0x000000,
      specular: 0x1133aa,
      shininess: 18,
      transparent: true,
      opacity: 1.0,
      side: THREE.FrontSide
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);
    disposables.push(outerGeo, outerMat);

    // Inner wireframe — nearly black, dark blue tint
    const innerGeo = new THREE.SphereGeometry(0.72, 60, 60);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x050e3a,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);
    disposables.push(innerGeo, innerMat);

    // Solid black fill inside wireframe so it looks deep/opaque
    const coreGeo = new THREE.SphereGeometry(0.69, 40, 40);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x010208, side: THREE.FrontSide });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);
    disposables.push(coreGeo, coreMat);

    // Lighting
    const ambLight = new THREE.AmbientLight(0x000510, 1.0);
    scene.add(ambLight);

    const rimLight = new THREE.DirectionalLight(0x1155ff, 2.5);
    rimLight.position.set(3, 3, 2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x0a1a55, 1.0);
    fillLight.position.set(-3, -1, 1);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0x0022aa, 0.4);
    backLight.position.set(0, -2, -3);
    scene.add(backLight);

    const outerPos0 = outerGeo.attributes.position.array.slice() as Float32Array;
    const innerPos0 = innerGeo.attributes.position.array.slice() as Float32Array;

    let hovered = false, hoverStrength = 0;
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0;
    let velX = 0, velY = 0;

    const handleMouseEnter = () => { hovered = true; };
    const handleMouseLeave = () => { hovered = false; };
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };
    const handleMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      velX = (e.clientX - prevX) * 0.006;
      velY = (e.clientY - prevY) * 0.006;
      rotY += velX; rotX += velY;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      isDragging = true;
      prevX = t.clientX;
      prevY = t.clientY;
    };
    const handleTouchEnd = () => {
      isDragging = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const t = e.touches[0];
      if (!t) return;
      rotY += (t.clientX - prevX) * 0.008;
      rotX += (t.clientY - prevY) * 0.008;
      prevX = t.clientX;
      prevY = t.clientY;
    };

    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let clock = 0;
    let animId = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      clock += 0.0025;

      hoverStrength += (hovered ? 1 : -1) * 0.025;
      hoverStrength = Math.max(0, Math.min(1, hoverStrength));

      const noiseScale = 1.1;
      const amp = 0.10 + hoverStrength * 0.10;

      const oPos = outerGeo.attributes.position;
      for (let i = 0; i < oPos.count; i++) {
        const ox = outerPos0[i*3]!, oy = outerPos0[i*3+1]!, oz = outerPos0[i*3+2]!;
        const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
        const nx = ox/len, ny = oy/len, nz = oz/len;
        const n = snoise(nx*noiseScale + clock, ny*noiseScale + clock*0.6, nz*noiseScale + clock*0.4);
        const d = 1 + n * amp;
        oPos.setXYZ(i, nx*d, ny*d, nz*d);
      }
      oPos.needsUpdate = true;
      outerGeo.computeVertexNormals();

      const iAmp = 0.12 + hoverStrength * 0.08;
      const iPos = innerGeo.attributes.position;
      for (let i = 0; i < iPos.count; i++) {
        const ox = innerPos0[i*3]!, oy = innerPos0[i*3+1]!, oz = innerPos0[i*3+2]!;
        const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
        const nx = ox/len, ny = oy/len, nz = oz/len;
        const n = snoise(nx*1.0 + clock*0.9, ny*1.0 + clock*0.7, nz*1.0 + clock*0.5);
        const d = 1 + n * iAmp;
        iPos.setXYZ(i, nx*d, ny*d, nz*d);
      }
      iPos.needsUpdate = true;

      if (!isDragging) {
        velX *= 0.96; velY *= 0.96;
        rotY += 0.0015 + velY;
        rotX += 0.0005 + velX;
      }

      outerMesh.rotation.x = rotX;
      outerMesh.rotation.y = rotY;
      innerMesh.rotation.x = rotX * 0.75 + clock * 0.04;
      innerMesh.rotation.y = rotY * 0.75 - clock * 0.025;
      coreMesh.rotation.x = innerMesh.rotation.x;
      coreMesh.rotation.y = innerMesh.rotation.y;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      disposables.forEach(o => o.dispose?.());
      renderer.dispose();
      
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} cursor-grab`}
      style={{
        width: size,
        height: size,
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
    />
  );
};

VoiceOrb.displayName = "VoiceOrb";
