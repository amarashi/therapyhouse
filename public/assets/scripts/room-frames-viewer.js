/**
 * Room frames viewer.
 *
 * Scrubs through a short arc of pre-rendered stills so the visitor can look
 * around a room. Same idea as the exterior turntable in
 * `assets/scripts/turntable-viewer.js`, just over a much narrower arc.
 *
 * There is deliberately no WebGL here. The frames are rendered offline by
 * src/render_frames.py, so at runtime this is a canvas and some decoded WebPs,
 * which every phone handles without breaking a sweat.
 *
 * Plain ES module, no dependencies, no build step.
 */

const DEFAULTS = {
    // Fraction of the container width that sweeps the whole arc when dragging.
    dragSweep: 0.75,
    idleDrift: true,
    idleDelayMs: 2500,
    idlePeriodMs: 30000,
    // How much of the arc the idle drift uses, so it never sits at the extremes.
    idleAmplitude: 0.7,
    easing: 0.16,
    wheelStep: 0.6,
    tier: 'auto',
    onReady: null,
    onProgress: null,
    onFallback: null,
    // Fires after every repaint, so callers can reposition anything anchored to
    // the room (hotspots, labels) as the view moves.
    onFrame: null,
    // The coordinate space trackPoint() expects, as [width, height]. Defaults to
    // the room image's real pixel size, but the site addresses every room in a
    // fixed 1672x940 space regardless of the file's actual dimensions, and two
    // of the room images are in fact smaller than that. Pass the space your
    // coordinates are written in.
    coordinateSize: null,
};

export function prefersMobileTier() {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820;
    const lowMemory = (navigator.deviceMemory || 8) <= 4;
    return (coarsePointer && smallScreen) || lowMemory;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Load rooms.json and return one room entry. */
export async function loadRoom(manifestUrl, roomId) {
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error(`Could not load ${manifestUrl}: ${response.status}`);
    const manifest = await response.json();
    const rooms = manifest.rooms || [];
    const room = roomId ? rooms.find((r) => r.id === roomId) : rooms[0];
    if (!room) throw new Error(`Room ${roomId || '(first)'} not found in ${manifestUrl}`);
    return room;
}

function framePath(pattern, index, pad) {
    return pattern.replace('{i}', String(index).padStart(pad, '0'));
}

/**
 * @param {object} options
 * @param {HTMLElement} options.container
 * @param {object} options.room a room entry from rooms.json, with a `frames` block
 * @param {string} [options.basePath] defaults to './rooms/'
 */
export function createRoomFramesViewer(options) {
    const settings = Object.assign({}, DEFAULTS, options);
    const container = settings.container;
    const room = settings.room;
    const basePath = settings.basePath || './rooms/';

    if (!container) throw new Error('createRoomFramesViewer needs a container element');
    if (!room || !room.frames) throw new Error('This room has no frames block in rooms.json');

    const spec = room.frames;
    const useMobile = settings.tier === 'mobile' ||
        (settings.tier === 'auto' && prefersMobileTier() && spec.mobile);
    const tier = useMobile && spec.mobile ? spec.mobile : spec.desktop;

    const count = spec.count;
    const centre = spec.centreIndex != null ? spec.centreIndex : (count - 1) >> 1;
    const pad = spec.pad != null ? spec.pad : String(count - 1).length;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: false });

    const frames = new Array(count).fill(null);
    let loadedCount = 0;
    let currentIndex = centre;   // eased, fractional
    let targetIndex = centre;
    let lastInteraction = performance.now();
    let idlePhase = 0;
    let lastFrameTime = performance.now();
    let rafId = 0;
    let running = true;
    let destroyed = false;

    const handle = { usedFallback: false, destroy: () => {} };

    function showPoster(reason) {
        running = false;
        cancelAnimationFrame(rafId);
        if (canvas.parentNode === container) container.removeChild(canvas);
        if (room.poster) {
            const img = document.createElement('img');
            img.src = basePath + room.poster;
            img.alt = room.title || 'Room';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
            container.appendChild(img);
        }
        handle.usedFallback = true;
        if (settings.onFallback) settings.onFallback(reason);
    }

    function sizeCanvas() {
        const ratio = Math.min(window.devicePixelRatio || 1, useMobile ? 1.5 : 2);
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
    }
    sizeCanvas();

    let sizeObserver = null;
    if (window.ResizeObserver) {
        sizeObserver = new ResizeObserver(() => { sizeCanvas(); draw(true); });
        sizeObserver.observe(container);
    }

    /** Nearest loaded frame to `index`, so scrubbing never shows a blank. */
    function nearestLoaded(index) {
        const rounded = Math.min(count - 1, Math.max(0, Math.round(index)));
        if (frames[rounded]) return { image: frames[rounded], index: rounded };
        for (let offset = 1; offset < count; offset++) {
            if (frames[rounded - offset]) return { image: frames[rounded - offset], index: rounded - offset };
            if (frames[rounded + offset]) return { image: frames[rounded + offset], index: rounded + offset };
        }
        return null;
    }

    // Where the last drawn frame sits on the canvas, so trackPoint() can map
    // frame pixels to page pixels without recomputing the fit.
    let placement = null;
    // Index of the frame currently on screen. Anchored points must be projected
    // for this, not for the fractional index, or they slide between frame steps
    // while the image sits still.
    let drawnIndex = centre;

    function draw() {
        const found = nearestLoaded(currentIndex);
        if (!found) return;
        const image = found.image;
        const cw = canvas.width;
        const ch = canvas.height;
        // Cover-fit: fill the container, cropping the overflow.
        const scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight);
        const dw = image.naturalWidth * scale;
        const dh = image.naturalHeight * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.drawImage(image, dx, dy, dw, dh);
        placement = { dx, dy, scale, frameWidth: image.naturalWidth, frameHeight: image.naturalHeight };
        drawnIndex = found.index;
        if (settings.onFrame) {
            settings.onFrame({ index: drawnIndex, trackPoint });
        }
    }

    // --- Point tracking -----------------------------------------------------
    // Reprojects a point given in the source room image's coordinates into
    // wherever it currently appears on screen. The maths mirrors
    // render_frames.py: unproject with depth, orbit the camera, project back.

    const projection = room.projection || null;
    let depthPixels = null;   // Uint8ClampedArray of the packed depth image
    let depthReady = false;

    const coordW = (settings.coordinateSize && settings.coordinateSize[0]) ||
        (room.sourceSize && room.sourceSize[0]) ||
        (projection && projection.gridWidth) || 1;
    const coordH = (settings.coordinateSize && settings.coordinateSize[1]) ||
        (room.sourceSize && room.sourceSize[1]) ||
        (projection && projection.gridHeight) || 1;

    function loadDepthMap() {
        if (!projection || !projection.depth) return;
        const img = new Image();
        img.onload = () => {
            const off = document.createElement('canvas');
            off.width = projection.depth.width;
            off.height = projection.depth.height;
            const octx = off.getContext('2d', { willReadFrequently: true });
            octx.drawImage(img, 0, 0);
            depthPixels = octx.getImageData(0, 0, off.width, off.height).data;
            depthReady = true;
            // The depth map usually lands after the first paint, and a still
            // view schedules no further paints, so anchored elements would sit
            // unplaced until the visitor touched something. Nudge them now.
            if (placement) draw();
        };
        img.src = basePath + projection.depth.src;
    }
    loadDepthMap();

    /** Depth in DA3 units at a point given in source-image coordinates. */
    function depthAt(sourceX, sourceY) {
        if (!depthReady) return null;
        const spec = projection.depth;
        const px = Math.min(spec.width - 1, Math.max(0, Math.round(sourceX / coordW * spec.width)));
        const py = Math.min(spec.height - 1, Math.max(0, Math.round(sourceY / coordH * spec.height)));
        const base = (py * spec.width + px) * 4;
        // 16-bit packed across red (high byte) and green (low byte).
        const packed = (depthPixels[base] << 8) | depthPixels[base + 1];
        return spec.min + (packed / 65535) * (spec.max - spec.min);
    }

    /**
     * Track a point on the room. Give it coordinates in the source room image's
     * space (the same ones the hotspots already use) and it returns where that
     * point is on screen right now, in CSS pixels relative to the container.
     *
     * @returns {{x: number, y: number, onScreen: boolean}|null}
     */
    function trackPoint(sourceX, sourceY) {
        if (!projection || !placement) return null;
        const z = depthAt(sourceX, sourceY);
        if (z === null) return null;

        const gw = projection.gridWidth;
        const gh = projection.gridHeight;
        const f = projection.focal;

        // Hotspot space -> DA3 grid -> camera-space ray at that depth.
        const gx = sourceX / coordW * gw;
        const gy = sourceY / coordH * gh;
        const X = (gx - gw / 2) * z / f;
        const Y = (gy - gh / 2) * z / f;

        // Orbit the camera to the angle this frame was rendered at.
        const spec = room.frames;
        const angle = (drawnIndex - spec.centreIndex) * spec.stepDegrees * Math.PI / 180;
        const T = projection.targetDepth;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const camX = -T * sin;
        const camZ = T - T * cos;

        // Camera basis, matching the renderer: x right, y down, z forward.
        let zx = 0 - camX, zy = 0, zz = T - camZ;
        const zlen = Math.hypot(zx, zy, zz) || 1;
        zx /= zlen; zy /= zlen; zz /= zlen;
        // x = cross(down, forward) with down = (0, 1, 0)
        let xx = 1 * zz - 0 * zy, xy = 0 * zx - 0 * zz, xz = 0 * zy - 1 * zx;
        const xlen = Math.hypot(xx, xy, xz) || 1;
        xx /= xlen; xy /= xlen; xz /= xlen;
        // y = cross(forward, x)
        const yx = zy * xz - zz * xy;
        const yy = zz * xx - zx * xz;
        const yz = zx * xy - zy * xx;

        const px = X - camX, py = Y - 0, pz = z - camZ;
        const lx = xx * px + xy * py + xz * pz;
        const ly = yx * px + yy * py + yz * pz;
        const lz = zx * px + zy * py + zz * pz;
        if (lz <= 1e-6) return { x: 0, y: 0, onScreen: false };

        const u = f * lx / lz + gw / 2;
        const v = f * ly / lz + gh / 2;

        // Apply the same centre-crop the renderer used, then map into the frame.
        const cover = projection.cover;
        const keepW = Math.round(gw * cover);
        const keepH = Math.round(gh * cover);
        const x0 = (gw - keepW) / 2;
        const y0 = (gh - keepH) / 2;
        const frameX = (u - x0) * placement.frameWidth / keepW;
        const frameY = (v - y0) * placement.frameHeight / keepH;

        // Frame pixels -> canvas pixels -> CSS pixels within the container.
        const canvasX = placement.dx + frameX * placement.scale;
        const canvasY = placement.dy + frameY * placement.scale;
        const cssX = canvasX / canvas.width * (container.clientWidth || 1);
        const cssY = canvasY / canvas.height * (container.clientHeight || 1);

        return {
            x: cssX,
            y: cssY,
            onScreen: cssX >= 0 && cssY >= 0 &&
                cssX <= (container.clientWidth || 0) && cssY <= (container.clientHeight || 0),
        };
    }

    function loadFrame(index) {
        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                frames[index] = img;
                loadedCount++;
                if (settings.onProgress) settings.onProgress(loadedCount / count * 100);
                resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = basePath + framePath(tier.pattern, index, pad);
        });
    }

    // Centre frame first so something is on screen immediately, then fill
    // outwards so the frames nearest the current view arrive first.
    async function loadAll() {
        const ok = await loadFrame(centre);
        if (destroyed) return;
        if (!ok) { showPoster('frame-load-failed'); return; }
        draw();
        if (settings.onReady) {
            settings.onReady({ tier: useMobile ? 'mobile' : 'desktop', count });
        }

        const order = [];
        for (let offset = 1; offset <= count; offset++) {
            if (centre - offset >= 0) order.push(centre - offset);
            if (centre + offset < count) order.push(centre + offset);
        }
        for (const index of order) {
            if (destroyed) return;
            await loadFrame(index);
        }
    }

    // --- Interaction --------------------------------------------------------

    let dragging = false;
    let dragStartX = 0;
    let dragStartIndex = centre;

    function noteInteraction() { lastInteraction = performance.now(); }

    function onPointerDown(event) {
        dragging = true;
        dragStartX = event.clientX;
        dragStartIndex = targetIndex;
        noteInteraction();
        canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (!dragging) return;
        const sweepPx = Math.max((container.clientWidth || 1) * settings.dragSweep, 1);
        const delta = (event.clientX - dragStartX) / sweepPx * (count - 1);
        // Drag right to look right, which means stepping back through the arc.
        targetIndex = Math.min(count - 1, Math.max(0, dragStartIndex - delta));
        noteInteraction();
    }

    function onPointerUp(event) {
        dragging = false;
        noteInteraction();
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    }

    function onWheel(event) {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        targetIndex = Math.min(count - 1, Math.max(0,
            targetIndex + Math.sign(event.deltaX) * settings.wheelStep));
        noteInteraction();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // --- Frame loop ---------------------------------------------------------

    const driftEnabled = settings.idleDrift && !prefersReducedMotion();

    function tick() {
        if (!running) return;
        rafId = requestAnimationFrame(tick);

        const now = performance.now();
        const deltaMs = Math.min(now - lastFrameTime, 100);
        lastFrameTime = now;

        if (driftEnabled && !dragging && now - lastInteraction > settings.idleDelayMs) {
            idlePhase += (deltaMs / settings.idlePeriodMs) * Math.PI * 2;
            const halfRange = (count - 1) / 2;
            targetIndex = centre + Math.sin(idlePhase) * halfRange * settings.idleAmplitude;
        }

        const previous = currentIndex;
        currentIndex += (targetIndex - currentIndex) * settings.easing;
        // Repaint only when the visible frame changes. draw() notifies onFrame,
        // so anchored elements stay in step with what is actually on screen.
        if (Math.round(previous) !== Math.round(currentIndex) || previous === currentIndex) {
            draw();
        }
    }

    loadAll();
    tick();

    handle.destroy = () => {
        destroyed = true;
        running = false;
        cancelAnimationFrame(rafId);
        if (sizeObserver) sizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('wheel', onWheel);
        if (canvas.parentNode === container) container.removeChild(canvas);
        frames.fill(null);
        return Promise.resolve();
    };
    handle.setIndex = (index) => {
        targetIndex = Math.min(count - 1, Math.max(0, index));
        noteInteraction();
    };
    handle.getState = () => ({
        currentIndex, targetIndex, loadedCount, count,
        tier: useMobile ? 'mobile' : 'desktop',
        depthReady,
    });
    handle.trackPoint = trackPoint;

    return handle;
}
