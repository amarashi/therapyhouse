/* The library shelf.
 *
 * A continuous carousel shelf of the clinic's own volumes — two printed books
 * and nine videos — that a visitor can browse, take down, open and read or
 * play. Adapted from ThreeUI's BookshelfScene: the carousel equations, the
 * mode machine, the damping constants, the transition durations and the
 * setViewOffset trick that slides the volume clear of the detail panel are all
 * carried across. The room, the palette, the objects and the content are this
 * house's.
 *
 * Two rules from DESIGN.md shape every departure from the reference:
 *
 *   Nothing ambient sits between a parent and a phone number. So this module
 *   is never on the critical path — the page renders the whole library as
 *   readable HTML first, and the shelf is attached afterwards, on intersection,
 *   only where WebGL and motion preference allow. Failure here is silent and
 *   the list simply stays.
 *
 *   The house is lamplit, not dark. The reference re-lights its room to
 *   near-black per volume; this one runs honey to sage, and the shelf is the
 *   library room's own walnut.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  makeClothSurfaceMaps,
  makeVideoCoverTexture,
  makeSpineTexture,
  makePaperTexture,
  makePageEdgeTexture,
  makeContactShadowTexture,
  makeWalnutTexture,
} from './textures.js';

const { clamp, damp, lerp, degToRad } = THREE.MathUtils;
const smoothstep = (value) => value * value * (3 - 2 * value);
const smootherstep = (value) => value * value * value * (value * (value * 6 - 15) + 10);
const mod = (value, length) => ((value % length) + length) % length;
const pad = (value) => String(value).padStart(2, '0');

/* Carousel geometry, ported. Spacing is the one number that changed: the
   reference's volumes are 1.02 wide against a 1.5 pitch, and a 28 cm
   therapists' manual needs the extra room. */
const SPACING = 1.85;
const SHELF_BOARD_TOP = 0.47;
const ROTATION_PER_STEP = 0.105;
const LEAN_PER_STEP = 0.018;
const FADE_START = 2.55;
const FADE_SPAN = 0.7;
const TRANSITION_DURATION = 0.92;

/* The turning leaf. 18 × 8 segments and a spring on the bend, as in the
   reference — a page that pivots without curving reads as a hinged board. */
const PAGE_SEGMENTS = 18;
const PAGE_SEGMENTS_V = 8;
const PAGE_CURVE_STIFFNESS = 178;
const PAGE_CURVE_DAMPING = 19;

/* How far the front board swings when the book opens. Just short of flat: a
   board stopped at 155° is still travelling toward the viewer — its far edge
   ends up 0.21 × width in front of the spine — and it lands squarely on top of
   the left-hand page. Near 180° the sweep collapses and the board lies down
   beside the page block, which is what a book on a table actually does. */
const COVER_OPEN_ANGLE = -Math.PI * 0.985;
const COVER_SWEEP = Math.abs(Math.sin(COVER_OPEN_ANGLE));

export function createShelfRenderer(host, canvas, volumes, callbacks = {}) {
  let destroyed = false;

  const ui = {};
  host.querySelectorAll('[data-shelf]').forEach((element) => {
    ui[element.dataset.shelf] = element;
  });

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reducedMotionQuery.matches;

  let renderer;
  let scene;
  let camera;
  let controls;
  let environmentTarget;
  let shelfStage;
  let wallFrame;
  let rigs = [];
  let rafId = 0;
  let lastTime = performance.now();
  let running = false;
  let suspended = false;

  /* The mode is mirrored onto the host so CSS can key off it and so a failure
     mid-transition is visible in the DOM rather than only in the picture. */
  let mode = 'shelf';
  const setMode = (next) => {
    mode = next;
    host.dataset.mode = next;
  };
  let transitionTime = 0;
  let transitionStart = 0;
  let position = 0;
  let targetPosition = 0;
  let selectedIndex = 0;
  let hoveredIndex = -1;
  let wheelIdle = 0;
  let activeRig = null;
  let readingOpen = false;
  let currentSpread = 0;
  let playing = false;
  let focusReturnTarget = null;

  let viewWidth = Math.max(1, host.clientWidth);
  let viewHeight = Math.max(1, host.clientHeight);
  let detailViewOffsetX = 0;
  let currentViewOffsetX = 0;
  let detailSafeWidth = viewWidth * 0.6;

  const raycaster = new THREE.Raycaster();
  const pointer = { ndc: new THREE.Vector2(), inside: false };

  const shelfCameraPosition = new THREE.Vector3();
  const shelfCameraTarget = new THREE.Vector3();
  const inspectPosition = new THREE.Vector3();
  const inspectCameraPosition = new THREE.Vector3();
  const inspectCameraTarget = new THREE.Vector3();
  const transitionCameraTarget = new THREE.Vector3();
  const inspectShelfPosition = new THREE.Vector3(0, -4.2, -3);
  const inspectQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.055, -0.14, 0)
  );

  /* Transition endpoints, captured on the frame the transition starts. */
  const fromBookPosition = new THREE.Vector3();
  const fromBookQuaternion = new THREE.Quaternion();
  const fromBookScale = new THREE.Vector3();
  const fromCameraPosition = new THREE.Vector3();
  const fromCameraTarget = new THREE.Vector3();
  const fromShelfPosition = new THREE.Vector3();
  const toBookScale = new THREE.Vector3();
  let fromViewOffsetX = 0;
  let toViewOffsetX = 0;

  const roomMaterials = {};
  const roomLights = {};
  const themeCurrent = { wall: new THREE.Color(), floor: new THREE.Color(), light: new THREE.Color() };
  const themeTarget = { wall: new THREE.Color(), floor: new THREE.Color(), light: new THREE.Color() };
  let themeInitialised = false;

  const disposables = [];
  const track = (value) => {
    disposables.push(value);
    return value;
  };

  /* ---------------------------------------------------------------- room */

  function configureResponsiveTargets() {
    const narrow = viewWidth < 820;

    /* The target sits below the volumes rather than level with them, which
       lifts the shelf into the upper two thirds and leaves the lower third for
       the title, the counter and the button. Level with them, the copy landed
       on the covers. */
    shelfCameraPosition.set(0, narrow ? 1.05 : 1.85, narrow ? 6.0 : 7.5);
    shelfCameraTarget.set(0, narrow ? 0.42 : 0.92, 0);
    inspectPosition.set(narrow ? 0 : -1.15, narrow ? 1.25 : 1.16, 0);
    inspectCameraPosition.set(narrow ? 0 : -0.95, narrow ? 1.4 : 1.32, narrow ? 4.6 : 5.1);
    /* On a wide screen the detail panel takes the right side, so the volume is
       centred vertically and pushed left by the view offset. On a phone the
       panel is a sheet across the foot instead, so the volume has to sit in
       the strip above it — which means aiming the camera below the volume
       rather than at it. */
    inspectCameraTarget.copy(inspectPosition);
    if (narrow) inspectCameraTarget.y -= 0.66;

    /* On a phone the room is seen from close enough that the picture above the
       shelf is cropped by the top of the stage, which reads as a mistake
       rather than as a crop. It comes back for playback, where the camera goes
       to meet it. */
    if (wallFrame) wallFrame.group.visible = !narrow || playing;

    if (narrow) {
      detailViewOffsetX = 0;
      detailSafeWidth = viewWidth;
      return;
    }

    /* Slide the camera's view window sideways so the volume sits centred in
       the space left of the detail panel rather than centred in the canvas. */
    const panelBounds = ui.detail?.getBoundingClientRect();
    const panelLeft = panelBounds && panelBounds.left > 0 ? panelBounds.left : viewWidth * 0.64;
    const gutter = clamp(viewWidth * 0.035, 32, 56);
    detailSafeWidth = Math.max(viewWidth * 0.42, panelLeft - host.getBoundingClientRect().left - gutter);
    const wide = clamp((viewWidth - 820) / 620, 0, 1);
    const desiredCentre = detailSafeWidth * lerp(0.55, 0.615, wide);
    detailViewOffsetX = Math.max(0, viewWidth * 0.5 - desiredCentre);
  }

  function getInspectScale() {
    if (!activeRig) return 0.82;
    /* An open book is two pages wide. Sizing it by the closed cover is what
       pushed the spread off the left edge of the stage. */
    const spread = readingOpen && activeRig.volume.kind === 'book' ? 1.98 : 1;
    const volume = activeRig.volume;

    const distance = Math.abs(inspectCameraPosition.z - inspectPosition.z);
    const worldHeight = 2 * distance * Math.tan(degToRad(camera.fov * 0.5));
    const pixelsPerWorld = viewHeight / Math.max(worldHeight, 0.001);

    /* Fit both ways. Width alone lets a tall closed volume run off the top of
       the stage, and height alone lets an open landscape spread run under the
       detail panel. */
    const safeWidth = viewWidth < 820 ? viewWidth * 0.86 : detailSafeWidth * 0.88;
    const safeHeight = viewHeight * (viewWidth < 820 ? 0.46 : 0.76);
    const byWidth = safeWidth / Math.max(volume.width * spread * pixelsPerWorld, 1);
    const byHeight = safeHeight / Math.max(volume.height * pixelsPerWorld, 1);

    return clamp(Math.min(byWidth, byHeight), 0.45, 1.6);
  }

  function applyViewOffset() {
    if (Math.abs(currentViewOffsetX) < 0.5) {
      camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(viewWidth, viewHeight, currentViewOffsetX, 0, viewWidth, viewHeight);
  }

  function addRoom() {
    const plane = track(new THREE.PlaneGeometry(1, 1));
    const box = track(new THREE.BoxGeometry(1, 1, 1));

    const floorMaterial = track(
      new THREE.MeshStandardMaterial({ color: 0xc4ae8c, roughness: 0.94, metalness: 0 })
    );
    const floor = new THREE.Mesh(plane, floorMaterial);
    floor.receiveShadow = true;
    floor.scale.set(30, 20, 1);
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -0.02;
    scene.add(floor);

    const wallMaterial = track(
      new THREE.MeshStandardMaterial({ color: 0xdccdae, roughness: 1, metalness: 0 })
    );
    const wall = new THREE.Mesh(plane, wallMaterial);
    wall.receiveShadow = true;
    wall.scale.set(28, 14, 1);
    wall.position.set(0, 5.5, -3.3);
    scene.add(wall);

    const walnutMap = track(makeWalnutTexture());
    const walnutDarkMap = track(makeWalnutTexture({ dark: true }));
    walnutMap.repeat.set(6, 1);
    walnutDarkMap.repeat.set(6, 1);

    const walnut = track(
      new THREE.MeshStandardMaterial({ map: walnutMap, color: 0xffffff, roughness: 0.58, metalness: 0 })
    );
    const walnutDark = track(
      new THREE.MeshStandardMaterial({ map: walnutDarkMap, color: 0xffffff, roughness: 0.7, metalness: 0 })
    );

    const board = new THREE.Mesh(box, walnut);
    board.castShadow = true;
    board.receiveShadow = true;
    board.scale.set(19, 0.28, 1.24);
    board.position.set(0, 0.33, -0.03);
    shelfStage.add(board);

    const lip = new THREE.Mesh(box, walnutDark);
    lip.receiveShadow = true;
    lip.scale.set(19.05, 0.075, 1.3);
    lip.position.set(0, 0.205, 0.04);
    shelfStage.add(lip);

    const backRail = new THREE.Mesh(box, walnut);
    backRail.receiveShadow = true;
    backRail.scale.set(19, 0.17, 0.2);
    backRail.position.set(0, 0.68, -0.56);
    shelfStage.add(backRail);

    [-8.6, 8.6].forEach((x) => {
      const upright = new THREE.Mesh(box, walnutDark);
      upright.receiveShadow = true;
      upright.scale.set(0.2, 3.8, 0.8);
      upright.position.set(x, 2.05, -0.3);
      shelfStage.add(upright);
    });

    const shadowStrip = new THREE.Mesh(
      plane,
      track(
        new THREE.MeshBasicMaterial({
          color: 0x2f1d13,
          alphaMap: makeContactShadowTexture(),
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      )
    );
    shadowStrip.scale.set(18, 0.9, 1);
    shadowStrip.rotation.x = -Math.PI * 0.5;
    shadowStrip.position.set(0, 0.49, 0.08);
    shelfStage.add(shadowStrip);

    /* The framed panel on the back wall. In the library room illustration it
       hangs blank above the sideboard; here it is where a video plays. */
    /* A picture on the wall above the shelf, sized like one. At 4.5 units it
       read as a projector screen and took the eye before the books did; the
       camera moves in to it when a video plays, so its world size only has to
       be right for the room. */
    const frameGroup = new THREE.Group();
    frameGroup.position.set(0, 2.78, -3.24);

    const frameOuter = new THREE.Mesh(box, walnutDark);
    frameOuter.scale.set(2.62, 1.62, 0.1);
    frameGroup.add(frameOuter);

    const frameMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.95, metalness: 0 })
    );
    const frameInner = new THREE.Mesh(plane, frameMat);
    frameInner.scale.set(2.31, 1.3, 1);
    frameInner.position.z = 0.06;
    frameGroup.add(frameInner);

    /* The picture belongs to the shelf, not to the scene. Taking a volume down
       drops the whole set of furniture away — and the frame goes with it,
       which is what keeps a brown corner from hanging in the top of the stage
       while someone is reading. A video still finds it: the theatre aims at
       wherever it currently is. */
    shelfStage.add(frameGroup);
    wallFrame = {
      group: frameGroup,
      width: 2.31,
      height: 1.3,
      depth: 0.06,
      mat: frameMat,
    };

    roomMaterials.floor = floorMaterial;
    roomMaterials.wall = wallMaterial;
    roomMaterials.shadow = shadowStrip.material;
  }

  function addLights() {
    RectAreaLightUniformsLib.init();

    roomLights.hemisphere = new THREE.HemisphereLight(0xfff8e8, 0x5b4030, 0.42);
    scene.add(roomLights.hemisphere);

    const key = new THREE.DirectionalLight(0xffe8c2, 1.42);
    key.position.set(-4.6, 7.4, 5.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -1.5;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 18;
    key.shadow.bias = -0.00018;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 3.5;
    scene.add(key);
    roomLights.key = key;

    /* The softbox that makes cloth read as cloth, and the raking light that
       makes foil read as foil. Without the rake the gold stamping is just a
       yellow shape. */
    const softKey = new THREE.RectAreaLight(0xffe8c2, 5.4, 4.8, 5.6);
    softKey.position.set(-3.2, 5.5, 4.6);
    softKey.lookAt(0, 1.2, 0);
    scene.add(softKey);

    const fill = new THREE.DirectionalLight(0xd8e3e7, 0.3);
    fill.position.set(5.5, 3.6, 4.2);
    scene.add(fill);
    roomLights.fill = fill;

    const rim = new THREE.RectAreaLight(0xd5a45e, 3.45, 1.6, 4.8);
    rim.position.set(3.8, 3.6, -2.1);
    rim.lookAt(-0.2, 1.25, 0);
    scene.add(rim);

    const spineRake = new THREE.RectAreaLight(0xffe8c2, 1.9, 0.9, 4.6);
    spineRake.position.set(-4.6, 3.2, 1.1);
    spineRake.lookAt(-0.55, 1.25, 0);
    scene.add(spineRake);

    const pageRake = new THREE.RectAreaLight(0xfff7e7, 2.15, 1.15, 3.8);
    pageRake.position.set(4.2, 4.8, 3.1);
    pageRake.lookAt(0.65, 1.3, 0);
    scene.add(pageRake);
  }

  /* --------------------------------------------------------------- rigs */

  function loadTexture(url) {
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          resolve(track(texture));
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  function loadImage(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  /* Half of a spread image, mapped to one page. The scans are true spreads —
     illustration verso, story recto — so the two pages of an open book are the
     two halves of one file rather than two separate assets. */
  function halfSpread(texture, side) {
    if (!texture) return null;
    const half = texture.clone();
    half.needsUpdate = true;
    half.wrapS = THREE.ClampToEdgeWrapping;
    half.wrapT = THREE.ClampToEdgeWrapping;
    half.repeat.set(0.5, 1);
    half.offset.set(side === 'left' ? 0 : 0.5, 0);
    return track(half);
  }

  async function createRig(volume, index) {
    const { width, height, depth } = volume;
    const boardThickness = Math.min(0.028, depth * 0.22);

    const root = new THREE.Group();
    const motion = new THREE.Group();
    root.add(motion);

    const cloth = makeClothSurfaceMaps(volume);
    track(cloth.normal);
    track(cloth.roughness);

    const coverTexture = volume.kind === 'book'
      ? await loadTexture(volume.cover)
      : makeVideoCoverTexture(volume, await loadImage(volume.thumbnail));
    if (volume.kind === 'video') track(coverTexture);

    const spineTexture = track(makeSpineTexture(volume));
    const paperTexture = track(makePaperTexture(volume));
    const foreEdge = track(makePageEdgeTexture(volume, { foreEdge: true }));
    const headEdge = track(makePageEdgeTexture(volume, { foreEdge: false }));

    const clothMaterial = (map) =>
      track(
        new THREE.MeshPhysicalMaterial({
          map: map || null,
          color: map ? 0xffffff : new THREE.Color(volume.color),
          normalMap: cloth.normal,
          normalScale: new THREE.Vector2(0.34, 0.34),
          roughnessMap: cloth.roughness,
          roughness: 0.82,
          metalness: 0,
          sheen: 0.3,
          sheenRoughness: 0.82,
          sheenColor: new THREE.Color(0xfff3dc),
          transparent: true,
        })
      );

    const boardGeometry = track(new RoundedBoxGeometry(width, height, boardThickness, 3, 0.012));
    const plainCloth = clothMaterial(null);

    /* The front board hinges at the spine, so the pivot sits at the binding
       edge and the board hangs off it. */
    const frontPivot = new THREE.Group();
    frontPivot.position.set(-width * 0.5, 0, depth * 0.5 - boardThickness * 0.5);
    motion.add(frontPivot);

    const frontMaterials = [
      plainCloth, plainCloth, plainCloth, plainCloth,
      clothMaterial(coverTexture),
      /* The inside of the board. A flat cream slab is what an open book looks
         like when nobody thought about the endpaper. */
      track(
        new THREE.MeshPhysicalMaterial({
          map: paperTexture,
          color: 0xf6efe1,
          roughness: 0.94,
          metalness: 0,
          transparent: true,
        })
      ),
    ];
    const front = new THREE.Mesh(boardGeometry, frontMaterials);
    front.castShadow = true;
    front.position.x = width * 0.5;
    frontPivot.add(front);

    const back = new THREE.Mesh(boardGeometry, plainCloth);
    back.position.z = -depth * 0.5 + boardThickness * 0.5;
    motion.add(back);

    const spineGeometry = track(new RoundedBoxGeometry(boardThickness * 1.6, height, depth, 3, 0.01));
    const spine = new THREE.Mesh(spineGeometry, clothMaterial(spineTexture));
    spine.position.x = -width * 0.5 - boardThickness * 0.2;
    motion.add(spine);

    /* The closed page block: paper faces, ruled edges. */
    const blockGeometry = track(
      new THREE.BoxGeometry(width * 0.965, height * 0.965, depth - boardThickness * 2.4)
    );
    const paperMaterial = (map, rotate = false) => {
      const applied = map ? map.clone() : null;
      if (applied) {
        applied.needsUpdate = true;
        if (rotate) {
          applied.center.set(0.5, 0.5);
          applied.rotation = Math.PI * 0.5;
        }
        track(applied);
      }
      return track(
        new THREE.MeshPhysicalMaterial({
          map: applied,
          color: 0xffffff,
          roughness: 0.95,
          metalness: 0,
          sheen: 0.025,
          sheenRoughness: 1,
          transparent: true,
        })
      );
    };
    const block = new THREE.Mesh(blockGeometry, [
      paperMaterial(foreEdge),
      paperMaterial(foreEdge),
      paperMaterial(headEdge),
      paperMaterial(headEdge),
      paperMaterial(paperTexture),
      paperMaterial(paperTexture),
    ]);
    block.position.x = boardThickness * 0.6;
    motion.add(block);

    /* --- open state --- */
    const spreads = volume.spreads || [];
    const spreadTextures = await Promise.all(spreads.map((spread) => loadTexture(spread.image)));

    /* The open book is built around the spine, not around the closed book's
       centre. The hinge is at -width/2, so pages centred on 0 put the whole
       spread half a cover to the right of where it belongs and left the opened
       board sitting beside it as a blank slab. */
    const openGroup = new THREE.Group();
    openGroup.position.x = -width * 0.5;
    /* In front of the boards, not level with them. The front cover swings out
       to the left of the spine and lands exactly where the verso page sits —
       so at the block's own depth the first left-hand page was buried under
       the open board and half of every spread went missing. Paper lies on top
       of the cover, the way it does in a real book. */
    openGroup.position.z = depth * 0.5 + COVER_SWEEP * width + 0.03;
    openGroup.visible = false;
    motion.add(openGroup);

    const pageGeometry = track(new THREE.PlaneGeometry(width * 0.95, height * 0.95, 1, 1));
    const pageMaterial = () =>
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0xfdf8ee,
          roughness: 0.95,
          metalness: 0,
          side: THREE.FrontSide,
          transparent: true,
        })
      );

    const leftPage = new THREE.Mesh(pageGeometry, pageMaterial());
    leftPage.position.set(-width * 0.4775, 0, 0);
    openGroup.add(leftPage);

    const rightPage = new THREE.Mesh(pageGeometry, pageMaterial());
    rightPage.position.set(width * 0.4775, 0, 0);
    openGroup.add(rightPage);

    /* One turning leaf, hinged at the spine. Its two faces carry the outgoing
       recto and the incoming verso, so a turn shows the right thing on both
       sides of the sheet as it goes over. */
    const leafPivot = new THREE.Group();
    leafPivot.position.set(0, 0, 0.004);
    openGroup.add(leafPivot);

    const leafGeometry = track(
      new THREE.PlaneGeometry(width * 0.95, height * 0.95, PAGE_SEGMENTS, PAGE_SEGMENTS_V)
    );
    leafGeometry.translate(width * 0.475, 0, 0);
    const leafFront = new THREE.Mesh(leafGeometry, pageMaterial());
    const leafBackMaterial = pageMaterial();
    leafBackMaterial.side = THREE.BackSide;
    const leafBack = new THREE.Mesh(leafGeometry, leafBackMaterial);
    leafPivot.add(leafFront);
    leafPivot.add(leafBack);
    leafPivot.visible = false;

    const restPositions = Float32Array.from(leafGeometry.attributes.position.array);

    /* Video cases open onto the still at full size rather than onto paper. */
    let plate = null;
    let poster = null;
    if (volume.kind === 'video') {
      const thumbnail = await loadTexture(volume.thumbnail);
      poster = thumbnail;
      const plateHeight = width * 0.95 * (9 / 16);
      plate = new THREE.Mesh(
        track(new THREE.PlaneGeometry(width * 0.95, plateHeight)),
        track(
          new THREE.MeshPhysicalMaterial({
            map: thumbnail,
            color: 0xffffff,
            roughness: 0.86,
            metalness: 0,
            transparent: true,
          })
        )
      );
      plate.position.set(0, 0, depth * 0.2);
      plate.visible = false;
      motion.add(plate);
    }

    const contactShadow = new THREE.Mesh(
      track(new THREE.PlaneGeometry(width * 1.5, depth * 3.4)),
      track(
        new THREE.MeshBasicMaterial({
          color: 0x2f1d13,
          alphaMap: makeContactShadowTexture(),
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        })
      )
    );
    contactShadow.rotation.x = -Math.PI * 0.5;
    contactShadow.position.set(0, -height * 0.5 + 0.012, depth * 0.1);
    root.add(contactShadow);

    const hit = new THREE.Mesh(
      track(new THREE.BoxGeometry(width * 1.02, height * 1.02, depth * 1.6)),
      track(new THREE.MeshBasicMaterial({ visible: false }))
    );
    motion.add(hit);

    const fadeMaterials = [];
    root.traverse((object) => {
      if (!object.isMesh) return;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => {
        if (material.transparent && !fadeMaterials.includes(material)) fadeMaterials.push(material);
      });
    });

    return {
      volume,
      index,
      root,
      motion,
      frontPivot,
      openGroup,
      leftPage,
      rightPage,
      leafPivot,
      leafFront,
      leafBack,
      leafGeometry,
      restPositions,
      block,
      poster,
      plate,
      spine,
      contactShadow,
      hit,
      fadeMaterials,
      spreadTextures,
      opacity: 1,
      lastOffset: null,
      coverAngle: 0,
      leafAngle: 0,
      leafTarget: 0,
      leafActive: false,
      turnFrom: 0,
      turnTo: 0,
      flex: { curve: 0, velocity: 0 },
    };
  }

  /* -------------------------------------------------------------- theme */

  function applyTheme(volume, immediate = false) {
    themeTarget.wall.set(volume.palette.wall);
    themeTarget.floor.set(volume.palette.floor);
    themeTarget.light.set(volume.palette.light);
    if (immediate || !themeInitialised || reducedMotion) {
      themeCurrent.wall.copy(themeTarget.wall);
      themeCurrent.floor.copy(themeTarget.floor);
      themeCurrent.light.copy(themeTarget.light);
      themeInitialised = true;
      commitTheme();
    }
  }

  function commitTheme() {
    roomMaterials.wall.color.copy(themeCurrent.wall);
    roomMaterials.floor.color.copy(themeCurrent.floor);
    roomLights.key.color.copy(themeCurrent.light);
    if (scene.fog) scene.fog.color.copy(themeCurrent.wall);
  }

  function updateTheme(delta) {
    if (reducedMotion) return;
    const rate = 1 - Math.exp(-2.6 * delta);
    themeCurrent.wall.lerp(themeTarget.wall, rate);
    themeCurrent.floor.lerp(themeTarget.floor, rate);
    themeCurrent.light.lerp(themeTarget.light, rate);
    commitTheme();
  }

  /* ----------------------------------------------------------- selection */

  function updateSelection(index, announce = false) {
    const next = mod(index, volumes.length);
    if (next === selectedIndex && !announce && themeInitialised) return;
    selectedIndex = next;
    const volume = volumes[selectedIndex];

    if (ui.title) {
      ui.title.textContent = volume.title;
      if (volume.titleLang) {
        ui.title.lang = volume.titleLang;
        ui.title.dir = 'rtl';
      } else {
        ui.title.removeAttribute('lang');
        ui.title.removeAttribute('dir');
      }
    }
    if (ui.note) ui.note.textContent = volume.gloss || volume.note;
    if (ui.counter) ui.counter.textContent = `${pad(selectedIndex + 1)} / ${pad(volumes.length)}`;
    if (ui.open) {
      ui.open.setAttribute(
        'aria-label',
        volume.kind === 'book' ? `Take down ${volume.title}` : `Take down ${volume.gloss || volume.title}`
      );
    }

    if (ui.markers) {
      [...ui.markers.children].forEach((marker, markerIndex) => {
        const current = markerIndex === selectedIndex;
        marker.setAttribute('aria-current', current ? 'true' : 'false');
        marker.tabIndex = current ? 0 : -1;
      });
    }

    /* The picture on the wall shows whichever video is currently in front, and
       goes back to a plain mat for a book. An empty frame reads as a prop; a
       frame holding the still you are about to play tells you where it plays
       before you press anything. */
    if (wallFrame?.mat) {
      const still = rigs[selectedIndex]?.poster || null;
      wallFrame.mat.map = still;
      wallFrame.mat.color.set(still ? 0xffffff : 0xe8dcc0);
      wallFrame.mat.needsUpdate = true;
    }

    applyTheme(volume);
    callbacks.onSelectionChange?.(selectedIndex);

    if (announce) {
      announceLive(
        `${pad(selectedIndex + 1)} of ${volumes.length}: ${volume.gloss || volume.title}. ${volume.note}`
      );
    }
  }

  function announceLive(message) {
    if (ui.live) ui.live.textContent = message;
  }

  function navigate(direction) {
    targetPosition = Math.round(targetPosition) + direction;
    wheelIdle = 0;
    requestFrame();
  }

  function selectIndex(index) {
    /* Take the short way round the ring rather than unwinding through the
       whole shelf when a marker across the seam is clicked. */
    const current = Math.round(targetPosition);
    let delta = mod(index - mod(current, volumes.length) + volumes.length * 0.5, volumes.length)
      - volumes.length * 0.5;
    targetPosition = current + delta;
    wheelIdle = 0;
    requestFrame();
  }

  /* ------------------------------------------------------------- layout */

  function updateShelfLayout(delta, elapsed) {
    if (mode === 'shelf') {
      position = reducedMotion ? targetPosition : damp(position, targetPosition, 9.5, delta);
      if (Math.abs(position - targetPosition) < 0.0005) position = targetPosition;

      if (wheelIdle > 0) {
        wheelIdle -= delta;
        if (wheelIdle <= 0) targetPosition = Math.round(targetPosition);
      }

      const nearest = mod(Math.round(position), volumes.length);
      if (nearest !== selectedIndex) updateSelection(nearest, false);
    }

    rigs.forEach((rig, index) => {
      if (rig.root.parent !== shelfStage) return;

      let offset = index - position;
      offset -= Math.round(offset / volumes.length) * volumes.length;
      const distance = Math.abs(offset);
      const wrapped = rig.lastOffset !== null
        && Math.abs(offset - rig.lastOffset) > volumes.length * 0.5;
      const focus = 1 - clamp(distance, 0, 1);

      const targetX = offset * SPACING;
      const targetY = SHELF_BOARD_TOP + rig.volume.height * 0.5 + focus * 0.15;
      const targetZ = 0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07;
      const targetRotationY = -offset * ROTATION_PER_STEP;
      const targetRotationZ = -offset * LEAN_PER_STEP;
      const targetScale = 1 + focus * 0.09;
      const speed = reducedMotion ? 1000 : 12;

      /* A volume that has just wrapped from one end of the ring to the other
         is teleported and faded in, never damped across the whole shelf. */
      if (wrapped) {
        rig.root.position.x = targetX;
        rig.opacity = 0;
      }
      rig.lastOffset = offset;

      rig.root.position.x = damp(rig.root.position.x, targetX, speed, delta);
      rig.root.position.y = damp(rig.root.position.y, targetY, speed, delta);
      rig.root.position.z = damp(rig.root.position.z, targetZ, speed, delta);
      rig.root.rotation.y = damp(rig.root.rotation.y, targetRotationY, speed, delta);
      rig.root.rotation.z = damp(rig.root.rotation.z, targetRotationZ, speed, delta);
      rig.root.scale.setScalar(damp(rig.root.scale.x, targetScale, speed, delta));

      const fade = clamp((distance - FADE_START) / FADE_SPAN, 0, 1);
      const targetOpacity = 1 - smoothstep(fade);
      rig.opacity = reducedMotion ? targetOpacity : damp(rig.opacity, targetOpacity, 18, delta);
      rig.fadeMaterials.forEach((material) => {
        material.opacity = rig.opacity;
      });
      rig.contactShadow.material.opacity = rig.opacity * 0.24;
      rig.hit.visible = rig.opacity > 0.12;

      /* On hover the front board cracks open a few degrees. It is a preview of
         what clicking does, and it is the only hint the shelf gives that these
         objects open at all. */
      const hovered = hoveredIndex === index && mode === 'shelf' && !reducedMotion;
      rig.frontPivot.rotation.y = damp(rig.frontPivot.rotation.y, hovered ? -0.085 : 0, 13, delta);

      const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + index * 0.8) * 0.012 * focus;
      rig.motion.position.y = damp(rig.motion.position.y, idle + (hovered ? 0.035 : 0), 9, delta);
      rig.motion.rotation.x = damp(rig.motion.rotation.x, hovered ? pointer.ndc.y * 0.035 : 0, 10, delta);
      rig.motion.rotation.y = damp(rig.motion.rotation.y, hovered ? -pointer.ndc.x * 0.035 : 0, 10, delta);
    });
  }

  /* -------------------------------------------------------- open / close */

  function openDetail(origin) {
    if (mode !== 'shelf') return;
    setMode('opening');
    transitionTime = 0;
    transitionStart = performance.now();
    readingOpen = false;
    currentSpread = 0;
    playing = false;
    focusReturnTarget = origin || ui.open;
    activeRig = rigs[selectedIndex];
    activeRig.contactShadow.visible = false;
    hoveredIndex = -1;

    populateDetail(activeRig.volume);
    host.classList.add('is-detail');
    if (ui.detail) {
      ui.detail.inert = false;
      ui.detail.setAttribute('aria-hidden', 'false');
    }
    if (ui.browse) ui.browse.inert = true;

    activeRig.root.updateWorldMatrix(true, true);
    activeRig.root.matrixWorld.decompose(fromBookPosition, fromBookQuaternion, fromBookScale);
    fromCameraPosition.copy(camera.position);
    fromCameraTarget.copy(transitionCameraTarget);
    fromShelfPosition.copy(shelfStage.position);
    fromViewOffsetX = currentViewOffsetX;
    toViewOffsetX = detailViewOffsetX;

    scene.add(activeRig.root);
    activeRig.root.position.copy(fromBookPosition);
    activeRig.root.quaternion.copy(fromBookQuaternion);
    activeRig.root.scale.copy(fromBookScale);
    activeRig.motion.position.set(0, 0, 0);
    activeRig.motion.rotation.set(0, 0, 0);

    controls.enabled = false;
    announceLive(
      `${activeRig.volume.gloss || activeRig.volume.title}, taken down. ${
        activeRig.volume.kind === 'book' ? 'Open it to read a few pages.' : 'Play it to watch.'
      }`
    );

    if (reducedMotion) finishOpening();
    requestFrame();
  }

  function applyOpeningPose(progress) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const shelfClear = smootherstep(clamp(progress / 0.68, 0, 1));
    toBookScale.setScalar(getInspectScale());

    shelfStage.position.lerpVectors(fromShelfPosition, inspectShelfPosition, shelfClear);
    activeRig.root.position.lerpVectors(fromBookPosition, inspectPosition, eased);
    activeRig.root.quaternion.slerpQuaternions(fromBookQuaternion, inspectQuaternion, eased);
    activeRig.root.scale.lerpVectors(fromBookScale, toBookScale, eased);
    camera.position.lerpVectors(fromCameraPosition, inspectCameraPosition, eased);
    transitionCameraTarget.lerpVectors(fromCameraTarget, inspectCameraTarget, eased);
    currentViewOffsetX = lerp(fromViewOffsetX, toViewOffsetX, eased);
    applyViewOffset();
    camera.lookAt(transitionCameraTarget);
  }

  function finishOpening() {
    if (!activeRig) return;
    applyOpeningPose(1);
    setMode('detail');
    transitionTime = 1;
    controls.target.copy(inspectCameraTarget);
    controls.enabled = true;
    controls.enableDamping = !reducedMotion;
    controls.update();
    host.classList.remove('is-opening');
    updatePageControls();
    ui.close?.focus({ preventScroll: true });
    callbacks.onModeChange?.('detail');
  }

  function closeDetail() {
    if (mode !== 'detail') return;
    stopTheatre();
    setMode('closing');
    transitionTime = 0;
    transitionStart = performance.now();
    readingOpen = false;
    currentSpread = 0;

    fromBookPosition.copy(activeRig.root.position);
    fromBookQuaternion.copy(activeRig.root.quaternion);
    fromBookScale.copy(activeRig.root.scale);
    fromCameraPosition.copy(camera.position);
    fromCameraTarget.copy(transitionCameraTarget);
    fromShelfPosition.copy(shelfStage.position);
    fromViewOffsetX = currentViewOffsetX;
    toViewOffsetX = 0;

    controls.enabled = false;
    host.classList.remove('is-detail');
    if (ui.detail) {
      ui.detail.inert = true;
      ui.detail.setAttribute('aria-hidden', 'true');
    }
    if (ui.browse) ui.browse.inert = false;

    announceLive(`Back to the shelf.`);
    if (reducedMotion) finishClosing();
    requestFrame();
  }

  function applyClosingPose(progress) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const rig = activeRig;

    /* Where the volume has to land: its slot on the shelf, in world space. */
    let offset = rig.index - position;
    offset -= Math.round(offset / volumes.length) * volumes.length;
    const focus = 1 - clamp(Math.abs(offset), 0, 1);
    const slot = new THREE.Vector3(
      offset * SPACING,
      SHELF_BOARD_TOP + rig.volume.height * 0.5 + focus * 0.15,
      0.13 + focus * 0.24
    );
    const slotQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, -offset * ROTATION_PER_STEP, -offset * LEAN_PER_STEP)
    );

    shelfStage.position.lerpVectors(fromShelfPosition, new THREE.Vector3(0, 0, 0), eased);
    rig.root.position.lerpVectors(fromBookPosition, slot, eased);
    rig.root.quaternion.slerpQuaternions(fromBookQuaternion, slotQuaternion, eased);
    rig.root.scale.lerpVectors(fromBookScale, new THREE.Vector3(1 + focus * 0.09, 1 + focus * 0.09, 1 + focus * 0.09), eased);
    camera.position.lerpVectors(fromCameraPosition, shelfCameraPosition, eased);
    transitionCameraTarget.lerpVectors(fromCameraTarget, shelfCameraTarget, eased);
    currentViewOffsetX = lerp(fromViewOffsetX, 0, eased);
    applyViewOffset();
    camera.lookAt(transitionCameraTarget);
  }

  function finishClosing() {
    if (!activeRig) return;
    applyClosingPose(1);
    shelfStage.add(activeRig.root);
    activeRig.contactShadow.visible = true;
    activeRig.frontPivot.rotation.y = 0;
    activeRig.motion.position.set(0, 0, 0);
    activeRig.openGroup.visible = false;
    activeRig.block.visible = true;
    if (activeRig.plate) activeRig.plate.visible = false;
    activeRig.lastOffset = null;
    const returnTo = focusReturnTarget;
    activeRig = null;
    setMode('shelf');
    transitionTime = 1;
    controls.enabled = false;
    camera.position.copy(shelfCameraPosition);
    camera.lookAt(shelfCameraTarget);
    returnTo?.focus?.({ preventScroll: true });
    callbacks.onModeChange?.('shelf');
    requestFrame();
  }

  /* ------------------------------------------------------------ reading */

  const spreadCount = (volume) => (volume.spreads ? volume.spreads.length : 0);

  function setReadingOpen(open) {
    if (mode !== 'detail' || readingOpen === open || !activeRig) return;
    readingOpen = open;
    if (!readingOpen) currentSpread = 0;
    activeRig.leafPivot.visible = false;
    activeRig.leafActive = false;
    updatePageControls();
    applySpreadTextures();
    announceLive(
      readingOpen
        ? `${activeRig.volume.title} opened at ${activeRig.volume.spreads?.[0]?.label || 'the first page'}.`
        : `${activeRig.volume.title} closed.`
    );
    requestFrame();
  }

  function applySpreadTextures() {
    const rig = activeRig;
    if (!rig || rig.volume.kind !== 'book') return;
    const texture = rig.spreadTextures[currentSpread];
    rig.leftPage.material.map = halfSpread(texture, 'left');
    rig.rightPage.material.map = halfSpread(texture, 'right');
    rig.leftPage.material.needsUpdate = true;
    rig.rightPage.material.needsUpdate = true;
  }

  function turnPage(direction) {
    const rig = activeRig;
    if (mode !== 'detail' || !readingOpen || !rig || rig.leafActive) return;
    const next = clamp(currentSpread + direction, 0, spreadCount(rig.volume) - 1);
    if (next === currentSpread) return;

    const from = currentSpread;
    currentSpread = next;

    if (reducedMotion) {
      applySpreadTextures();
      updatePageControls(true);
      requestFrame();
      return;
    }

    /* The leaf carries the page it is turning away from on one face and the
       page arriving on the other, so both sides are right mid-turn. */
    rig.leafActive = true;
    rig.turnFrom = from;
    rig.turnTo = next;
    const forward = direction > 0;
    rig.leafFront.material.map = halfSpread(rig.spreadTextures[forward ? from : next], 'right');
    rig.leafBack.material.map = halfSpread(rig.spreadTextures[forward ? next : from], 'left');
    rig.leafFront.material.needsUpdate = true;
    rig.leafBack.material.needsUpdate = true;
    rig.leafPivot.visible = true;
    rig.leafAngle = forward ? 0 : -Math.PI;
    rig.leafTarget = forward ? -Math.PI : 0;
    rig.flex.curve = 0;
    rig.flex.velocity = 0;

    /* The page underneath is already the destination, so it is revealed rather
       than swapped in at the end of the turn. */
    const texture = rig.spreadTextures[next];
    if (forward) {
      rig.rightPage.material.map = halfSpread(texture, 'right');
      rig.rightPage.material.needsUpdate = true;
    } else {
      rig.leftPage.material.map = halfSpread(texture, 'left');
      rig.leftPage.material.needsUpdate = true;
    }

    updatePageControls(true);
    requestFrame();
  }

  /* The bend. A sheet of paper going over is not a flat board on a hinge: it
     bows away from the spine, deepest at the middle of the turn, and springs
     flat as it lands. */
  function updateLeaf(rig, delta) {
    if (!rig.leafActive) return;
    const speed = 7.4;
    rig.leafAngle = damp(rig.leafAngle, rig.leafTarget, speed, delta);

    const progress = Math.abs(rig.leafAngle / -Math.PI);
    const targetCurve = Math.sin(clamp(progress, 0, 1) * Math.PI) * 0.34;
    const step = Math.min(delta, 0.033);
    const acceleration = (targetCurve - rig.flex.curve) * PAGE_CURVE_STIFFNESS
      - rig.flex.velocity * PAGE_CURVE_DAMPING;
    rig.flex.velocity += acceleration * step;
    rig.flex.curve += rig.flex.velocity * step;

    rig.leafPivot.rotation.y = rig.leafAngle;

    const positions = rig.leafGeometry.attributes.position;
    const rest = rig.restPositions;
    const width = rig.volume.width * 0.95;
    for (let index = 0; index < positions.count; index += 1) {
      const x = rest[index * 3];
      const y = rest[index * 3 + 1];
      const along = clamp(x / Math.max(width, 0.0001), 0, 1);
      const bow = Math.sin(along * Math.PI) * rig.flex.curve;
      const taper = 1 - Math.abs(y / (rig.volume.height * 0.5)) * 0.25;
      positions.setZ(index, bow * taper);
    }
    positions.needsUpdate = true;
    rig.leafGeometry.computeVertexNormals();

    if (Math.abs(rig.leafAngle - rig.leafTarget) < 0.004) {
      rig.leafActive = false;
      rig.leafPivot.visible = false;
      rig.flex.curve = 0;
      rig.flex.velocity = 0;
      for (let index = 0; index < positions.count; index += 1) positions.setZ(index, 0);
      positions.needsUpdate = true;
      rig.leafGeometry.computeVertexNormals();
      applySpreadTextures();
    }
  }

  function updateDetailPose(delta) {
    const rig = activeRig;
    if (!rig) return;

    const isBook = rig.volume.kind === 'book';
    const coverTarget = readingOpen ? COVER_OPEN_ANGLE : 0;
    rig.frontPivot.rotation.y = reducedMotion
      ? coverTarget
      : damp(rig.frontPivot.rotation.y, coverTarget, 6.4, delta);

    /* The volume shrinks as it opens, because it is about to become twice as
       wide, and slides right by half a cover so the spread stays centred on
       the spine rather than drifting off the left of the stage. Both damped,
       so the cover swing, the pull-back and the shift read as one movement. */
    const scaleTarget = getInspectScale();
    const nextScale = reducedMotion
      ? scaleTarget
      : damp(rig.root.scale.x, scaleTarget, 6.4, delta);
    rig.root.scale.setScalar(nextScale);

    const shiftTarget = readingOpen && isBook ? rig.volume.width * 0.5 : 0;
    rig.motion.position.x = reducedMotion
      ? shiftTarget
      : damp(rig.motion.position.x, shiftTarget, 6.4, delta);

    const opened = rig.frontPivot.rotation.y < -0.25;
    rig.openGroup.visible = isBook && readingOpen && opened;
    rig.block.visible = !(isBook && readingOpen && opened);
    if (rig.plate) rig.plate.visible = readingOpen && opened;

    updateLeaf(rig, delta);
  }

  /* ------------------------------------------------------------ theatre */

  /* The frame rides on the shelf, so its position is only knowable in world
     space — reading its local transform would aim the player at where the
     picture hangs when nothing has been taken down. */
  function wallFrameCentre() {
    const centre = new THREE.Vector3();
    wallFrame.group.getWorldPosition(centre);
    centre.z += wallFrame.depth;
    return centre;
  }

  function projectWallFrame() {
    if (!wallFrame) return null;
    const half = new THREE.Vector3(wallFrame.width * 0.5, wallFrame.height * 0.5, 0);
    const centre = wallFrameCentre();
    const corners = [
      new THREE.Vector3(centre.x - half.x, centre.y - half.y, centre.z),
      new THREE.Vector3(centre.x + half.x, centre.y - half.y, centre.z),
      new THREE.Vector3(centre.x + half.x, centre.y + half.y, centre.z),
      new THREE.Vector3(centre.x - half.x, centre.y + half.y, centre.z),
    ].map((corner) => {
      const projected = corner.clone().project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * viewWidth,
        y: (-projected.y * 0.5 + 0.5) * viewHeight,
      };
    });
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  function startTheatre() {
    const rig = activeRig;
    if (!rig || rig.volume.kind !== 'video' || !ui.theatre) return;
    playing = true;
    host.classList.add('is-playing');
    wallFrame.group.visible = true;
    controls.enabled = false;

    /* Head-on to the wall panel, so the projected frame is an upright
       rectangle and the player can sit exactly inside it.

       The view offset stays on: without it the frame is centred in the canvas
       and the player runs under the detail panel, which is where the title and
       the stop control live. Distance is derived from the frame's height so it
       fills the safe area on any viewport rather than at one width. */
    const centre = wallFrameCentre();
    const tan = Math.tan(degToRad(camera.fov) * 0.5);
    const safeWidth = viewWidth < 820 ? viewWidth * 0.92 : detailSafeWidth * 0.9;
    const byHeight = wallFrame.height / (2 * tan);
    const byWidth = (wallFrame.width * viewHeight) / (2 * tan * safeWidth);
    const distance = Math.max(byHeight, byWidth) * 1.04;

    camera.position.set(centre.x, centre.y, centre.z + distance);
    transitionCameraTarget.copy(centre);
    currentViewOffsetX = viewWidth < 820 ? 0 : detailViewOffsetX;
    applyViewOffset();
    camera.lookAt(transitionCameraTarget);

    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${rig.volume.id}?autoplay=1&rel=0`;
    frame.title = rig.volume.gloss || rig.volume.title;
    frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    ui.theatre.replaceChildren(frame);
    ui.theatre.hidden = false;
    if (ui.playLabel) ui.playLabel.textContent = 'Stop';
    positionTheatre();
    announceLive(`Playing ${rig.volume.gloss || rig.volume.title}.`);
    requestFrame();
  }

  function positionTheatre() {
    if (!playing || !ui.theatre) return;
    const rect = projectWallFrame();
    if (!rect) return;
    ui.theatre.style.left = `${rect.left}px`;
    ui.theatre.style.top = `${rect.top}px`;
    ui.theatre.style.width = `${rect.width}px`;
    ui.theatre.style.height = `${rect.height}px`;
  }

  function stopTheatre() {
    if (!playing) return;
    playing = false;
    host.classList.remove('is-playing');
    if (wallFrame) wallFrame.group.visible = viewWidth >= 820;
    if (ui.theatre) {
      ui.theatre.replaceChildren();
      ui.theatre.hidden = true;
    }
    if (ui.playLabel) ui.playLabel.textContent = 'Play it here';
    if (mode === 'detail') {
      camera.position.copy(inspectCameraPosition);
      transitionCameraTarget.copy(inspectCameraTarget);
      controls.target.copy(inspectCameraTarget);
      controls.enabled = true;
      currentViewOffsetX = detailViewOffsetX;
      applyViewOffset();
      camera.lookAt(transitionCameraTarget);
    }
    requestFrame();
  }

  /* -------------------------------------------------------- detail panel */

  function populateDetail(volume) {
    if (ui.detailTitle) {
      ui.detailTitle.textContent = volume.title;
      if (volume.titleLang) {
        ui.detailTitle.lang = volume.titleLang;
        ui.detailTitle.dir = 'rtl';
      } else {
        ui.detailTitle.removeAttribute('lang');
        ui.detailTitle.removeAttribute('dir');
      }
    }

    /* Sits under the title, never above it: a line of standing metadata above
       a heading is a kicker, and this system does not use them. */
    if (ui.detailMeta) {
      const meta = volume.gloss || volume.audience || volume.series || '';
      ui.detailMeta.textContent = meta;
      ui.detailMeta.hidden = !meta;
    }

    if (ui.detailDeck) ui.detailDeck.textContent = volume.deck;

    if (ui.detailFacts) {
      ui.detailFacts.replaceChildren();
      (volume.facts || []).forEach((fact) => {
        const term = document.createElement('dt');
        term.textContent = fact.term;
        const value = document.createElement('dd');
        value.textContent = fact.value;
        ui.detailFacts.append(term, value);
      });
      ui.detailFacts.hidden = !(volume.facts && volume.facts.length);
    }

    if (ui.detailAction) {
      const action = volume.kind === 'book'
        ? volume.action
        : { label: 'Watch on YouTube', href: volume.href };
      ui.detailAction.href = action.href;
      ui.detailAction.textContent = action.label;
      if (volume.kind === 'video') {
        ui.detailAction.target = '_blank';
        ui.detailAction.rel = 'noopener';
      } else {
        ui.detailAction.removeAttribute('target');
        ui.detailAction.removeAttribute('rel');
      }
    }

    if (ui.toggle) {
      const readable = volume.kind === 'book' && spreadCount(volume) > 0;
      ui.toggle.hidden = !readable;
    }
    if (ui.play) ui.play.hidden = volume.kind !== 'video';
    if (ui.pages) ui.pages.hidden = volume.kind !== 'book' || spreadCount(volume) === 0;
  }

  function updatePageControls(announce = false) {
    const volume = activeRig?.volume;
    if (!volume) return;
    const total = spreadCount(volume);
    const locked = mode !== 'detail' || !readingOpen || total === 0;

    /* Disabling the control the visitor is standing on drops focus to the
       document, and from there Escape and the arrow keys no longer reach this
       widget at all — a keyboard visitor who turns to the last page gets
       stranded on it. Hand focus to the opposite control before disabling. */
    const active = document.activeElement;
    const prevDisabled = locked || currentSpread === 0;
    const nextDisabled = locked || currentSpread === total - 1;

    /* Apply the disabled states first. Focus cannot land on a disabled button,
       so rescuing focus before enabling the sibling silently does nothing and
       the visitor still ends up on the document. */
    if (ui.prevPage) ui.prevPage.disabled = prevDisabled;
    if (ui.nextPage) ui.nextPage.disabled = nextDisabled;

    /* Turning to the last page disables the control the visitor is standing
       on, which drops focus to the document — and from there neither Escape
       nor the arrow keys reach this widget again. Move them somewhere real. */
    const stranded =
      (active === ui.prevPage && prevDisabled) || (active === ui.nextPage && nextDisabled);
    if (stranded) {
      const fallback = [
        active === ui.prevPage ? ui.nextPage : ui.prevPage,
        ui.toggle,
        ui.close,
      ].find((element) => element && !element.disabled && !element.hidden);
      fallback?.focus({ preventScroll: true });
    }
    if (ui.pageLabel) {
      ui.pageLabel.textContent = readingOpen
        ? volume.spreads?.[currentSpread]?.label || ''
        : 'Closed';
    }
    if (ui.pageCounter) {
      ui.pageCounter.textContent = readingOpen && total
        ? `${pad(currentSpread + 1)} / ${pad(total)}`
        : '';
    }
    if (ui.toggle) {
      ui.toggle.textContent = readingOpen ? 'Close the book' : 'Open the book';
      ui.toggle.setAttribute('aria-pressed', String(readingOpen));
    }
    if (announce && readingOpen) {
      announceLive(
        `Page ${currentSpread + 1} of ${total}: ${volume.spreads?.[currentSpread]?.label || ''}.`
      );
    }
  }

  /* ------------------------------------------------------------- pointer */

  function setPointerFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointer.inside = true;
  }

  function indexAtPointer() {
    if (!pointer.inside) return -1;
    raycaster.setFromCamera(pointer.ndc, camera);
    const targets = rigs.filter((rig) => rig.hit.visible).map((rig) => rig.hit);
    const hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return -1;
    return rigs.findIndex((rig) => rig.hit === hits[0].object);
  }

  function onPointerMove(event) {
    setPointerFromEvent(event);
    if (mode !== 'shelf') return;
    const index = indexAtPointer();
    if (index !== hoveredIndex) {
      hoveredIndex = index;
      canvas.style.cursor = index >= 0 ? 'pointer' : '';
    }
    requestFrame();
  }

  function onPointerLeave() {
    pointer.inside = false;
    hoveredIndex = -1;
    canvas.style.cursor = '';
    requestFrame();
  }

  function onCanvasClick(event) {
    setPointerFromEvent(event);
    if (mode === 'shelf') {
      const index = indexAtPointer();
      if (index < 0) return;
      if (index === selectedIndex) openDetail(canvas);
      else selectIndex(index);
      return;
    }
    if (mode === 'detail' && activeRig?.volume.kind === 'book' && spreadCount(activeRig.volume)) {
      raycaster.setFromCamera(pointer.ndc, camera);
      if (raycaster.intersectObject(activeRig.hit, true).length) setReadingOpen(!readingOpen);
    }
  }

  function onWheel(event) {
    if (mode !== 'shelf') return;
    const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!amount) return;
    event.preventDefault();
    targetPosition += amount * 0.0022;
    wheelIdle = 0.16;
    requestFrame();
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === 'Escape') {
      if (playing) {
        event.preventDefault();
        stopTheatre();
        return;
      }
      if (mode === 'detail') {
        event.preventDefault();
        closeDetail();
      }
      return;
    }

    if (mode === 'detail') {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (!readingOpen) return;
        event.preventDefault();
        turnPage(event.key === 'ArrowLeft' ? -1 : 1);
      }
      return;
    }

    if (mode !== 'shelf') return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(-1);
      updateSelection(Math.round(targetPosition), true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(1);
      updateSelection(Math.round(targetPosition), true);
    }
  }

  /* --------------------------------------------------------------- loop */

  function requestFrame() {
    if (running || destroyed) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function settled() {
    if (mode !== 'shelf') return false;
    if (Math.abs(position - targetPosition) > 0.0006) return false;
    if (hoveredIndex >= 0) return false;
    if (!reducedMotion) return false;
    return true;
  }

  function frame(time) {
    if (destroyed) return;
    const delta = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const elapsed = time / 1000;

    if (!suspended) {
      updateTheme(delta);

      /* Transitions run on wall-clock, not on accumulated frame deltas. Delta
         is clamped so a stalled frame cannot fling the carousel across the
         shelf — but feeding that clamped value into a fixed-length transition
         means a slow device stretches a 0.92s open into three seconds. The
         damped motion below still uses delta; the scripted moves use the
         clock. */
      if (mode === 'opening') {
        transitionTime = clamp((time - transitionStart) / (TRANSITION_DURATION * 1000), 0, 1);
        applyOpeningPose(transitionTime);
        if (transitionTime >= 1) finishOpening();
      } else if (mode === 'closing') {
        transitionTime = clamp((time - transitionStart) / (TRANSITION_DURATION * 1000), 0, 1);
        applyClosingPose(transitionTime);
        if (transitionTime >= 1) finishClosing();
      } else if (mode === 'shelf') {
        shelfStage.position.y = damp(shelfStage.position.y, 0, 10, delta);
        shelfStage.position.z = damp(shelfStage.position.z, 0, 10, delta);
        camera.position.x = damp(camera.position.x, shelfCameraPosition.x, 8, delta);
        camera.position.y = damp(camera.position.y, shelfCameraPosition.y, 8, delta);
        camera.position.z = damp(camera.position.z, shelfCameraPosition.z, 8, delta);
        transitionCameraTarget.copy(shelfCameraTarget);
        currentViewOffsetX = 0;
        applyViewOffset();
        camera.lookAt(shelfCameraTarget);
      } else if (mode === 'detail') {
        updateDetailPose(delta);
        if (controls.enabled) controls.update();
        if (playing) positionTheatre();
      }

      updateShelfLayout(delta, elapsed);
      renderer.render(scene, camera);
    }

    if (settled()) {
      running = false;
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------- resize */

  function resize() {
    const bounds = host.getBoundingClientRect();
    viewWidth = Math.max(1, Math.round(bounds.width));
    viewHeight = Math.max(1, Math.round(bounds.height));
    configureResponsiveTargets();
    camera.aspect = viewWidth / viewHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(viewWidth, viewHeight, false);
    if (mode === 'shelf') {
      camera.position.copy(shelfCameraPosition);
      camera.lookAt(shelfCameraTarget);
    }
    requestFrame();
  }

  function onVisibility() {
    suspended = document.hidden;
    if (!suspended) {
      lastTime = performance.now();
      requestFrame();
    }
  }

  function onReducedMotionChange(event) {
    reducedMotion = event.matches;
    requestFrame();
  }

  /* --------------------------------------------------------------- init */

  async function initialize() {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      throw new Error('WebGL is unavailable');
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdccdae, 0.02);

    const pmrem = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.58;
    pmrem.dispose();

    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    shelfStage = new THREE.Group();
    scene.add(shelfStage);

    configureResponsiveTargets();
    camera.position.copy(shelfCameraPosition);
    camera.lookAt(shelfCameraTarget);
    transitionCameraTarget.copy(shelfCameraTarget);

    controls = new OrbitControls(camera, canvas);
    controls.enabled = false;
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 2.4;
    controls.maxDistance = 6.4;
    controls.minPolarAngle = Math.PI * 0.26;
    controls.maxPolarAngle = Math.PI * 0.74;
    controls.target.copy(shelfCameraTarget);
    controls.addEventListener('change', requestFrame);

    addRoom();
    addLights();

    rigs = [];
    for (let index = 0; index < volumes.length; index += 1) {
      if (destroyed) return;
      const rig = await createRig(volumes[index], index);
      shelfStage.add(rig.root);
      rigs.push(rig);
    }

    updateSelection(0, false);
    applyTheme(volumes[0], true);
    resize();

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', onCanvasClick);
    host.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    ui.prev?.addEventListener('click', () => {
      navigate(-1);
      updateSelection(Math.round(targetPosition), true);
    });
    ui.next?.addEventListener('click', () => {
      navigate(1);
      updateSelection(Math.round(targetPosition), true);
    });
    ui.open?.addEventListener('click', () => openDetail(ui.open));
    ui.close?.addEventListener('click', () => closeDetail());
    ui.toggle?.addEventListener('click', () => setReadingOpen(!readingOpen));
    ui.prevPage?.addEventListener('click', () => turnPage(-1));
    ui.nextPage?.addEventListener('click', () => turnPage(1));
    ui.play?.addEventListener('click', () => (playing ? stopTheatre() : startTheatre()));
    ui.markers?.addEventListener('click', (event) => {
      const marker = event.target.closest('[data-index]');
      if (!marker) return;
      selectIndex(Number(marker.dataset.index));
      updateSelection(Number(marker.dataset.index), true);
    });

    host.dataset.state = 'ready';
    requestFrame();
    callbacks.onReady?.();
  }

  function dispose() {
    destroyed = true;
    cancelAnimationFrame(rafId);
    stopTheatre();
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('click', onCanvasClick);
    host.removeEventListener('wheel', onWheel);
    host.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
    controls?.dispose();
    disposables.forEach((item) => item.dispose?.());
    environmentTarget?.dispose();
    renderer?.dispose();
  }

  const ready = initialize();

  return { ready, resize, dispose };
}
