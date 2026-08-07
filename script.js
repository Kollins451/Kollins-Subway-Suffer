// ============================================================
// KOLLINS RUNNER - COMPLETE GAME
// ============================================================

let scene, camera, renderer;
let player, police, car, football, skateboard;

let runnerBody, runnerHead;
let leftLeg, rightLeg, leftArm, rightArm;

let gameActive = false;
let gameOverState = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;

let speed = 0.42;
const maxSpeed = 0.95;

let obstacles = [];
let coins = [];

let isJumping = false;
let isDriving = false;
let isSkateboardActive = false;

let yVelocity = 0;
const gravity = 0.020;
const jumpForce = 0.42;

let skateboardTimer = null;
let spawnTimer = null;

let touchStartX = 0;
let touchStartY = 0;

let lastTime = performance.now();


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    if (renderer) return;

    // ---------------- SCENE ----------------

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x76c7e8);

    scene.fog = new THREE.Fog(
        0x76c7e8,
        35,
        180
    );


    // ---------------- CAMERA ----------------

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8);

    camera.lookAt(0, 1.3, -18);


    // ---------------- RENDERER ----------------

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

    document.body.appendChild(renderer.domElement);

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "0";


    // ---------------- LIGHTS ----------------

    const ambient = new THREE.AmbientLight(
        0xffffff,
        0.7
    );

    scene.add(ambient);


    const sunlight = new THREE.DirectionalLight(
        0xffffff,
        1.2
    );

    sunlight.position.set(20, 40, 15);
    sunlight.castShadow = true;

    scene.add(sunlight);


    // ---------------- WORLD ----------------

    createWorld();
    createRunner();
    createPolice();

    createActionButtons();
    setupTouchControls();
    setupKeyboard();

    setupPlayButtons();

    gameActive = false;
    gameOverState = false;

    updateHUD();

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // GROUND

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 3000),
        new THREE.MeshStandardMaterial({
            color: 0x30343b,
            roughness: 0.85
        })
    );

    ground.rotation.x = -Math.PI / 2;

    ground.position.z = -1500;

    ground.receiveShadow = true;

    scene.add(ground);


    // TRACK RAILS

    for (let i = -1; i <= 1; i++) {

        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.22,
                0.14,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb9b9b9,
                metalness: 0.8
            })
        );

        rail.position.set(
            i * laneWidth,
            0.08,
            -1500
        );

        scene.add(rail);
    }


    // SLEEPERS

    for (
        let z = 0;
        z > -1500;
        z -= 4
    ) {

        const sleeper = new THREE.Mesh(
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


    // STREET LIGHTS

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

    const height = 7 + Math.random() * 10;

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(
            4 + Math.random() * 3,
            height,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: 0x555b63
        })
    );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;

    scene.add(building);


    // WINDOWS

    for (
        let y = 2;
        y < height - 1;
        y += 2
    ) {

        const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.5,
                0.7,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffd966,
                emissive: 0xffaa33,
                emissiveIntensity: 0.4
            })
        );

        windowMesh.position.set(
            x > 0 ? x - 2.05 : x + 2.05,
            y,
            z - 3
        );

        scene.add(windowMesh);
    }
}


// ============================================================
// STREET LIGHT
// ============================================================

function createStreetLight(x, z) {

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.08,
            0.08,
            6
        ),
        new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7
        })
    );

    pole.position.set(
        x,
        3,
        z
    );

    scene.add(pole);


    const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.18,
            12,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: 0xfff2aa,
            emissive: 0xffcc55,
            emissiveIntensity: 0.7
        })
    );

    lamp.position.set(
        x,
        6.1,
        z
    );

    scene.add(lamp);
}


// ============================================================
// PLAYER
// ============================================================

function createRunner() {

    player = new THREE.Group();


    // BODY

    const body = new THREE.Mesh(
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

    runnerBody = body;

    player.add(body);


    // HEAD

    const head = new THREE.Mesh(
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

    runnerHead = head;

    player.add(head);


    // HAIR

    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.46,
            16,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x17120f
        })
    );

    hair.position.y = 2.43;

    player.add(hair);


    // LEGS

    leftLeg = createLimb(
        0.24,
        0.9,
        0x222222
    );

    rightLeg = createLimb(
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


    // ARMS

    leftArm = createLimb(
        0.20,
        0.75,
        0xff5b22
    );

    rightArm = createLimb(
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


    scene.add(player);
}


// ============================================================
// LIMB
// ============================================================

function createLimb(radius, height, color) {

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

    police = new THREE.Group();


    const body = new THREE.Mesh(
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


    const head = new THREE.Mesh(
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

    gameActive = true;
    gameOverState = false;

    score = 0;
    sessionCoins = 0;

    speed = 0.42;
    currentLane = 0;

    isJumping = false;
    isDriving = false;

    yVelocity = 0;


    clearObjects();


    player.position.set(
        0,
        0,
        0
    );

    player.visible = true;


    if (car) {
        car.visible = false;
    }


    deactivateSkateboard();


    police.position.set(
        0,
        0,
        7
    );


    hideElement("menu-screen");
    hideElement("gameover-screen");


    const tap = document.getElementById(
        "kollins-tap-play"
    );

    if (tap) {
        tap.style.display = "none";
        tap.style.pointerEvents = "none";
    }


    updateHUD();

    spawnObjects();
}


// ============================================================
// RESET / REPLAY
// ============================================================

function resetGame() {

    clearObjects();

    if (football) {

        scene.remove(football);

        football = null;
    }


    startGame();
}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive) return;


    if (isSkateboardActive) {

        deactivateSkateboard();

        return;
    }


    gameActive = false;

    gameOverState = true;


    if (spawnTimer) {

        clearTimeout(spawnTimer);

        spawnTimer = null;
    }


    const screen = document.getElementById(
        "gameover-screen"
    );

    if (screen) {

        screen.classList.remove("hidden");
        screen.style.display = "flex";
    }


    const text = screen
        ? screen.querySelector("p")
        : null;


    if (text) {

        text.innerText =
            "Score: " +
            score +
            " • Coins: " +
            sessionCoins;
    }
}


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer() {

    if (!player) return;


    // JUMP

    if (isJumping) {

        player.position.y += yVelocity;

        yVelocity -= gravity;


        if (player.position.y <= 0) {

            player.position.y = 0;

            isJumping = false;

            yVelocity = 0;
        }
    }


    // LANE

    const targetX =
        currentLane * laneWidth;

    player.position.x +=
        (targetX - player.position.x) * 0.18;


    // RUN ANIMATION

    if (
        gameActive &&
        !isDriving
    ) {

        const t =
            performance.now() * 0.012;


        leftLeg.rotation.x =
            Math.sin(t) * 0.65;

        rightLeg.rotation.x =
            Math.sin(t + Math.PI) * 0.65;

        leftArm.rotation.x =
            Math.sin(t + Math.PI) * 0.5;

        rightArm.rotation.x =
            Math.sin(t) * 0.5;


        if (!isJumping) {

            player.position.y =
                Math.abs(
                    Math.sin(t * 0.5)
                ) * 0.035;
        }
    }
}


// ============================================================
// POLICE UPDATE
// ============================================================

function updatePolice() {

    if (!police || !gameActive) return;


    police.position.x +=
        (player.position.x - police.position.x) * 0.035;


    const pulse =
        Math.sin(performance.now() * 0.02);


    police.children.forEach(child => {

        if (child.material) {

            child.material.emissive =
                pulse > 0
                    ? new THREE.Color(0x330000)
                    : new THREE.Color(0x000033);
        }
    });
}


// ============================================================
// OBJECTS UPDATE
// ============================================================

function updateObjects() {

    if (!gameActive) return;


    // OBSTACLES

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj = obstacles[i];

        obj.position.z += speed;


        if (
            checkCollision(
                player,
                obj,
                1.25
            )
        ) {

            gameOver();

            removeObstacle(i);

            continue;
        }


        if (obj.position.z > 12) {

            removeObstacle(i);
        }
    }


    // COINS

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin = coins[i];

        coin.position.z += speed;

        coin.rotation.y += 0.08;


        if (
            player.position.distanceTo(
                coin.position
            ) < 1.35
        ) {

            collectCoin(i);

            continue;
        }


        if (coin.position.z > 12) {

            scene.remove(coin);

            coins.splice(i, 1);
        }
    }


    // SPEED

    if (speed < maxSpeed) {

        speed += 0.000035;
    }


    // SCORE

    score += Math.max(
        1,
        Math.floor(speed * 0.08)
    );


    updateHUD();
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(a, b, distance) {

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
        x < distance &&
        z < 2 &&
        y < 2.2
    );
}


// ============================================================
// REMOVE OBSTACLE
// ============================================================

function removeObstacle(index) {

    if (!obstacles[index]) return;

    scene.remove(
        obstacles[index]
    );

    obstacles.splice(index, 1);
}


// ============================================================
// COIN
// ============================================================

function collectCoin(index) {

    score += 25;

    sessionCoins++;


    scene.remove(
        coins[index]
    );

    coins.splice(index, 1);

    updateHUD();
}


// ============================================================
// SPAWN
// ============================================================

function spawnObjects() {

    if (!gameActive) return;


    const lane =
        [-laneWidth, 0, laneWidth]
        [
            Math.floor(
                Math.random() * 3
            )
        ];


    const random = Math.random();


    if (random < 0.20) {

        createTrain(lane);

    } else if (random < 0.40) {

        createBarrier(lane);

    } else if (random < 0.60) {

        createTrafficCar(lane);

    } else {

        createCoinLine(lane);
    }


    const delay =
        Math.max(
            600,
            1100 - speed * 400
        );


    spawnTimer = setTimeout(
        spawnObjects,
        delay
    );
}


// ============================================================
// TRAIN
// ============================================================

function createTrain(lane) {

    const train = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.7,
            3.5,
            13
        ),
        new THREE.MeshStandardMaterial({
            color: 0x59636e,
            metalness: 0.55
        })
    );


    train.position.set(
        lane,
        1.75,
        -150
    );


    scene.add(train);

    obstacles.push(train);
}


// ============================================================
// BARRIER
// ============================================================

function createBarrier(lane) {

    const barrier = new THREE.Mesh(
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
// TRAFFIC CAR
// ============================================================

function createTrafficCar(lane) {

    const group = new THREE.Group();


    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            2,
            0.75,
            4
        ),
        new THREE.MeshStandardMaterial({
            color:
                Math.random() > 0.5
                    ? 0xc62828
                    : 0x1565c0
        })
    );

    body.position.y = 0.65;

    group.add(body);


    const roof = new THREE.Mesh(
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


    group.position.set(
        lane,
        0,
        -140
    );


    scene.add(group);

    obstacles.push(group);
}


// ============================================================
// COINS
// ============================================================

function createCoinLine(lane) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.42,
                0.42,
                0.15,
                20
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 1,
                roughness: 0.15
            })
        );


        coin.rotation.x =
            Math.PI / 2;


        coin.position.set(
            lane,
            1.1,
            -105 - i * 5
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// FOOTBALL
// ============================================================

function kickFootball() {

    if (!gameActive) return;


    if (football) {

        scene.remove(football);
        football = null;
    }


    football = new THREE.Mesh(
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
        player.position.x,
        0.45,
        -1.2
    );


    scene.add(football);


    const interval = setInterval(() => {

        if (!football || !gameActive) {

            clearInterval(interval);

            return;
        }


        football.position.z -= 2;

        football.rotation.x += 0.35;

        football.rotation.z += 0.22;


        for (
            let i = obstacles.length - 1;
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

                obstacles.splice(i, 1);

                score += 50;
            }
        }


        if (
            football.position.z < -120
        ) {

            clearInterval(interval);

            scene.remove(football);

            football = null;
        }

    }, 30);
}


// ============================================================
// CAR
// ============================================================

function enterCar() {

    if (!gameActive) return;


    if (isDriving) {

        exitCar();

        return;
    }


    isDriving = true;


    if (!car) {

        createPlayerCar();
    }


    car.visible = true;

    car.position.x =
        player.position.x;


    player.visible = false;


    score += 100;

    updateHUD();
}


function createPlayerCar() {

    car = new THREE.Group();


    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.1,
            0.7,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xd71920,
            metalness: 0.35
        })
    );


    body.position.y = 0.65;

    car.add(body);


    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.4,
            0.65,
            1.9
        ),
        new THREE.MeshStandardMaterial({
            color: 0x171717
        })
    );


    roof.position.y = 1.25;

    car.add(roof);


    for (const x of [-1, 1]) {

        for (const z of [-1.25, 1.25]) {

            const wheel = new THREE.Mesh(
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


            car.add(wheel);
        }
    }


    car.position.set(
        0,
        0,
        0
    );

    car.visible = false;

    scene.add(car);
}


function exitCar() {

    isDriving = false;

    if (car) {
        car.visible = false;
    }

    player.visible = true;
}


// ============================================================
// SKATEBOARD
// ============================================================

function activateSkateboard() {

    if (!gameActive) return;

    if (isSkateboardActive) return;


    isSkateboardActive = true;


    if (!skateboard) {

        createSkateboard();
    }


    skateboard.visible = true;


    if (skateboardTimer) {

        clearTimeout(
            skateboardTimer
        );
    }


    skateboardTimer = setTimeout(
        deactivateSkateboard,
        15000
    );
}


function createSkateboard() {

    skateboard = new THREE.Group();


    const board = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            0.12,
            2.8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xe91e63
        })
    );


    board.position.y = 0.12;

    skateboard.add(board);


    for (const x of [-0.48, 0.48]) {

        for (const z of [-0.9, 0.9]) {

            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.12,
                    0.12,
                    0.15,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x222222
                })
            );


            wheel.rotation.z =
                Math.PI / 2;


            wheel.position.set(
                x,
                -0.02,
                z
            );


            skateboard.add(wheel);
        }
    }


    skateboard.visible = false;

    scene.add(skateboard);
}


function updateSkateboard() {

    if (
        !skateboard ||
        !isSkateboardActive
    ) return;


    skateboard.position.copy(
        player.position
    );

    skateboard.position.y = 0;
}


function deactivateSkateboard() {

    isSkateboardActive = false;


    if (skateboard) {

        skateboard.visible = false;
    }


    if (skateboardTimer) {

        clearTimeout(
            skateboardTimer
        );

        skateboardTimer = null;
    }
}


// ============================================================
// MOBILE BUTTONS
// ============================================================

function createActionButtons() {

    if (
        document.getElementById(
            "mobile-actions"
        )
    ) return;


    const container =
        document.createElement("div");


    container.id =
        "mobile-actions";


    container.style.position = "fixed";
    container.style.bottom = "18px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.display = "flex";
    container.style.gap = "8px";
    container.style.zIndex = "9999";
    container.style.width = "96%";
    container.style.justifyContent = "center";


    const buttons = [

        ["⚽ BALL", kickFootball],

        ["🚗 CAR", enterCar],

        ["🛹 BOARD", activateSkateboard]

    ];


    buttons.forEach(item => {

        const button =
            document.createElement("button");


        button.innerText = item[0];


        button.style.padding =
            "14px 12px";

        button.style.minWidth =
            "90px";

        button.style.border =
            "none";

        button.style.borderRadius =
            "16px";

        button.style.background =
            "rgba(10,10,10,0.88)";

        button.style.color =
            "white";

        button.style.fontSize =
            "15px";

        button.style.fontWeight =
            "bold";

        button.style.touchAction =
            "manipulation";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                item[1]();
            }
        );


        container.appendChild(button);
    });


    document.body.appendChild(
        container
    );
}


// ============================================================
// KEYBOARD
// ============================================================

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        handleKeyboard
    );
}


function handleKeyboard(e) {

    const key =
        e.key.toLowerCase();


    if (
        !gameActive &&
        (key === " " || key === "enter")
    ) {

        startGame();

        return;
    }


    if (!gameActive) return;


    if (
        key === "arrowleft" ||
        key === "a"
    ) {

        currentLane--;

        if (currentLane < -1) {
            currentLane = -1;
        }
    }


    if (
        key === "arrowright" ||
        key === "d"
    ) {

        currentLane++;

        if (currentLane > 1) {
            currentLane = 1;
        }
    }


    if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
    ) {

        jump();
    }


    if (key === "c") {

        enterCar();
    }


    if (key === "f") {

        kickFootball();
    }


    if (key === "b") {

        activateSkateboard();
    }
}


// ============================================================
// JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping ||
        isDriving
    ) return;


    isJumping = true;

    yVelocity = jumpForce;
}


// ============================================================
// TOUCH CONTROLS
// ============================================================

function setupTouchControls() {

    window.addEventListener(
        "touchstart",
        e => {

            if (!e.touches.length) return;

            touchStartX =
                e.touches[0].clientX;

            touchStartY =
                e.touches[0].clientY;
        },
        {
            passive: true
        }
    );


    window.addEventListener(
        "touchend",
        e => {

            if (!gameActive) return;

            if (!e.changedTouches.length) return;


            const endX =
                e.changedTouches[0].clientX;

            const endY =
                e.changedTouches[0].clientY;


            const dx =
                endX - touchStartX;

            const dy =
                endY - touchStartY;


            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (Math.abs(dx) > 40) {

                    if (dx > 0) {

                        currentLane++;

                    } else {

                        currentLane--;
                    }


                    currentLane =
                        Math.max(
                            -1,
                            Math.min(
                                1,
                                currentLane
                            )
                        );
                }

            } else {

                if (dy < -40) {

                    jump();
                }
            }
        },
        {
            passive: true
        }
    );
}


// ============================================================
// PLAY / RETRY BUTTONS
// ============================================================

function setupPlayButtons() {

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
            event => {

                event.preventDefault();

                startGame();
            }
        );
    }


    if (retry) {

        retry.addEventListener(
            "click",
            event => {

                event.preventDefault();

                resetGame();
            }
        );
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


    if (scoreElement) {

        scoreElement.innerText =
            score;
    }


    if (coinElement) {

        coinElement.innerText =
            sessionCoins;
    }
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


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }
}


// ============================================================
// HIDE ELEMENT
// ============================================================

function hideElement(id) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.classList.add("hidden");

    element.style.display = "none";
}


// ============================================================
// WINDOW RESIZE
// ============================================================

function onWindowResize() {

    if (!camera || !renderer) return;


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}


window.addEventListener(
    "resize",
    onWindowResize
);


// ============================================================
// ANIMATION
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    const delta =
        Math.min(
            50,
            now - lastTime
        );


    lastTime = now;


    if (gameActive) {

        updatePlayer(delta);

        updatePolice();

        updateObjects();

        updateSkateboard();


        // Move camera slightly with player

        camera.position.x +=
            (
                player.position.x * 0.15 -
                camera.position.x
            ) * 0.05;


        camera.lookAt(
            player.position.x * 0.15,
            1.3,
            -18
        );


        // Keep car following lane

        if (isDriving && car) {

            car.position.x +=
                (
                    player.position.x -
                    car.position.x
                ) * 0.18;
        }
    }


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// START
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
