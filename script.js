// ==========================================================================
// 1. CORE GRAPHICS FRAMEWORK SETTINGS & GLOBAL CONFIGURATION
// ==========================================================================
let scene, camera, renderer;
let player, chaser;
let currentLane = 0; // Tracks running position lanes: -1 = Left, 0 = Center, 1 = Right
const laneWidth = 3.3;

// Object tracking memory pools
let obstacles = [];
let coins = [];
let sceneryItems = [];

// Game metric stat trackers
let score = 0;
let sessionCoins = 0;
let gameActive = false;
let speed = 0.28;
const maxSpeed = 0.85;

// Physics / Structural Movement variables
let isJumping = false;
let isSliding = false;
let yVelocity = 0;
const gravity = 0.016;
const jumpForce = 0.38;

// Distinct Subway Surfers Gameplay Rule Modifiers
let isHoverboardActive = false;
let isMagnetActive = false;
let isJetpackActive = false;
let chaserDistance = 6.0; // Dynamic tracking distance behind player block matrix coordinates

// Active background execution timer pools
let timers = { magnet: null, jetpack: null, board: null };
let spawnTimeoutRef = null;

// ==========================================================================
// 2. ENGINE ENGINE INITIALIZATION / SETUP BOOTSTRAPS
// ==========================================================================
function init() {
    // 3D Scene setup matrix bounds configurations
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3e2f7); // Sky-blue fog bounds color tint
    scene.fog = new THREE.FogExp2(0xa3e2f7, 0.009);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5.5, 7.5);
    camera.lookAt(0, 2, -4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Global Ambient & Directional Sun Lighting setups
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.85);
    sunLight.position.set(15, 40, 20);
    scene.add(sunLight);

    // Instantiate modular infrastructure objects components
    buildSubwayGridEnvironment();
    buildPlayerModelCharacter();
    buildInspectorChaserModel();

    // Attach desktop/mobile interactive controller event listeners
    window.addEventListener('keydown', handleKeyboardControls);
    setupTouchSwipeControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('dblclick', () => { if(gameActive) activateHoverboard(); });

    // Sync total persistent saved balance score values ledger profile
    document.getElementById('banked-coins').innerText = localStorage.getItem('subway_total_coins') || 0;
}

// ==========================================================================
// 3. GRAPHICS WORLD ENVIRONMENT GENERATOR PIPELINES
// ==========================================================================
function buildSubwayGridEnvironment() {
    // Core ground runway bedding plate mesh asset container bounds configuration
    const bedGeo = new THREE.PlaneGeometry(16, 3000);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.z = -1000;
    scene.add(bedMesh);

    // Layout the triple lane running train steel tracks geometry networks
    for (let i = -1; i <= 1; i++) {
        const railLineGeo = new THREE.BoxGeometry(0.25, 0.15, 3000);
        const railLineMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
        const rail = new THREE.Mesh(railLineGeo, railLineMat);
        rail.position.set(i * laneWidth, 0.075, -1000);
        scene.add(rail);
    }

    // Populate distant environment side scenery barrier walls columns loops
    for (let z = 0; z > -1500; z -= 45) {
        spawnSideSceneryPillars(z);
    }
}

function spawnSideSceneryPillars(zPos) {
    const wallGeo = new THREE.BoxGeometry(1.5, 8, 10);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6350 });
    
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-11, 4, zPos);
    scene.add(leftWall);
    sceneryItems.push(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = 11;
    scene.add(rightWall);
    sceneryItems.push(rightWall);
}

function buildPlayerModelCharacter() {
    player = new THREE.Group();

    // Character model segment parts geometry blocks
    const legsGeo = new THREE.BoxGeometry(0.7, 0.9, 0.6);
    const legsMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.y = 0.45;
    player.add(legs);

    const chestGeo = new THREE.BoxGeometry(0.9, 1.0, 0.7);
    const chestMat = new THREE.MeshStandardMaterial({ color: 0xff5722 }); // Orange hoodie kit
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.y = 1.3;
    player.add(chest);

    const capGeo = new THREE.BoxGeometry(0.65, 0.3, 0.7);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b }); // Yellow backcap shape
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.95, 0.05);
    player.add(cap);

    // Deployment skateboard safety layout container component instance definitions
    const boardGeo = new THREE.BoxGeometry(1.3, 0.12, 2.6);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xe91e63, metalness: 0.5 });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.y = -0.06;
    boardMesh.name = "skateboard_asset";
    boardMesh.visible = false;
    player.add(boardMesh);

    player.position.set(0, 0.05, 0);
    scene.add(player);
}

function buildInspectorChaserModel() {
    chaser = new THREE.Group();
    const chaserBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.1, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x0d47a1 }) // Blue inspector jacket uniform
    );
    chaserBody.position.y = 1.05;
    chaser.add(chaserBody);
    
    chaser.position.set(0, 0.05, chaserDistance);
    scene.add(chaser);
}

// ==========================================================================
// 4. RANDOM PROCEDURAL HAZARD / ITEM SPAWNER LOGIC SYSTEMS
// ==========================================================================
function spawnProceduralItemsLoop() {
    if (!gameActive) return;

    const lanes = [-laneWidth, 0, laneWidth];
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    const dice = Math.random();

    if (isJetpackActive) {
        // Sky lane mode is active. Deactivate barriers, generate overhead sky coin ribbons arrays
        spawnCoinRibbonChain(chosenLane, 12);
    } else {
        if (dice < 0.30) {
            // Obstacle Type A: Moving Train Carriages
            const trainGeo = new THREE.BoxGeometry(2.6, 4.0, 22);
            const trainMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.1 });
            const train = new THREE.Mesh(trainGeo, trainMat);
            train.position.set(chosenLane, 2.0, -180);
            train.userData = { type: 'train', isMoving: true, speedDelta: 0.14 };
            scene.add(train);
            obstacles.push(train);
        } 
        else if (dice < 0.50) {
            // Obstacle Type B: Low Caution Hurdles (Jump Over)
            const hurdleGeo = new THREE.BoxGeometry(2.8, 1.3, 1.6);
            const hurdleMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b }); 
            const hurdle = new THREE.Mesh(hurdleGeo, hurdleMat);
            hurdle.position.set(chosenLane, 0.65, -180);
            hurdle.userData = { type: 'hurdle' };
            scene.add(hurdle);
            obstacles.push(hurdle);
        } 
        else if (dice < 0.68) {
            // Obstacle Type C: High Signal Arches Frames (Slide Under)
            const archGeo = new THREE.BoxGeometry(3.0, 0.8, 2.0);
            const archMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f });
            const arch = new THREE.Mesh(archGeo, archMat);
            arch.position.set(chosenLane, 2.9, -180); 
            arch.userData = { type: 'arch' };
            scene.add(arch);
            obstacles.push(arch);
        } 
        else if (dice < 0.80) {
            // Spawns power-up item boxes matrices collections drops
            spawnCollectiblePowerupDrop(chosenLane);
        } 
        else {
            // Spawns baseline coin tracks ribbon systems layouts rows placement channels
            spawnCoinRibbonChain(chosenLane, 1.2);
        }
    }

    // Adaptive speed-based difficulty scaling calculation delay loops modifier configuration
    let spawnDelay = Math.max(380, 1100 - (speed * 900));
    spawnTimeoutRef = setTimeout(spawnProceduralItemsLoop, spawnDelay);
}

function spawnCoinRibbonChain(laneX, baseHeight) {
    const chainLength = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < chainLength; i++) {
        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(laneX, baseHeight, -180 - (i * 4.5));
        scene.add(coin);
        coins.push(coin);
    }
}

function spawnCollectiblePowerupDrop(laneX) {
    const isMagnetDrop = Math.random() > 0.5;
    const powerupGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const powerupMat = new THREE.MeshStandardMaterial({
        color: isMagnetDrop ? 0x2196f3 : 0x4caf50 // Blue Magnet vs Green Rocket Jetpack Box
    });
    const powerupMesh = new THREE.Mesh(powerupGeo, powerupMat);