// ============================================================
// KOLLINS RUNNER — LAND + OCEAN EDITION
// ============================================================

let scene, camera, renderer;
let player, police, playerCar, boat;
let gameActive = false;
let gameOverState = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;
let highScore = Number(localStorage.getItem("kollinsHighScore")) || 0;

let speed = 0.42;
const maxSpeed = 0.95;

let obstacles = [];
let coins = [];
let powerUps = [];

let isJumping = false;
let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let isBoatMode = false;
let oceanScoreStart = 5000;
let oceanDuration = 1800;
let oceanTimer = 0;

let magnetActive = false;
let magnetTimer = 0;

let hoverboardActive = false;
let hoverboardTimer = 0;

let revivalKeys = Number(localStorage.getItem("kollinsRevivalKeys")) || 1;

let spawnTimer = null;

let audioContext = null;
let carSoundOscillator = null;
let carSoundGain = null;

let worldObjects = [];
let oceanObjects = [];

let lastFrameTime = performance.now();


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    if (renderer) return;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x72c7e8);

    scene.fog = new THREE.Fog(
        0x72c7e8,
        30,
        190
    );


    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8);

    camera.lookAt(
        0,
        1.3,
        -20
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.domElement.style.position =
        "fixed";

    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.zIndex = "0";

    document.body.appendChild(
        renderer.domElement
    );


    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.72
        );

    scene.add(ambient);


    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            1.2
        );

    sun.position.set(
        20,
        40,
        15
    );

    sun.castShadow = true;

    scene.add(sun);


    createLandWorld();
    createRunner();
    createPolice();

    setupButtons();
    setupControls();

    updateHighScoreDisplay();

    window.addEventListener(
        "resize",
        resizeGame
    );

    animate();
}


// ============================================================
// LAND WORLD
// ============================================================

function createLandWorld() {

    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                24,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x30343a,
                roughness: 0.9
            })
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.z =
        -1500;

    road.receiveShadow = true;

    scene.add(road);

    worldObjects.push(road);


    // Lane markings

    for (
        let x of [
            -laneWidth / 2,
            laneWidth / 2
        ]
    ) {

        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.12,
                    0.04,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff
                })
            );

        line.position.set(
            x,
            0.04,
            -1500
        );

        scene.add(line);

        worldObjects.push(line);
    }


    // Rails

    for (
        let x of [-5.2, 5.2]
    ) {

        const rail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.2,
                    0.18,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xb8bec4,
                    metalness: 0.8
                })
            );

        rail.position.set(
            x,
            0.1,
            -1500
        );

        scene.add(rail);

        worldObjects.push(rail);
    }


    // Sleepers

    for (
        let z = 0;
        z > -1500;
        z -= 4
    ) {

        const sleeper =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10,
                    0.12,
                    0.45
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x4d4038
                })
            );

        sleeper.position.set(
            0,
            0.02,
            z
        );

        scene.add(sleeper);

        worldObjects.push(sleeper);
    }


    // Buildings

    for (
        let z = 0;
        z > -1500;
        z -= 45
    ) {

        createBuilding(
            -14,
            z
        );

        createBuilding(
            14,
            z
        );
    }


    // Street lights

    for (
        let z = -10;
        z > -1500;
        z -= 55
    ) {

        createStreetLight(
            -8,
            z
        );

        createStreetLight(
            8,
            z
        );
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(
    x,
    z
) {

    const height =
        7 +
        Math.random() * 10;

    const width =
        4 +
        Math.random() * 3;

    const building =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:
                    0x555b63 +
                    Math.floor(
                        Math.random() *
                        0x202020
                    )
            })
        );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;

    scene.add(building);

    worldObjects.push(building);


    // Windows

    for (
        let y = 2;
        y < height - 1;
        y += 2.2
    ) {

        const windowMesh =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.7,
                    0.8,
                    0.05
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x9fd8e8,
                    emissive: 0x1a4450,
                    emissiveIntensity: 0.3
                })
            );

        windowMesh.position.set(
            x - width / 2 - 0.03,
            y,
            z
        );

        scene.add(
            windowMesh
        );

        worldObjects.push(
            windowMesh
        );
    }
}


// ============================================================
// STREET LIGHTS
// ============================================================

function createStreetLight(
    x,
    z
) {

    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.08,
                0.08,
                6
            ),
            new THREE.MeshStandardMaterial({
                color: 0x444444
            })
        );

    pole.position.set(
        x,
        3,
        z
    );

    scene.add(pole);

    worldObjects.push(pole);


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.18,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffeeaa,
                emissive: 0xffb52e,
                emissiveIntensity: 0.8
            })
        );

    lamp.position.set(
        x,
        6.1,
        z
    );

    scene.add(lamp);

    worldObjects.push(lamp);
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.9,
                1.25,
                0.65
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff5b22
            })
        );

    body.position.y =
        1.35;

    player.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.43,
                20,
                20
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc9825c
            })
        );

    head.position.y =
        2.25;

    player.add(head);


    const hair =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.46,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0x17120f
            })
        );

    hair.scale.y =
        0.55;

    hair.position.y =
        2.48;

    player.add(hair);


    const leftLeg =
        createLimb(
            0.24,
            0.9,
            0x222222
        );

    const rightLeg =
        createLimb(
            0.24,
            0.9,
            0x222222
        );

    leftLeg.position.set(
        -0.25,
        0.45,
        0
    );

    rightLeg.position.set(
        0.25,
        0.45,
        0
    );

    player.add(leftLeg);
    player.add(rightLeg);


    player.userData.leftLeg =
        leftLeg;

    player.userData.rightLeg =
        rightLeg;


    const leftArm =
        createLimb(
            0.20,
            0.75,
            0xff5b22
        );

    const rightArm =
        createLimb(
            0.20,
            0.75,
            0xff5b22
        );

    leftArm.position.set(
        -0.58,
        1.45,
        0
    );

    rightArm.position.set(
        0.58,
        1.45,
        0
    );

    player.add(leftArm);
    player.add(rightArm);


    player.userData.leftArm =
        leftArm;

    player.userData.rightArm =
        rightArm;


    scene.add(player);
}


function createLimb(
    radius,
    height,
    color
) {

    return new THREE.Mesh(
        new THREE.CapsuleGeometry(
            radius,
            height,
            6,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: color
        })
    );
}


// ============================================================
// POLICE
// ============================================================

function createPolice() {

    police =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.25,
                1.6,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x174ea6
            })
        );

    body.position.y =
        1;

    police.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.38,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc9825c
            })
        );

    head.position.y =
        2;

    police.add(head);


    police.position.set(
        0,
        0,
        7
    );

    scene.add(police);
}


// ============================================================
// BUTTONS — IMPORTANT
// ============================================================

function setupButtons() {

    const play =
        document.getElementById(
            "play-btn"
        );

    const retry =
        document.getElementById(
            "retry-btn"
        );


    if (play) {

        play.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                startGame();

            }
        );

        play.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();

                startGame();

            },
            {
                passive: false
            }
        );
    }


    if (retry) {

        retry.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                startGame();

            }
        );

        retry.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();

                startGame();

            },
            {
                passive: false
            }
        );
    }


    createGameButton(
        "🚗 CAR",
        enterCar
    );

    createGameButton(
        "⚽ KICK",
        kickFootball
    );
}


// ============================================================
// MOBILE BUTTONS
// ============================================================

function createGameButton(
    text,
    action
) {

    let container =
        document.getElementById(
            "game-action-buttons"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "game-action-buttons";

        container.style.position =
            "fixed";

        container.style.bottom =
            "18px";

        container.style.left =
            "50%";

        container.style.transform =
            "translateX(-50%)";

        container.style.zIndex =
            "9999";

        container.style.display =
            "flex";

        container.style.gap =
            "10px";

        document.body.appendChild(
            container
        );
    }


    const button =
        document.createElement(
            "button"
        );

    button.textContent =
        text;

    button.style.padding =
        "13px 18px";

    button.style.border =
        "none";

    button.style.borderRadius =
        "16px";

    button.style.background =
        "rgba(10,10,10,.9)";

    button.style.color =
        "white";

    button.style.fontWeight =
        "bold";

    button.style.fontSize =
        "15px";

    button.style.touchAction =
        "manipulation";


    button.addEventListener(
        "pointerdown",
        function(e) {

            e.preventDefault();

            action();

        }
    );


    container.appendChild(
        button
    );
}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    initAudio();

    gameActive = true;
    gameOverState = false;

    score = 0;
    sessionCoins = 0;

    speed = 0.42;

    currentLane = 0;

    isJumping = false;
    yVelocity = 0;

    isBoatMode = false;
    oceanTimer = 0;

    magnetActive = false;
    magnetTimer = 0;

    hoverboardActive = false;
    hoverboardTimer = 0;


    clearObjects();


    player.position.set(
        0,
        0,
        0
    );

    player.visible = true;


    if (playerCar) {

        playerCar.visible =
            false;
    }


    if (boat) {

        boat.visible =
            false;
    }


    police.position.set(
        0,
        0,
        7
    );


    hideScreen(
        "menu-screen"
    );

    hideScreen(
        "gameover-screen"
    );


    setLandEnvironment();

    spawnObjects();

    updateHUD();
}


// ============================================================
// LAND ENVIRONMENT
// ============================================================

function setLandEnvironment() {

    isBoatMode = false;

    scene.background =
        new THREE.Color(
            0x72c7e8
        );

    scene.fog =
        new THREE.Fog(
            0x72c7e8,
            30,
            190
        );

    if (player) {
        player.visible = true;
    }

    if (boat) {
        boat.visible = false;
    }
}


// ============================================================
// OCEAN ENVIRONMENT
// ============================================================

function enterOceanMode() {

    if (isBoatMode) return;

    isBoatMode = true;

    oceanTimer = 0;

    clearObjects();

    createOceanWorld();

    createBoat();

    player.visible = false;

    boat.visible = true;

    boat.position.set(
        0,
        0.7,
        0
    );

    scene.background =
        new THREE.Color(
            0x4e9ed8
        );

    scene.fog =
        new THREE.Fog(
            0x4e9ed8,
            35,
            180
        );

    playOceanSound();
}


// ============================================================
// OCEAN WORLD
// ============================================================

function createOceanWorld() {

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                1000,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x168bd0,
                roughness: 0.25,
                metalness: 0.1
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y =
        -0.1;

    water.position.z =
        -1500;

    scene.add(water);

    oceanObjects.push(water);


    // Ocean waves

    for (
        let z = 0;
        z > -1200;
        z -= 18
    ) {

        const wave =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    100,
                    0.05,
                    0.5
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x8ddcff,
                    transparent: true,
                    opacity: 0.45
                })
            );

        wave.position.set(
            0,
            0.02,
            z
        );

        scene.add(wave);

        oceanObjects.push(
            wave
        );
    }


    // Small islands / shoreline scenery

    for (
        let z = -40;
        z > -900;
        z -= 90
    ) {

        const island =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    8,
                    11,
                    1,
                    20
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x4f8b45
                })
            );

        island.position.set(
            Math.random() > 0.5
                ? -22
                : 22,
            0.3,
            z
        );

        scene.add(island);

        oceanObjects.push(
            island
        );
    }
}


// ============================================================
// BOAT
// ============================================================

function createBoat() {

    if (boat) {

        boat.visible = true;

        return;
    }


    boat =
        new THREE.Group();


    const hull =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.6,
                0.6,
                4.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff5722,
                roughness: 0.35
            })
        );

    hull.position.y =
        0.5;

    boat.add(hull);


    const cabin =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                0.8,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff
            })
        );

    cabin.position.y =
        1.15;

    cabin.position.z =
        -0.3;

    boat.add(cabin);


    const windshield =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.1,
                0.45,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0x24485a,
                transparent: true,
                opacity: 0.8
            })
        );

    windshield.position.set(
        0,
        1.3,
        -1.05
    );

    boat.add(windshield);


    scene.add(boat);

    boat.visible = false;
}


// ============================================================
// SPAWN OBJECTS
// ============================================================

function spawnObjects() {

    if (!gameActive) return;

    if (isBoatMode) {

        spawnOceanObjects();

        return;
    }


    const lanes = [
        -laneWidth,
        0,
        laneWidth
    ];

    const lane =
        lanes[
            Math.floor(
                Math.random() *
                lanes.length
            )
        ];


    const r =
        Math.random();


    if (r < 0.22) {

        createTrain(lane);

    } else if (r < 0.40) {

        createTrafficCar(lane);

    } else if (r < 0.56) {

        createBike(lane);

    } else if (r < 0.68) {

        createBarrier(lane);

    } else if (r < 0.82) {

        createCoinLine(lane);

    } else {

        createPowerUp(lane);
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                600,
                1050 -
                speed * 400
            )
        );
}


// ============================================================
// MOVING TRAIN
// ============================================================

function createTrain(lane) {

    const train =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                3.5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x66727d,
                metalness: 0.55
            })
        );

    body.position.y =
        1.75;

    train.add(body);


    // Headlights

    for (
        let x of [-0.8, 0.8]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.16,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffcc,
                    emissive: 0xffff66,
                    emissiveIntensity: 2
                })
            );

        light.position.set(
            x,
            1.25,
            5.05
        );

        train.add(light);
    }


    train.position.set(
        lane,
        0,
        -160
    );

    scene.add(train);

    obstacles.push(train);

    playTrainSound();
}


// ============================================================
// CAR
// ============================================================

function createTrafficCar(lane) {

    const car =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                0.75,
                4
            ),
            new THREE.MeshStandardMaterial({
                color:
                    Math.random() >
                    0.5
                    ? 0xe53935
                    : 0xff6d00
            })
        );

    body.position.y =
        0.65;

    car.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.35,
                0.55,
                1.7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202124
            })
        );

    roof.position.y =
        1.15;

    car.add(roof);


    // headlights

    for (
        let x of [-0.6, 0.6]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.12,
                    10,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffaa,
                    emissive: 0xffff55,
                    emissiveIntensity: 1.5
                })
            );

        light.position.set(
            x,
            0.75,
            2.05
        );

        car.add(light);
    }


    car.position.set(
        lane,
        0,
        -145
    );

    scene.add(car);

    obstacles.push(car);
}


// ============================================================
// BIKE
// ============================================================

function createBike(lane) {

    const bike =
        new THREE.Group();


    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                0.7,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.5
            })
        );

    frame.position.y =
        0.75;

    bike.add(frame);


    for (
        let z of [-0.7, 0.7]
    ) {

        const wheel =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.38,
                    0.08,
                    10,
                    20
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x151515
                })
            );

        wheel.rotation.y =
            Math.PI / 2;

        wheel.position.set(
            0,
            0.42,
            z
        );

        bike.add(wheel);
    }


    const rider =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.3,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x224488
            })
        );

    rider.position.y =
        1.4;

    bike.add(rider);


    bike.position.set(
        lane,
        0,
        -135
    );

    scene.add(bike);

    obstacles.push(bike);
}


// ============================================================
// BARRIER
// ============================================================

function createBarrier(lane) {

    const barrier =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                1.2,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffc107
            })
        );

    barrier.position.set(
        lane,
        0.6,
        -130
    );

    scene.add(barrier);

    obstacles.push(barrier);
}


// ============================================================
// COINS
// ============================================================

function createCoinLine(lane) {

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const coin =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.38,
                    0.12,
                    12,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    emissive: 0x8a6500,
                    emissiveIntensity: 0.6,
                    metalness: 1,
                    roughness: 0.2
                })
            );


        coin.position.set(
            lane,
            1.25,
            -105 -
            i * 5
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// POWER UPS
// ============================================================

function createPowerUp(lane) {

    const types = [
        "magnet",
        "hoverboard",
        "revival"
    ];

    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    let color =
        type === "magnet"
            ? 0xff2222
            : type === "hoverboard"
                ? 0x22aaff
                : 0xffd700;


    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.55,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5
            })
        );


    group.add(body);


    const label =
        document.createElement(
            "div"
        );


    group.userData.type =
        type;


    group.position.set(
        lane,
        1.3,
        -115
    );


    scene.add(group);

    powerUps.push(group);
}


// ============================================================
// OCEAN OBSTACLES
// ============================================================

function spawnOceanObjects() {

    const r =
        Math.random();


    if (r < 0.35) {

        createBuoy();

    } else if (r < 0.65) {

        createOceanBoat();

    } else {

        createOceanCoins();
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            850
        );
}


function createBuoy() {

    const buoy =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.5,
                0.7,
                1.5,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff5722
            })
        );

    buoy.position.set(
        (
            Math.floor(
                Math.random() * 3
            ) - 1
        ) * laneWidth,
        0.8,
        -130
    );

    scene.add(buoy);

    obstacles.push(buoy);
}


function createOceanBoat() {

    const otherBoat =
        new THREE.Group();


    const hull =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.6,
                0.6,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff
            })
        );

    hull.position.y =
        0.5;

    otherBoat.add(hull);


    otherBoat.position.set(
        (
            Math.floor(
                Math.random() * 3
            ) - 1
        ) * laneWidth,
        0,
        -150
    );

    scene.add(
        otherBoat
    );

    obstacles.push(
        otherBoat
    );
}


function createOceanCoins() {

    const lane =
        (
            Math.floor(
                Math.random() * 3
            ) - 1
        ) * laneWidth;

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const coin =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.38,
                    0.12,
                    12,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    metalness: 1
                })
            );

        coin.position.set(
            lane,
            1,
            -100 -
            i * 5
        );

        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// UPDATE OBJECTS
// ============================================================

function updateObjects() {

    if (!gameActive) return;


    const moveSpeed =
        speed *
        (isBoatMode ? 1.25 : 1);


    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];

        obj.position.z +=
            moveSpeed;


        if (
            checkCollision(
                isBoatMode
                    ? boat
                    : player,
                obj
            )
        ) {

            handleCrash();

            if (!gameActive)
                return;
        }


        if (
            obj.position.z > 15
        ) {

            scene.remove(obj);

            obstacles.splice(
                i,
                1
            );
        }
    }


    // Coins

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coins[i];

        coin.position.z +=
            moveSpeed;

        coin.rotation.y +=
            0.1;


        const target =
            isBoatMode
                ? boat
                : player;


        if (
            magnetActive
        ) {

            const distance =
                target.position.distanceTo(
                    coin.position
                );

            if (
                distance < 8
            ) {

                coin.position.lerp(
                    target.position,
                    0.08
                );
            }
        }


        if (
            target.position.distanceTo(
                coin.position
            ) < 1.5
        ) {

            collectCoin(i);

            continue;
        }


        if (
            coin.position.z > 15
        ) {

            scene.remove(
                coin
            );

            coins.splice(
                i,
                1
            );
        }
    }


    // Power-ups

    for (
        let i = powerUps.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            powerUps[i];

        item.position.z +=
            moveSpeed;

        item.rotation.y +=
            0.04;


        const target =
            isBoatMode
                ? boat
                : player;


        if (
            target.position.distanceTo(
                item.position
            ) < 1.5
        ) {

            activatePowerUp(
                item.userData.type
            );

            scene.remove(
                item
            );

            powerUps.splice(
                i,
                1
            );

            continue;
        }


        if (
            item.position.z > 15
        ) {

            scene.remove(
                item
            );

            powerUps.splice(
                i,
                1
            );
        }
    }


    if (
        speed < maxSpeed
    ) {

        speed +=
            0.000035;
    }


    score += 1;

    updateHUD();


    // Ocean transition

    if (
        !isBoatMode &&
        score >= oceanScoreStart
    ) {

        enterOceanMode();

    }


    if (
        isBoatMode
    ) {

        oceanTimer++;


        if (
            oceanTimer >=
            oceanDuration
        ) {

            returnToLand();
        }
    }
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(
    a,
    b
) {

    if (!a || !b)
        return false;


    const x =
        Math.abs(
            a.position.x -
            b.position.x
        );

    const z =
        Math.abs(
            a.position.z -
            b.position.z
        );

    const y =
        Math.abs(
            a.position.y -
            b.position.y
        );


    return (
        x < 1.35 &&
        z < 2.3 &&
        y < 2.5
    );
}


// ============================================================
// CRASH / REVIVAL
// ============================================================

function handleCrash() {

    if (hoverboardActive) {

        hoverboardActive =
            false;

        playHitSound();

        return;
    }


    if (
        revivalKeys > 0
    ) {

        revivalKeys--;

        localStorage.setItem(
            "kollinsRevivalKeys",
            revivalKeys
        );

        playRevivalSound();

        updateHUD();

        return;
    }


    gameOver();
}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive)
        return;

    gameActive = false;

    gameOverState = true;

    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    stopCarSound();


    if (
        score > highScore
    ) {

        highScore =
            score;

        localStorage.setItem(
            "kollinsHighScore",
            highScore
        );
    }


    const screen =
        document.getElementById(
            "gameover-screen"
        );


    if (screen) {

        screen.classList.remove(
            "hidden"
        );


        const text =
            screen.querySelector(
                "p"
            );


        if (text) {

            text.innerText =
                "Score: " +
                score +
                " • Coins: " +
                sessionCoins +
                " • Best: " +
                highScore;
        }
    }
}


// ============================================================
// RETURN TO LAND
// ============================================================

function returnToLand() {

    isBoatMode = false;

    oceanTimer = 0;

    oceanObjects.forEach(
        obj =>
            scene.remove(obj)
    );

    oceanObjects = [];


    if (boat) {

        boat.visible =
            false;
    }


    player.visible =
        true;


    setLandEnvironment();

    playLandReturnSound();

    spawnObjects();
}


// ============================================================
// POWER-UP ACTIVATION
// ============================================================

function activatePowerUp(
    type
) {

    if (
        type === "magnet"
    ) {

        magnetActive =
            true;

        magnetTimer =
            600;

        playPowerUpSound();

    } else if (
        type === "hoverboard"
    ) {

        hoverboardActive =
            true;

        hoverboardTimer =
            700;

        playPowerUpSound();

    } else if (
        type === "revival"
    ) {

        revivalKeys++;

        localStorage.setItem(
            "kollinsRevivalKeys",
            revivalKeys
        );

        playRevivalSound();
    }
}


// ============================================================
// POWER-UP TIMERS
// ============================================================

function updatePowerUps() {

    if (
        magnetActive
    ) {

        magnetTimer--;

        if (
            magnetTimer <= 0
        ) {

            magnetActive =
                false;
        }
    }


    if (
        hoverboardActive
    ) {

        hoverboardTimer--;

        if (
            hoverboardTimer <= 0
        ) {

            hoverboardActive =
                false;
        }
    }
}


// ============================================================
// COIN
// ============================================================

function collectCoin(
    index
) {

    if (!coins[index])
        return;


    score += 25;

    sessionCoins++;


    scene.remove(
        coins[index]
    );

    coins.splice(
        index,
        1
    );


    playCoinSound();

    updateHUD();
}


// ============================================================
// PLAYER
// ============================================================

function updatePlayer() {

    if (!player)
        return;


    if (
        isJumping
    ) {

        player.position.y +=
            yVelocity;

        yVelocity -=
            gravity;


        if (
            player.position.y <= 0
        ) {

            player.position.y =
                0;

            isJumping =
                false;

            yVelocity =
                0;
        }
    }


    const targetX =
        currentLane *
        laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) *
        0.18;


    if (
        gameActive
    ) {

        const t =
            performance.now() *
            0.012;


        player.userData.leftLeg.rotation.x =
            Math.sin(t) *
            0.65;

        player.userData.rightLeg.rotation.x =
            Math.sin(
                t + Math.PI
            ) *
            0.65;

        player.userData.leftArm.rotation.x =
            Math.sin(
                t + Math.PI
            ) *
            0.5;

        player.userData.rightArm.rotation.x =
            Math.sin(t) *
            0.5;
    }
}


// ============================================================
// BOAT
// ============================================================

function updateBoat() {

    if (
        !isBoatMode ||
        !boat
    )
        return;


    const targetX =
        currentLane *
        laneWidth;


    boat.position.x +=
        (
            targetX -
            boat.position.x
        ) *
        0.12;


    boat.rotation.z =
        Math.sin(
            performance.now() *
            0.003
        ) *
        0.025;
}


// ============================================================
// POLICE
// ============================================================

function updatePolice() {

    if (
        !gameActive ||
        isBoatMode
    )
        return;


    police.position.x +=
        (
            player.position.x -
            police.position.x
        ) *
        0.035;
}


// ============================================================
// CAR
// ============================================================

function createPlayerCar() {

    playerCar =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.2,
                0.75,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff3d00,
                metalness: 0.35
            })
        );

    body.position.y =
        0.65;

    playerCar.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.45,
                0.65,
                1.9
            ),
            new THREE.MeshStandardMaterial({
                color: 0x181818
            })
        );

    roof.position.y =
        1.25;

    playerCar.add(roof);


    playerCar.position.set(
        0,
        0,
        0
    );

    playerCar.visible =
        false;

    scene.add(
        playerCar
    );
}


// ============================================================
// ENTER CAR
// ============================================================

function enterCar() {

    if (
        !gameActive ||
        isBoatMode
    )
        return;


    if (!playerCar) {

        createPlayerCar();
    }


    playerCar.position.x =
        player.position.x;

    playerCar.visible =
        true;

    player.visible =
        false;

    playCarSound();

    score += 100;

    updateHUD();
}


// ============================================================
// FOOTBALL
// ============================================================

function kickFootball() {

    if (
        !gameActive ||
        isBoatMode
    )
        return;


    const ball =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.38,
                20,
                20
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff
            })
        );


    ball.position.set(
        player.position.x,
        0.45,
        -1
    );


    scene.add(ball);


    let count = 0;


    const timer =
        setInterval(
            function() {

                if (
                    !ball ||
                    count > 80
                ) {

                    scene.remove(ball);

                    clearInterval(
                        timer
                    );

                    return;
                }


                ball.position.z -=
                    1.7;

                ball.rotation.x +=
                    0.3;


                for (
                    let i =
                        obstacles.length - 1;
                    i >= 0;
                    i--
                ) {

                    if (
                        ball.position.distanceTo(
                            obstacles[i].position
                        ) < 2
                    ) {

                        scene.remove(
                            obstacles[i]
                        );

                        obstacles.splice(
                            i,
                            1
                        );

                        score += 50;

                        playHitSound();
                    }
                }


                count++;

            },
            30
        );
}


// ============================================================
// CONTROLS
// ============================================================

function setupControls() {

    window.addEventListener(
        "keydown",
        function(e) {

            if (
                !gameActive
            )
                return;


            const key =
                e.key.toLowerCase();


            if (
                key === "arrowleft" ||
                key === "a"
            ) {

                currentLane =
                    Math.max(
                        -1,
                        currentLane - 1
                    );
            }


            if (
                key === "arrowright" ||
                key === "d"
            ) {

                currentLane =
                    Math.min(
                        1,
                        currentLane + 1
                    );
            }


            if (
                key === " " ||
                key === "w" ||
                key === "arrowup"
            ) {

                jump();
            }


            if (
                key === "c"
            ) {

                enterCar();
            }


            if (
                key === "f"
            ) {

                kickFootball();
            }
        }
    );


    let startX = 0;
    let startY = 0;


    renderer.domElement.addEventListener(
        "touchstart",
        function(e) {

            const touch =
                e.touches[0];

            startX =
                touch.clientX;

            startY =
                touch.clientY;

        },
        {
            passive: true
        }
    );


    renderer.domElement.addEventListener(
        "touchend",
        function(e) {

            if (
                !gameActive
            )
                return;


            const touch =
                e.changedTouches[0];


            const dx =
                touch.clientX -
                startX;


            const dy =
                touch.clientY -
                startY;


            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (
                    dx > 40
                ) {

                    currentLane =
                        Math.min(
                            1,
                            currentLane + 1
                        );

                } else if (
                    dx < -40
                ) {

                    currentLane =
                        Math.max(
                            -1,
                            currentLane - 1
                        );
                }

            } else if (
                dy < -40
            ) {

                jump();
            }
        }
    );
}


// ============================================================
// JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping ||
        isBoatMode
    )
        return;


    isJumping =
        true;

    yVelocity =
        jumpForce;
}


// ============================================================
// CLEAR OBJECTS
// ============================================================

function clearObjects() {

    obstacles.forEach(
        obj =>
            scene.remove(obj)
    );

    coins.forEach(
        obj =>
            scene.remove(obj)
    );

    powerUps.forEach(
        obj =>
            scene.remove(obj)
    );


    obstacles = [];
    coins = [];
    powerUps = [];


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    const scoreElement =
        document.getElementById(
            "score-val"
        );

    const coinElement =
        document.getElementById(
            "coin-val"
        );

    const bankedElement =
        document.getElementById(
            "banked-coins"
        );


    if (scoreElement) {

        scoreElement.innerText =
            score;
    }


    if (coinElement) {

        coinElement.innerText =
            sessionCoins;
    }


    if (bankedElement) {

        bankedElement.innerText =
            localStorage.getItem(
                "kollinsBankedCoins"
            ) || 0;
    }
}


function updateHighScoreDisplay() {

    const menu =
        document.getElementById(
            "menu-screen"
        );


    if (!menu)
        return;


    let best =
        document.getElementById(
            "best-score"
        );


    if (!best) {

        best =
            document.createElement(
                "div"
            );

        best.id =
            "best-score";

        best.style.marginTop =
            "12px";

        best.style.fontWeight =
            "bold";

        menu.appendChild(best);
    }


    best.innerText =
        "🏆 BEST SCORE: " +
        highScore +
        " | 🔑 REVIVAL: " +
        revivalKeys;
}


// ============================================================
// SCREEN HELPERS
// ============================================================

function hideScreen(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.classList.add(
            "hidden"
        );
    }
}


// ============================================================
// AUDIO
// ============================================================

function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.08
) {

    if (!audioContext)
        return;


    const osc =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    osc.type =
        type;

    osc.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );


    osc.connect(gain);

    gain.connect(
        audioContext.destination
    );


    osc.start();

    osc.stop(
        audioContext.currentTime +
        duration
    );
}


function playCoinSound() {

    playTone(
        900,
        0.08,
        "square"
    );

    setTimeout(
        () =>
            playTone(
                1300,
                0.10,
                "square"
            ),
        70
    );
}


function playHitSound() {

    playTone(
        160,
        0.18,
        "sawtooth",
        0.12
    );
}


function playPowerUpSound() {

    playTone(
        500,
        0.12,
        "sine"
    );

    setTimeout(
        () =>
            playTone(
                900,
                0.15,
                "sine"
            ),
        100
    );
}


function playRevivalSound() {

    playTone(
        500,
        0.12,
        "triangle"
    );

    setTimeout(
        () =>
            playTone(
                900,
                0.15,
                "triangle"
            ),
        100
    );

    setTimeout(
        () =>
            playTone(
                1300,
                0.2,
                "triangle"
            ),
        200
    );
}


function playTrainSound() {

    if (!audioContext)
        return;

    playTone(
        90,
        0.15,
        "sawtooth",
        0.025
    );
}


function playOceanSound() {

    playTone(
        180,
        0.3,
        "sine",
        0.025
    );
}


function playLandReturnSound() {

    playTone(
        500,
        0.15,
        "triangle"
    );
}


function playCarSound() {

    if (!audioContext)
        return;


    stopCarSound();


    carSoundOscillator =
        audioContext.createOscillator();

    carSoundGain =
        audioContext.createGain();


    carSoundOscillator.type =
        "sawtooth";

    carSoundOscillator.frequency.value =
        85;


    carSoundGain.gain.value =
        0.025;


    carSoundOscillator.connect(
        carSoundGain
    );

    carSoundGain.connect(
        audioContext.destination
    );


    carSoundOscillator.start();
}


function stopCarSound() {

    if (
        carSoundOscillator
    ) {

        try {

            carSoundOscillator.stop();

        } catch (e) {}

        carSoundOscillator =
            null;
    }
}


// ============================================================
// DAY / NIGHT
// ============================================================

function updateDayNight() {

    if (!gameActive)
        return;


    const cycle =
        performance.now() /
        45000;


    const phase =
        cycle %
        1;


    let brightness;


    if (
        phase < 0.45
    ) {

        brightness = 1;

    } else if (
        phase < 0.60
    ) {

        brightness = 0.65;

    } else {

        brightness = 0.28;
    }


    const color =
        new THREE.Color(
            0x72c7e8
        );


    color.multiplyScalar(
        brightness
    );


    if (!isBoatMode) {

        scene.background =
            color;

        scene.fog.color =
            color;
    }
}


// ============================================================
// RESIZE
// ============================================================

function resizeGame() {

    if (
        !camera ||
        !renderer
    )
        return;


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}


// ============================================================
// ANIMATION
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    lastFrameTime =
        now;


    if (gameActive) {

        updatePlayer();

        updateBoat();

        updateObjects();

        updatePolice();

        updatePowerUps();

        updateDayNight();


        // Move the world toward the player

        if (
            !isBoatMode
        ) {

            worldObjects.forEach(
                obj => {

                    if (
                        obj.position.z >
                        20
                    ) {

                        obj.position.z -=
                            1600;
                    }
                }
            );

        } else {

            oceanObjects.forEach(
                obj => {

                    obj.position.z +=
                        speed * 0.3;

                    if (
                        obj.position.z >
                        30
                    ) {

                        obj.position.z -=
                            1200;
                    }
                }
            );
        }


        if (
            playerCar &&
            playerCar.visible
        ) {

            playerCar.position.x +=
                (
                    currentLane *
                    laneWidth -
                    playerCar.position.x
                ) *
                0.18;
        }
    }


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// START EVERYTHING
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function() {

        init();

    }
);
