// ============================================================
// KOLLINS RUNNER — FULL GAME
// TAP TO PLAY FIXED
// ============================================================

let scene;
let camera;
let renderer;

let player;
let police;
let playerCar;
let football;
let boat;

let gameActive = false;
let gameOverState = false;
let gameInitialized = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;
let highScore = Number(localStorage.getItem("kollinsHighScore")) || 0;

let speed = 0.42;
const maxSpeed = 0.95;

let obstacles = [];
let coins = [];
let scenery = [];

let isJumping = false;
let isDriving = false;
let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let spawnTimer = null;
let footballTimer = null;

let audioContext = null;
let carOscillator = null;
let carGain = null;

let lastFrameTime = performance.now();

let worldMode = "land";
let riverTimer = 0;


// ============================================================
// BUTTONS — SET UP IMMEDIATELY
// ============================================================

function setupStartButtons() {

    const playButton = document.getElementById("play-btn");
    const retryButton = document.getElementById("retry-btn");

    if (playButton) {

        playButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();

            startGame();
        });

        playButton.addEventListener("touchend", function(e) {
            e.preventDefault();
            e.stopPropagation();

            startGame();
        }, { passive: false });
    }

    if (retryButton) {

        retryButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();

            startGame();
        });

        retryButton.addEventListener("touchend", function(e) {
            e.preventDefault();
            e.stopPropagation();

            startGame();
        }, { passive: false });
    }
}


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    if (gameInitialized) return;

    if (typeof THREE === "undefined") {

        console.error("Three.js did not load.");

        return;
    }

    gameInitialized = true;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x76c7e8);

    scene.fog = new THREE.Fog(
        0x76c7e8,
        35,
        180
    );


    // CAMERA

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(
        0,
        5.2,
        8
    );

    camera.lookAt(
        0,
        1.3,
        -18
    );


    // RENDERER

    renderer = new THREE.WebGLRenderer({
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

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.zIndex = "0";

    document.body.appendChild(
        renderer.domElement
    );


    // LIGHT

    scene.add(
        new THREE.AmbientLight(
            0xffffff,
            0.75
        )
    );

    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            1.3
        );

    sun.position.set(
        20,
        40,
        15
    );

    sun.castShadow = true;

    scene.add(sun);


    createWorld();
    createRunner();
    createPolice();

    setupControls();
    createActionButtons();

    window.addEventListener(
        "resize",
        resizeGame
    );

    updateHighScoreDisplay();

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // ROAD

    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                22,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x30343b,
                roughness: 0.85
            })
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.z =
        -1500;

    road.receiveShadow = true;

    scene.add(road);

    scenery.push(road);


    // TRACK LINES

    for (
        const x of [
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

        scenery.push(line);
    }


    // RAILS

    for (
        const x of [-5.2, 5.2]
    ) {

        const rail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.2,
                    0.18,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xbdbdbd,
                    metalness: 0.8
                })
            );

        rail.position.set(
            x,
            0.1,
            -1500
        );

        scene.add(rail);

        scenery.push(rail);
    }


    // SLEEPERS

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
                    color: 0x554338
                })
            );

        sleeper.position.set(
            0,
            0.02,
            z
        );

        scene.add(sleeper);

        scenery.push(sleeper);
    }


    // BUILDINGS

    for (
        let z = 0;
        z > -1500;
        z -= 45
    ) {

        createBuilding(-13, z);
        createBuilding(13, z);
    }


    // LIGHTS

    for (
        let z = -10;
        z > -1500;
        z -= 55
    ) {

        createStreetLight(-8, z);
        createStreetLight(8, z);
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(x, z) {

    const height =
        7 + Math.random() * 10;

    const building =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4 + Math.random() * 3,
                height,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:
                    0x555b63 +
                    Math.floor(
                        Math.random() * 0x202020
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

    scenery.push(building);
}


// ============================================================
// STREET LIGHT
// ============================================================

function createStreetLight(x, z) {

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

    scenery.push(pole);


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.18,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xfff2aa,
                emissive: 0xffcc55,
                emissiveIntensity: 0.8
            })
        );

    lamp.position.set(
        x,
        6.1,
        z
    );

    scene.add(lamp);

    scenery.push(lamp);
}


// ============================================================
// PLAYER
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

    body.position.y = 1.35;

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

    head.position.y = 2.25;

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

    hair.scale.y = 0.55;

    hair.position.y = 2.48;

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


    player.userData.leftLeg =
        leftLeg;

    player.userData.rightLeg =
        rightLeg;

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

    body.position.y = 1;

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

    head.position.y = 2;

    police.add(head);


    police.position.set(
        0,
        0,
        7
    );

    scene.add(police);
}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    try {

        initAudio();

        if (!gameInitialized) {
            init();
        }

        if (!renderer) {
            console.error(
                "Game could not initialize."
            );
            return;
        }


        gameActive = true;
        gameOverState = false;

        score = 0;
        sessionCoins = 0;

        speed = 0.42;

        currentLane = 0;

        isJumping = false;
        isDriving = false;

        yVelocity = 0;

        worldMode = "land";
        riverTimer = 0;


        clearObjects();


        player.position.set(
            0,
            0,
            0
        );

        player.visible = true;


        if (playerCar) {
            playerCar.visible = false;
        }


        if (boat) {
            boat.visible = false;
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


        spawnObjects();

        updateHUD();

        playStartSound();

    } catch (error) {

        console.error(
            "START GAME ERROR:",
            error
        );
    }
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


    if (footballTimer) {

        clearInterval(
            footballTimer
        );

        footballTimer = null;
    }


    stopCarSound();


    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "kollinsHighScore",
            highScore
        );
    }


    updateHighScoreDisplay();


    const screen =
        document.getElementById(
            "gameover-screen"
        );

    if (screen) {

        screen.classList.remove(
            "hidden"
        );

        const text =
            screen.querySelector("p");

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


    playGameOverSound();
}


// ============================================================
// CLEAR OBJECTS
// ============================================================

function clearObjects() {

    obstacles.forEach(
        obj => scene.remove(obj)
    );

    coins.forEach(
        coin => scene.remove(coin)
    );

    obstacles = [];
    coins = [];


    if (football) {

        scene.remove(
            football
        );

        football = null;
    }


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }
}


// ============================================================
// SPAWNING
// ============================================================

function spawnObjects() {

    if (!gameActive)
        return;


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


    const random =
        Math.random();


    if (random < 0.18) {

        createBarrier(lane);

    } else if (random < 0.36) {

        createTrafficCar(lane);

    } else if (random < 0.53) {

        createTrain(lane);

    } else if (random < 0.68) {

        createBike(lane);

    } else if (random < 0.82) {

        createMotorbike(lane);

    } else {

        createCoinLine(lane);
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                500,
                1050 -
                speed * 400
            )
        );
}


// ============================================================
// TRAIN
// ============================================================

function createTrain(lane) {

    const train =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.7,
                3.5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x59636e,
                metalness: 0.6
            })
        );

    body.position.y = 1.75;

    train.add(body);


    // HEADLIGHTS

    for (
        const x of [-0.8, 0.8]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.16,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 3
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
        -150
    );


    train.userData.type =
        "train";

    scene.add(train);

    obstacles.push(train);
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

    barrier.userData.type =
        "barrier";

    scene.add(barrier);

    obstacles.push(barrier);
}


// ============================================================
// CAR OBSTACLE
// ============================================================

function createTrafficCar(lane) {

    const group =
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
                    Math.random() > 0.5
                    ? 0xe53935
                    : 0xff6d00
            })
        );

    body.position.y = 0.65;

    group.add(body);


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

    roof.position.y = 1.15;

    group.add(roof);


    // HEADLIGHTS

    for (
        const x of [-0.65, 0.65]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.12,
                    10,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 2
                })
            );

        light.position.set(
            x,
            0.72,
            -2.02
        );

        group.add(light);
    }


    group.position.set(
        lane,
        0,
        -140
    );

    group.userData.type =
        "car";

    scene.add(group);

    obstacles.push(group);
}


// ============================================================
// BIKE
// ============================================================

function createBike(lane) {

    const bike =
        new THREE.Group();


    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });


    for (
        const z of [-0.8, 0.8]
    ) {

        const wheel =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.38,
                    0.08,
                    10,
                    20
                ),
                wheelMaterial
            );

        wheel.rotation.y =
            Math.PI / 2;

        wheel.position.set(
            0,
            0.4,
            z
        );

        bike.add(wheel);
    }


    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                0.65,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1976d2
            })
        );

    frame.position.y =
        0.65;

    bike.add(frame);


    bike.position.set(
        lane,
        0,
        -140
    );

    bike.userData.type =
        "bike";

    scene.add(bike);

    obstacles.push(bike);
}


// ============================================================
// MOTORBIKE
// ============================================================

function createMotorbike(lane) {

    const bike =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                0.7,
                2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x222222
            })
        );

    body.position.y =
        0.75;

    bike.add(body);


    for (
        const z of [-0.8, 0.8]
    ) {

        const wheel =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.35,
                    0.35,
                    0.18,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x111111
                })
            );

        wheel.rotation.z =
            Math.PI / 2;

        wheel.position.set(
            0,
            0.35,
            z
        );

        bike.add(wheel);
    }


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.13,
                10,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 3
            })
        );

    lamp.position.set(
        0,
        0.9,
        -1.05
    );

    bike.add(lamp);


    bike.position.set(
        lane,
        0,
        -145
    );

    bike.userData.type =
        "motorbike";

    scene.add(bike);

    obstacles.push(bike);
}


// ============================================================
// COINS — YELLOW RINGS
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
                    emissiveIntensity: 0.8,
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
// UPDATE OBJECTS
// ============================================================

function updateObjects() {

    if (!gameActive)
        return;


    // OBSTACLES

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];


        obj.position.z +=
            speed;


        // SMALL MOVEMENT FOR VEHICLES

        if (
            obj.userData.type ===
            "bike" ||
            obj.userData.type ===
            "motorbike"
        ) {

            obj.rotation.y =
                Math.sin(
                    performance.now() *
                    0.008
                ) * 0.02;
        }


        if (
            checkCollision(
                isDriving && playerCar
                    ? playerCar
                    : player,
                obj
            )
        ) {

            gameOver();

            removeObstacle(i);

            continue;
        }


        if (
            obj.position.z > 15
        ) {

            removeObstacle(i);
        }
    }


    // COINS

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coins[i];


        coin.position.z +=
            speed;

        coin.rotation.y +=
            0.1;


        const target =
            isDriving && playerCar
                ? playerCar
                : player;


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


    // SPEED

    if (
        speed < maxSpeed
    ) {

        speed +=
            0.000035;
    }


    score += 1;

    updateHUD();


    // RIVER SECTION

    if (
        score >= 5000 &&
        worldMode === "land"
    ) {

        enterRiver();
    }


    if (
        worldMode === "river"
    ) {

        riverTimer++;

        if (
            riverTimer > 900
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
        z < 2.2 &&
        y < 2.3
    );
}


// ============================================================
// REMOVE OBSTACLE
// ============================================================

function removeObstacle(index) {

    if (!obstacles[index])
        return;

    scene.remove(
        obstacles[index]
    );

    obstacles.splice(
        index,
        1
    );
}


// ============================================================
// COLLECT COIN
// ============================================================

function collectCoin(index) {

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
// PLAYER UPDATE
// ============================================================

function updatePlayer() {

    if (!player)
        return;


    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -=
            gravity;


        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            isJumping = false;

            yVelocity = 0;
        }
    }


    const targetX =
        currentLane *
        laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    if (
        gameActive &&
        !isDriving
    ) {

        const t =
            performance.now() *
            0.012;


        player.userData.leftLeg.rotation.x =
            Math.sin(t) * 0.65;

        player.userData.rightLeg.rotation.x =
            Math.sin(t + Math.PI) * 0.65;

        player.userData.leftArm.rotation.x =
            Math.sin(t + Math.PI) * 0.5;

        player.userData.rightArm.rotation.x =
            Math.sin(t) * 0.5;
    }
}


// ============================================================
// POLICE
// ============================================================

function updatePolice() {

    if (!gameActive)
        return;


    police.position.x +=
        (
            player.position.x -
            police.position.x
        ) * 0.035;
}


// ============================================================
// MOVING ENVIRONMENT
// ============================================================

function updateEnvironment() {

    if (!gameActive)
        return;


    for (
        const obj of scenery
    ) {

        if (
            obj === scenery[0]
        ) {
            continue;
        }


        obj.position.z +=
            speed;
    }


    // recycle scenery

    for (
        const obj of scenery
    ) {

        if (
            obj.position.z > 25
        ) {

            obj.position.z -=
                1500;
        }
    }
}


// ============================================================
// PLAYER CAR
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


    for (
        const x of [-1, 1]
    ) {

        for (
            const z of [-1.25, 1.25]
        ) {

            const wheel =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.38,
                        0.38,
                        0.25,
                        16
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0x111111
                    })
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                x,
                0.38,
                z
            );

            playerCar.add(
                wheel
            );
        }
    }


    playerCar.visible = false;

    scene.add(
        playerCar
    );
}


// ============================================================
// CAR MODE
// ============================================================

function enterCar() {

    if (!gameActive)
        return;


    if (!playerCar) {
        createPlayerCar();
    }


    if (isDriving) {

        isDriving = false;

        playerCar.visible = false;

        player.visible = true;

        stopCarSound();

        return;
    }


    isDriving = true;

    playerCar.position.x =
        player.position.x;

    playerCar.position.y =
        0;

    playerCar.position.z =
        player.position.z;

    playerCar.visible = true;

    player.visible = false;

    playCarSound();

    score += 100;

    updateHUD();
}


// ============================================================
// FOOTBALL
// ============================================================

function kickFootball() {

    if (!gameActive)
        return;


    if (football) {

        scene.remove(
            football
        );

        football = null;
    }


    football =
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


    football.position.set(
        isDriving && playerCar
            ? playerCar.position.x
            : player.position.x,
        0.45,
        -1
    );


    scene.add(
        football
    );


    playKickSound();


    if (footballTimer) {

        clearInterval(
            footballTimer
        );
    }


    footballTimer =
        setInterval(
            function() {

                if (!football) {

                    clearInterval(
                        footballTimer
                    );

                    return;
                }


                football.position.z -=
                    1.7;

                football.rotation.x +=
                    0.3;


                for (
                    let i =
                        obstacles.length - 1;
                    i >= 0;
                    i--
                ) {

                    if (
                        football.position.distanceTo(
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


                if (
                    football.position.z <
                    -120
                ) {

                    scene.remove(
                        football
                    );

                    football = null;

                    clearInterval(
                        footballTimer
                    );
                }

            },
            30
        );
}


// ============================================================
// RIVER + BOAT
// ============================================================

function enterRiver() {

    worldMode = "river";

    riverTimer = 0;


    createBoat();


    if (player) {
        player.visible = false;
    }

    if (playerCar) {
        playerCar.visible = false;
    }

    if (boat) {

        boat.visible = true;

        boat.position.set(
            0,
            0.2,
            0
        );
    }


    // Change atmosphere

    scene.background =
        new THREE.Color(
            0x4da6d8
        );

    scene.fog =
        new THREE.Fog(
            0x4da6d8,
            35,
            180
        );


    playBoatSound();
}


function createBoat() {

    if (boat)
        return;


    boat =
        new THREE.Group();


    const hull =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.2,
                0.7,
                5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x8d4b28
            })
        );

    hull.position.y =
        0.4;

    boat.add(hull);


    const cabin =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.8,
                1.1,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff
            })
        );

    cabin.position.y =
        1.15;

    boat.add(cabin);


    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                80,
                300
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1976d2,
                transparent: true,
                opacity: 0.85
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y =
        -0.05;

    water.position.z =
        -100;

    scene.add(water);


    scene.add(
        boat
    );
}


function updateBoat() {

    if (
        worldMode !== "river" ||
        !boat
    )
        return;


    boat.position.x +=
        (
            currentLane *
            laneWidth -
            boat.position.x
        ) * 0.08;


    boat.position.z =
        Math.sin(
            performance.now() *
            0.002
        ) * 0.3;


    boat.rotation.z =
        Math.sin(
            performance.now() *
            0.002
        ) * 0.025;
}


function returnToLand() {

    worldMode = "land";

    if (boat) {
        boat.visible = false;
    }

    player.visible = true;

    player.position.set(
        0,
        0,
        0
    );


    scene.background =
        new THREE.Color(
            0x76c7e8
        );

    scene.fog =
        new THREE.Fog(
            0x76c7e8,
            35,
            180
        );


    playLandReturnSound();
}


// ============================================================
// CONTROLS
// ============================================================

function setupControls() {

    window.addEventListener(
        "keydown",
        function(e) {

            if (!gameActive)
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

                e.preventDefault();

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

            if (!gameActive)
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

                if (dx > 40) {

                    currentLane =
                        Math.min(
                            1,
                            currentLane + 1
                        );

                } else if (dx < -40) {

                    currentLane =
                        Math.max(
                            -1,
                            currentLane - 1
                        );
                }

            } else {

                if (dy < -40) {

                    jump();
                }
            }
        }
    );
}


// ============================================================
// MOBILE ACTION BUTTONS
// ============================================================

function createActionButtons() {

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


    container.innerHTML = "";


    addActionButton(
        container,
        "🚗 CAR",
        enterCar
    );


    addActionButton(
        container,
        "⚽ KICK",
        kickFootball
    );
}


function addActionButton(
    container,
    text,
    action
) {

    const button =
        document.createElement(
            "button"
        );

    button.innerText =
        text;

    button.style.padding =
        "13px 18px";

    button.style.border =
        "none";

    button.style.borderRadius =
        "16px";

    button.style.background =
        "rgba(10,10,10,0.9)";

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
// JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping
    )
        return;


    isJumping = true;

    yVelocity =
        jumpForce;

    playJumpSound();
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


    if (scoreElement) {

        scoreElement.innerText =
            score;
    }


    if (coinElement) {

        coinElement.innerText =
            sessionCoins;
    }
}


function updateHighScoreDisplay() {

    const element =
        document.getElementById(
            "banked-coins"
        );

    if (element) {

        element.innerText =
            highScore;
    }
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


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type =
        type;

    oscillator.frequency.value =
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


    oscillator.connect(
        gain
    );

    gain.connect(
        audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


function playStartSound() {

    playTone(
        500,
        0.08,
        "square"
    );

    setTimeout(
        () => playTone(
            750,
            0.12,
            "square"
        ),
        90
    );
}


function playCoinSound() {

    playTone(
        900,
        0.08,
        "square"
    );

    setTimeout(
        function() {

            playTone(
                1300,
                0.10,
                "square"
            );

        },
        70
    );
}


function playHitSound() {

    playTone(
        180,
        0.15,
        "sawtooth"
    );
}


function playKickSound() {

    playTone(
        120,
        0.12,
        "triangle"
    );
}


function playJumpSound() {

    playTone(
        500,
        0.12,
        "sine"
    );
}


function playGameOverSound() {

    playTone(
        250,
        0.2,
        "sawtooth"
    );

    setTimeout(
        () => playTone(
            120,
            0.3,
            "sawtooth"
        ),
        160
    );
}


function playBoatSound() {

    playTone(
        180,
        0.25,
        "sawtooth",
        0.04
    );
}


function playLandReturnSound() {

    playTone(
        600,
        0.15,
        "sine"
    );
}


function playCarSound() {

    if (!audioContext)
        return;


    stopCarSound();


    carOscillator =
        audioContext.createOscillator();

    carGain =
        audioContext.createGain();


    carOscillator.type =
        "sawtooth";

    carOscillator.frequency.value =
        85;

    carGain.gain.value =
        0.025;


    carOscillator.connect(
        carGain
    );

    carGain.connect(
        audioContext.destination
    );


    carOscillator.start();
}


function stopCarSound() {

    if (carOscillator) {

        try {
            carOscillator.stop();
        } catch (e) {}

        carOscillator =
            null;
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

        updateObjects();

        updatePolice();

        updateEnvironment();

        updateBoat();


        if (
            isDriving &&
            playerCar
        ) {

            playerCar.position.x +=
                (
                    currentLane *
                    laneWidth -
                    playerCar.position.x
                ) * 0.18;
        }
    }


    if (renderer) {

        renderer.render(
            scene,
            camera
        );
    }
}


// ============================================================
// VERY IMPORTANT:
// BUTTONS ARE CONNECTED BEFORE GAME INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // THIS MAKES TAP TO PLAY WORK
        setupStartButtons();

        // THEN START THE GAME ENGINE
        init();

    }
);
