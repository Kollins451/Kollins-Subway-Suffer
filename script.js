
/* Kollins Runner 3D — Three.js r128 */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const LANES = [-3.3, 0, 3.3];
  const SAVE = {
    coins: 'kollinsRunnerCoins',
    best: 'kollinsRunnerBest'
  };

  let scene, camera, renderer, clock, player, police, roadGroup;
  let running = false;
  let paused = false;
  let gameEnded = false;

  let lane = 1;
  let score = 0;
  let runCoins = 0;
  let banked = Number(localStorage.getItem(SAVE.coins) || 0);
  let best = Number(localStorage.getItem(SAVE.best) || 0);

  let speed = 17;
  let elapsed = 0;
  let spawnClock = 0;
  let coinClock = 0;
  let jumpY = 0;
  let jumpV = 0;
  let slideTime = 0;
  let invulnerable = 0;

  let obstacles = [];
  let coins = [];
  let scenery = [];
  let particles = [];

  let audioCtx = null;
  let lastTime = 0;
  let frameId = 0;
  let toastTimer = 0;

  const mat = (
    color,
    roughness = .72,
    metalness = .05,
    emissive = 0
  ) => new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity: emissive ? .45 : 0
  });

  function init() {
    if (renderer) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8bc8e4);
    scene.fog = new THREE.Fog(0x8bc8e4, 42, 190);

    camera = new THREE.PerspectiveCamera(
      62,
      innerWidth / innerHeight,
      .1,
      500
    );

    camera.position.set(0, 5.6, 10.5);
    camera.lookAt(0, 1.5, -15);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    renderer.domElement.setAttribute(
      'aria-label',
      '3D subway runner game'
    );

    $('game-root').prepend(renderer.domElement);

    scene.add(
      new THREE.HemisphereLight(
        0xd9f3ff,
        0x39404a,
        1.45
      )
    );

    const sun = new THREE.DirectionalLight(0xffefcf, 2.1);
    sun.position.set(-14, 28, 12);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6fcaff, .55);
    fill.position.set(12, 10, -25);
    scene.add(fill);

    clock = new THREE.Clock();

    createWorld();
    createRunner();
    createPolice();
    setupEvents();
    updateBank();
    resize();

    frameId = requestAnimationFrame(loop);
  }

  function mesh(
    geometry,
    material,
    parent,
    x = 0,
    y = 0,
    z = 0
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  function createWorld() {
    roadGroup = new THREE.Group();
    scene.add(roadGroup);

    const road = mesh(
      new THREE.PlaneGeometry(34, 1200),
      mat(0x343a43),
      roadGroup,
      0,
      -.12,
      -480
    );

    road.rotation.x = -Math.PI / 2;

    const ground = mesh(
      new THREE.PlaneGeometry(90, 1200),
      mat(0x52614d),
      roadGroup,
      0,
      -.22,
      -480
    );

    ground.rotation.x = -Math.PI / 2;

    // Track sleepers
    for (let z = 15; z > -650; z -= 3.2) {
      mesh(
        new THREE.BoxGeometry(10.8, .16, .55),
        mat(0x6c5745),
        roadGroup,
        0,
        -.02,
        z
      );
    }

    // Railway tracks
    for (const x of [-5.05, 5.05]) {
      mesh(
        new THREE.BoxGeometry(.22, .2, 1200),
        mat(0x9daab4, .28, .72),
        roadGroup,
        x,
        .08,
        -480
      );
    }

    for (const x of [-1.65, 1.65]) {
      mesh(
        new THREE.BoxGeometry(.045, .025, 1200),
        mat(0xbfc5c8),
        roadGroup,
        x,
        .015,
        -480
      );
    }

    // Railway markers
    for (let z = 10; z > -650; z -= 18) {
      for (const x of [-6.1, 6.1]) {
        mesh(
          new THREE.BoxGeometry(.16, 3.4, .16),
          mat(0x3c4651),
          roadGroup,
          x,
          1.7,
          z
        );

        mesh(
          new THREE.BoxGeometry(.38, .2, .22),
          mat(0xf2d36d, .4, 0, 0x9d6e00),
          roadGroup,
          x,
          3.45,
          z
        );
      }
    }

    // Buildings and lamps
    for (let z = -20; z > -650; z -= 34) {
      createBuilding(-13 - Math.random() * 4, z, 'left');
      createBuilding(13 + Math.random() * 4, z, 'right');

      createLamp(-7.1, z);
      createLamp(7.1, z - 15);
    }

    // Distant skyline
    for (let i = 0; i < 32; i++) {
      const h = 9 + Math.random() * 23;
      const w = 4 + Math.random() * 7;

      const b = mesh(
        new THREE.BoxGeometry(w, h, 8),
        mat(i % 3 ? 0x7d929d : 0x657c8c),
        scene,
        (Math.random() > .5 ? 1 : -1) *
          (25 + Math.random() * 30),
        h / 2,
        -100 - Math.random() * 400
      );

      scenery.push(b);
    }
  }

  function createBuilding(x, z, side) {
    const g = new THREE.Group();

    const w = 4 + Math.random() * 4;
    const h = 8 + Math.random() * 18;
    const d = 8 + Math.random() * 7;

    scene.add(g);

    mesh(
      new THREE.BoxGeometry(w, h, d),
      mat([
        0x59636c,
        0x697680,
        0x455461,
        0x7c7770
      ][Math.floor(Math.random() * 4)]),
      g,
      0,
      h / 2,
      0
    );

    const winmat = mat(0x9bcfe2, .45, .05, 0x183d55);

    for (let y = 1.8; y < h - 1; y += 2.1) {
      for (
        let xx = -w / 2 + .65;
        xx < w / 2 - .3;
        xx += 1.15
      ) {
        mesh(
          new THREE.BoxGeometry(.62, .78, .045),
          winmat,
          g,
          xx,
          y,
          -d / 2 - .03
        );
      }
    }

    g.position.set(x, 0, z);
    g.userData = { side };

    scenery.push(g);
  }

  function createLamp(x, z) {
    const g = new THREE.Group();
    scene.add(g);

    mesh(
      new THREE.CylinderGeometry(.07, .11, 5.4, 8),
      mat(0x4c5862),
      g,
      0,
      2.7,
      0
    );

    mesh(
      new THREE.BoxGeometry(.9, .13, .2),
      mat(0x515c67),
      g,
      x < 0 ? .35 : -.35,
      5.3,
      0
    );

    mesh(
      new THREE.BoxGeometry(.48, .18, .35),
      mat(0xffe7a1, .3, .1, 0xffc04c),
      g,
      x < 0 ? .65 : -.65,
      5.2,
      0
    );

    g.position.set(x, 0, z);
    scenery.push(g);
  }

  function createRunner() {
    player = new THREE.Group();
    scene.add(player);

    player.position.set(0, 0, 0);
    player.userData = { parts: {} };

    const hoodie = mat(0x11b6d5);
    const dark = mat(0x172331);
    const skin = mat(0xb97853);
    const shoe = mat(0xf4f5f7);
    const hair = mat(0x191716);
    const gold = mat(0xffc93d);

    // Body
    mesh(
      new THREE.BoxGeometry(.78, .95, .46),
      hoodie,
      player,
      0,
      1.36,
      0
    );

    mesh(
      new THREE.BoxGeometry(.58, .25, .5),
      mat(0x087e9a),
      player,
      0,
      1.82,
      0
    );

    // Head
    mesh(
      new THREE.SphereGeometry(.34, 20, 16),
      skin,
      player,
      0,
      2.12,
      0
    );

    mesh(
      new THREE.SphereGeometry(.36, 16, 12),
      hair,
      player,
      0,
      2.34,
      -.025
    );

    // Headband
    mesh(
      new THREE.BoxGeometry(.52, .09, .08),
      gold,
      player,
      0,
      2.43,
      .25
    );

    // Legs
    const legs = [];

    for (const x of [-.2, .2]) {
      const leg = new THREE.Group();

      leg.position.set(x, .85, 0);
      player.add(leg);

      mesh(
        new THREE.BoxGeometry(.22, .7, .24),
        dark,
        leg,
        0,
        -.25,
        0
      );

      mesh(
        new THREE.BoxGeometry(.3, .16, .42),
        shoe,
        leg,
        0,
        -.61,
        .08
      );

      legs.push(leg);
    }

    player.userData.parts.legs = legs;

    // Arms
    const arms = [];

    for (const x of [-.52, .52]) {
      const arm = new THREE.Group();

      arm.position.set(x, 1.62, 0);
      player.add(arm);

      mesh(
        new THREE.BoxGeometry(.18, .62, .2),
        hoodie,
        arm,
        0,
        -.24,
        0
      );

      mesh(
        new THREE.SphereGeometry(.12, 10, 8),
        skin,
        arm,
        0,
        -.55,
        .02
      );

      arms.push(arm);
    }

    player.userData.parts.arms = arms;
  }

  function createPolice() {
    police = new THREE.Group();
    scene.add(police);

    police.position.set(0, 0, 6.5);

    mesh(
      new THREE.BoxGeometry(.65, 1.05, .42),
      mat(0x243f79),
      police,
      0,
      1.15,
      0
    );

    mesh(
      new THREE.SphereGeometry(.31, 16, 12),
      mat(0xb97853),
      police,
      0,
      1.95,
      0
    );

    mesh(
      new THREE.BoxGeometry(.68, .17, .48),
      mat(0x18253d),
      police,
      0,
      2.17,
      0
    );

    mesh(
      new THREE.BoxGeometry(.48, .12, .5),
      mat(0x101b2b),
      police,
      0,
      2.29,
      0
    );
  }

  function resetRun() {
    clearRunObjects();

    running = true;
    paused = false;
    gameEnded = false;

    lane = 1;
    score = 0;
    runCoins = 0;
    speed = 17;

    elapsed = 0;
    spawnClock = .65;
    coinClock = 1.5;

    jumpY = 0;
    jumpV = 0;
    slideTime = 0;
    invulnerable = 0;

    player.position.set(0, 0, 0);
    player.visible = true;

    police.position.set(0, 0, 6.5);

    $('menu-screen').classList.add('hidden');
    $('pause-screen').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');

    $('mobile-controls').classList.remove('hidden');
    $('pause-btn').classList.remove('hidden');
    $('status-chip').classList.add('hidden');

    activateAudio();
    updateHUD();
  }

  function clearRunObjects() {
    for (const o of [...obstacles, ...coins, ...particles]) {
      scene.remove(o);
    }

    obstacles = [];
    coins = [];
    particles = [];
  }

  function spawnObstacle() {
    const l = Math.floor(Math.random() * 3);
    const type = Math.random();

    if (type < .42) {
      makeTrain(l);
    } else if (type < .72) {
      makeBarrier(l);
    } else {
      makeTraffic(l);
    }
  }

  function makeTrain(l) {
    const g = new THREE.Group();
    scene.add(g);

    const colors = [0x226f91, 0x8d3d43, 0x536b79];

    mesh(
      new THREE.BoxGeometry(2.65, 3.55, 9.5),
      mat(colors[Math.floor(Math.random() * 3)], .35, .4),
      g,
      0,
      1.78,
      0
    );

    mesh(
      new THREE.BoxGeometry(2.3, 1.1, .15),
      mat(0x1d2a36, .3, .2),
      g,
      0,
      2.55,
      4.78
    );

    for (const x of [-.78, .78]) {
      mesh(
        new THREE.BoxGeometry(.35, .28, .1),
        mat(0xffeab2, .25, .05, 0xffd05a),
        g,
        x,
        .85,
        4.82
      );

      mesh(
        new THREE.BoxGeometry(.45, .45, .08),
        mat(0x9fd5e8, .25, .3),
        g,
        x,
        2.25,
        4.86
      );
    }

    g.position.set(LANES[l], 0, -115);

    obstacles.push({
      mesh: g,
      lane: l,
      type: 'train',
      halfZ: 5,
      halfY: 1.8
    });
  }

  function makeBarrier(l) {
    const g = new THREE.Group();
    scene.add(g);

    mesh(
      new THREE.BoxGeometry(2.35, .95, 1.1),
      mat(0xffb72e),
      g,
      0,
      .63,
      0
    );

    mesh(
      new THREE.BoxGeometry(2.4, .16, 1.14),
      mat(0x242b32),
      g,
      0,
      .2,
      0
    );

    for (const x of [-.75, .75]) {
      mesh(
        new THREE.BoxGeometry(.2, .2, 1.15),
        mat(0xf3f4f5),
        g,
        x,
        .65,
        0
      );
    }

    g.position.set(LANES[l], 0, -110);

    obstacles.push({
      mesh: g,
      lane: l,
      type: 'barrier',
      halfZ: .7,
      halfY: .6
    });
  }

  function makeTraffic(l) {
    const g = new THREE.Group();
    scene.add(g);

    const paint = mat([
      0xe34c4c,
      0xe0a43c,
      0x3c86d5,
      0x49a17a
    ][Math.floor(Math.random() * 4)], .3, .25);

    mesh(
      new THREE.BoxGeometry(1.95, .68, 3.7),
      paint,
      g,
      0,
      .58,
      0
    );

    mesh(
      new THREE.BoxGeometry(1.45, .58, 1.55),
      mat(0x24313b, .25, .25),
      g,
      0,
      1.13,
      -.15
    );

    mesh(
      new THREE.BoxGeometry(1.3, .32, .04),
      mat(0x9ed4e7, .25, .2),
      g,
      0,
      1.17,
      .64
    );

    for (const x of [-1, 1]) {
      for (const z of [-1.15, 1.15]) {
        const w = mesh(
          new THREE.CylinderGeometry(.3, .3, .18, 12),
          mat(0x15191d),
          g,
          x,
          .32,
          z
        );

        w.rotation.z = Math.PI / 2;
      }
    }

    g.position.set(LANES[l], 0, -108);

    obstacles.push({
      mesh: g,
      lane: l,
      type: 'car',
      halfZ: 1.9,
      halfY: .8
    });
  }

  function spawnCoinPattern() {
    const l = Math.floor(Math.random() * 3);
    const pattern = Math.random();

    for (let i = 0; i < 8; i++) {
      const y = pattern < .22 ? 2.1 : 1.15;

      const coin = mesh(
        new THREE.TorusGeometry(.34, .105, 10, 20),
        mat(0xffd84b, .22, .8, 0x8b5c00),
        scene,
        LANES[l],
        y,
        -90 - i * 3.1
      );

      coin.rotation.x = Math.PI / 2;
      coin.userData.baseY = y;

      coins.push(coin);
    }
  }

  function jump() {
    if (!running || paused || jumpY > 0 || slideTime > 0) {
      return;
    }

    jumpV = 9.3;

    showToast('JUMP');
    sound(480, .07, 'sine');
  }

  function slide() {
    if (!running || paused || slideTime > 0 || jumpY > .15) {
      return;
    }

    slideTime = .72;

    showToast('SLIDE');
  }

  function move(dir) {
    if (!running || paused) return;

    lane = Math.max(0, Math.min(2, lane + dir));

    sound(260 + lane * 80, .045, 'sine');
  }

  function update(dt) {
    elapsed += dt;

    speed = Math.min(30, speed + dt * .22);

    score += Math.floor(dt * speed * 1.3);

    spawnClock -= dt;
    coinClock -= dt;

    if (spawnClock <= 0) {
      spawnObstacle();

      spawnClock =
        Math.max(.72, 1.25 - (speed - 17) * .025) +
        Math.random() * .28;
    }

    if (coinClock <= 0) {
      spawnCoinPattern();
      coinClock = 2.5 + Math.random() * 1.2;
    }

    const target = LANES[lane];

    player.position.x +=
      (target - player.position.x) * Math.min(1, dt * 12);

    player.position.y = jumpY;

    if (jumpY > 0 || jumpV > 0) {
      jumpY += jumpV * dt;
      jumpV -= 24 * dt;

      if (jumpY <= 0) {
        jumpY = 0;
        jumpV = 0;
      }
    }

    slideTime = Math.max(0, slideTime - dt);
    invulnerable = Math.max(0, invulnerable - dt);

    const crouch = slideTime > 0;

    player.scale.y = crouch ? .58 : 1;

    player.position.y = crouch ? -.25 : jumpY;

    const t = elapsed * 11;

    player.userData.parts.legs.forEach((p, i) => {
      p.rotation.x =
        Math.sin(t + i * Math.PI) *
        .75 *
        (crouch ? .2 : 1);
    });

    player.userData.parts.arms.forEach((p, i) => {
      p.rotation.x = Math.sin(t + i * Math.PI) * .55;
    });

    player.rotation.z +=
      (LANES[lane] - player.position.x) * -.035;

    police.position.x +=
      (player.position.x - police.position.x) * dt * 1.7;

    police.position.z = 6.5 - Math.min(2.2, score / 1600);

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];

      o.mesh.position.z += speed * dt;

      if (o.mesh.position.z > 13) {
        scene.remove(o.mesh);
        obstacles.splice(i, 1);
        continue;
      }

      if (
        o.lane === lane &&
        Math.abs(o.mesh.position.z) < (o.halfZ + 1.1) &&
        invulnerable <= 0
      ) {
        const safeJump =
          o.type === 'barrier' && jumpY > .72;

        const safeSlide =
          o.type === 'barrier' && slideTime > 0;

        if (!safeJump && !safeSlide) {
          hit();
          return;
        }
      }
    }

    // Move and collect coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];

      c.position.z += speed * dt;
      c.rotation.z += dt * 3;

      if (c.position.z > 12) {
        scene.remove(c);
        coins.splice(i, 1);
        continue;
      }

      if (
        Math.abs(c.position.z) < 1.25 &&
        Math.abs(c.position.x - player.position.x) < 1.15 &&
        Math.abs(
          c.position.y -
          (jumpY + (slideTime > 0 ? -.2 : 0) + 1.1)
        ) < 1.4
      ) {
        collect(c, i);
      }
    }

    // Recycle scenery
    for (const s of scenery) {
      s.position.z += speed * dt * .72;

      if (s.position.z > 24) {
        s.position.z -= 650;

        if (s.userData.side) {
          s.position.x =
            s.userData.side === 'left'
              ? -13 - Math.random() * 4
              : 13 + Math.random() * 4;
        }
      }
    }

    updateHUD();
  }

  function collect(c, i) {
    scene.remove(c);
    coins.splice(i, 1);

    runCoins++;
    score += 35;

    sound(880, .07, 'square');

    setTimeout(() => {
      sound(1250, .08, 'square');
    }, 55);

    updateHUD();
  }

  function hit() {
    running = false;
    gameEnded = true;

    banked += runCoins;
    best = Math.max(best, score);

    localStorage.setItem(SAVE.coins, String(banked));
    localStorage.setItem(SAVE.best, String(best));

    updateBank();

    $('mobile-controls').classList.add('hidden');
    $('pause-btn').classList.add('hidden');

    $('gameover-message').textContent =
      `SCORE ${score.toLocaleString()}  ·  COINS ${runCoins}  ·  BEST ${best.toLocaleString()}`;

    $('gameover-screen').classList.remove('hidden');

    sound(100, .35, 'sawtooth');
  }

  function pause() {
    if (!running) return;

    paused = true;

    $('pause-screen').classList.remove('hidden');
    $('mobile-controls').classList.add('hidden');
  }

  function resume() {
    if (!running) return;

    paused = false;

    $('pause-screen').classList.add('hidden');
    $('mobile-controls').classList.remove('hidden');

    clock.getDelta();
  }

  function loop(now) {
    frameId = requestAnimationFrame(loop);

    if (!renderer) return;

    const dt = Math.min(
      .04,
      Math.max(0, (now - (lastTime || now)) / 1000)
    );

    lastTime = now;

    if (running && !paused) {
      update(dt);
    }

    const desiredX = player ? player.position.x * .22 : 0;

    camera.position.x +=
      (desiredX - camera.position.x) * dt * 2.5;

    camera.position.y +=
      (5.6 + (jumpY * .18) - camera.position.y) * dt * 2;

    camera.lookAt(
      player ? player.position.x * .18 : 0,
      1.3,
      -15
    );

    renderer.render(scene, camera);
  }

  function setupEvents() {
    $('play-btn').addEventListener('click', resetRun);
    $('retry-btn').addEventListener('click', resetRun);
    $('resume-btn').addEventListener('click', resume);
    $('menu-btn').addEventListener('click', goMenu);
    $('gameover-menu-btn').addEventListener('click', goMenu);
    $('pause-btn').addEventListener('click', pause);

    // Keyboard controls
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();

      if (
        [
          'arrowleft',
          'arrowright',
          'arrowup',
          'arrowdown',
          ' '
        ].includes(k)
      ) {
        e.preventDefault();
      }

      if (k === 'arrowleft' || k === 'a') {
        move(-1);
      } else if (k === 'arrowright' || k === 'd') {
        move(1);
      } else if (
        k === 'arrowup' ||
        k === 'w' ||
        k === ' '
      ) {
        jump();
      } else if (k === 'arrowdown' || k === 's') {
        slide();
      } else if (k === 'p' || k === 'escape') {
        if (paused) resume();
        else pause();
      }
    });

    // Mobile buttons
    document.querySelectorAll('#mobile-controls button').forEach(b => {
      b.addEventListener('pointerdown', e => {
        e.preventDefault();

        const a = b.dataset.action;

        if (a === 'left') move(-1);
        if (a === 'right') move(1);
        if (a === 'jump') jump();
        if (a === 'slide') slide();
      });
    });

    // Swipe controls
    let sx = 0;
    let sy = 0;

    renderer.domElement.addEventListener(
      'touchstart',
      e => {
        if (e.touches.length) {
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    renderer.domElement.addEventListener(
      'touchend',
      e => {
        if (!running || paused || !e.changedTouches.length) {
          return;
        }

        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) {
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          move(dx > 0 ? 1 : -1);
        } else if (dy < 0) {
          jump();
        } else {
          slide();
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', resize);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && running && !paused) {
        pause();
      }
    });
  }

  function goMenu() {
    running = false;
    paused = false;

    $('pause-screen').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');
    $('menu-screen').classList.remove('hidden');

    $('mobile-controls').classList.add('hidden');
    $('pause-btn').classList.add('hidden');

    updateBank();
  }

  function updateHUD() {
    $('score-val').textContent = score.toLocaleString();
    $('coin-val').textContent = runCoins;
    $('best-val').textContent = best.toLocaleString();
  }

  function updateBank() {
    $('banked-coins').textContent = banked.toLocaleString();
  }

  function showToast(txt) {
    $('toast').textContent = txt;
    $('toast').classList.remove('hidden');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      $('toast').classList.add('hidden');
    }, 650);
  }

  function activateAudio() {
    try {
      audioCtx =
        audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {}
  }

  function sound(freq, duration, type = 'sine') {
    if (!audioCtx) return;

    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      o.type = type;
      o.frequency.value = freq;

      g.gain.setValueAtTime(.055, audioCtx.currentTime);

      g.gain.exponentialRampToValueAtTime(
        .001,
        audioCtx.currentTime + duration
      );

      o.connect(g);
      g.connect(audioCtx.destination);

      o.start();
      o.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function resize() {
    if (!renderer || !camera) return;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);

    renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, 1.65)
    );
  }

  init();
})();
