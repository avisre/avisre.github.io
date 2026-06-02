// Interactive 3D hero — floating geometry that reacts to the cursor.
// Tasteful, light-theme, performance-capped. Degrades gracefully:
//   - no WebGL          -> CSS gradient fallback (hero gets .no-3d)
//   - reduced motion    -> renders a single static frame, no animation
//   - tab hidden / off-screen -> animation loop pauses
import * as THREE from "three";

const canvas = document.getElementById("hero-canvas");
const hero = document.getElementById("top");
if (canvas && hero) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    renderer = null;
  }

  if (!renderer) {
    hero.classList.add("no-3d");
  } else {
    renderer.setClearColor(0x000000, 0); // transparent — CSS provides the backdrop

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    // Soft, even lighting for a clean matte look.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd7dbe1, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 8, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9db0ff, 0.5);
    fill.position.set(-6, -3, 4);
    scene.add(fill);

    // Palette tuned to the site (accent blue + indigo + neutrals + one teal pop).
    const palette = [0x2a55ff, 0x7d97ff, 0x14b8a6, 0xc7cddb, 0xeef2ff, 0x39414c];

    const geoms = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.8, 0.3, 16, 40),
      new THREE.TetrahedronGeometry(1.1, 0),
      new THREE.TorusKnotGeometry(0.6, 0.22, 90, 12),
    ];

    const group = new THREE.Group();
    scene.add(group);

    const COUNT = 17;
    const objs = [];
    for (let i = 0; i < COUNT; i++) {
      const geo = geoms[i % geoms.length];
      const color = palette[i % palette.length];
      const wire = i % 4 === 0;
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.08,
        wireframe: wire,
        flatShading: true,
        transparent: true,
        opacity: wire ? 0.55 : 0.92,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Spread across a wide volume, biased to the periphery so text stays readable.
      const ring = 4 + (i % 5) * 1.6;
      const ang = (i / COUNT) * Math.PI * 2 + (i % 3);
      mesh.position.set(
        Math.cos(ang) * ring + (i % 2 ? 1.5 : -1.5),
        Math.sin(ang * 1.3) * (2.2 + (i % 4)),
        -2 - (i % 6) * 1.4
      );
      const s = 0.5 + ((i * 7) % 10) / 12;
      mesh.scale.setScalar(s);
      mesh.rotation.set(i, i * 0.5, i * 0.3);

      mesh.userData = {
        spin: new THREE.Vector3(
          (((i * 13) % 7) - 3) * 0.0006,
          (((i * 17) % 9) - 4) * 0.0006,
          (((i * 11) % 5) - 2) * 0.0005
        ),
        bob: 0.0006 + ((i % 5) * 0.0002),
        phase: i * 1.7,
        baseY: mesh.position.y,
      };
      group.add(mesh);
      objs.push(mesh);
    }

    // Pointer tracking (mouse + touch), normalized to [-1, 1].
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    function onPointer(clientX, clientY) {
      const r = hero.getBoundingClientRect();
      pointer.tx = ((clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = -(((clientY - r.top) / r.height) * 2 - 1);
    }
    window.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY), { passive: true });

    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    function renderFrame(t) {
      // Ease pointer for smooth parallax.
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      group.rotation.y = pointer.x * 0.5;
      group.rotation.x = -pointer.y * 0.35;
      camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.04;
      camera.position.y += (pointer.y * 0.9 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      for (const m of objs) {
        const u = m.userData;
        m.rotation.x += u.spin.x * 16;
        m.rotation.y += u.spin.y * 16;
        m.rotation.z += u.spin.z * 16;
        m.position.y = u.baseY + Math.sin(t * u.bob + u.phase) * 0.6;
      }
      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      renderFrame(0); // single static frame
    } else {
      let raf = null;
      let running = false;
      const loop = (t) => {
        renderFrame(t);
        raf = requestAnimationFrame(loop);
      };
      const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
      const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

      // Pause when the hero scrolls out of view.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          entries[0].isIntersecting ? start() : stop();
        }, { threshold: 0.01 }).observe(hero);
      } else {
        start();
      }
      // Pause on hidden tab.
      document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
      });
    }
  }
}
