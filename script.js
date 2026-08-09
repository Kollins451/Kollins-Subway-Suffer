// ============================================================
// KOLLINS RUNNER — STABLE VERSION
// Train + Cars + Bikes + Motorcycles + Coins + River + Boat
// Moving environment + High Score + Working Touch Buttons
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
let scenery = [];

let isJumping = false;
let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let spawnTimer = null;
let audioContext = null;

let gameMode = "land";
let riverTimer = 0;

let lastTime = performance.now();

let carMode = false;
let football = null;
let footballTimer = null;

let initialized = false;


// ============================================================
// INITIALIZE GAME
// ============================================================

function init() {

    if (initialized) return;

    initialized = true;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x72c7e8);

    scene.fog = new THREE.Fog(
        0x72c7e8,
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
        -20
    );


    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
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
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    document.body.appendChild(
        renderer.domElement
    );


    // LIGHTING
    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.75
        );

    scene.add(ambient);


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
    createBoat();

    setupButtons();
    setupControls();

    window.addEventListener(
        "resize",
        resizeGame
    );


    updateHUD();

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
                color: 0x292d32,
                roughness: 0.85
            })
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.z =
        -1500;

    scene.add(road);

    scenery.push(road);


    // ROAD MARKINGS
    for (
        let x of [-laneWidth / 2, laneWidth / 2]
    ) {

        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.10,
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
        let x of [-5.2, 5.2]
    ) {

        const rail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.20,
                    0.18,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xbfc5ca,
                    metalness: 0.8
                })
            );

        rail.position.set(
            x,
            0.10,
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


    // STREET LIGHTS
    for (
        let z = -10;
        z > -1500;
        z -= 55
    ) {

        createStreetLight(-8, z);
        createStreetLight(8, z);
    }


    // TREES
    for (
        let z = -20;
        z > -1500;
        z -= 38
    ) {

        createTree(-10, z);
        createTree(10, z);
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
                        Math.random() * 0x181818
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
                emissiveIntensity: 1
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
// TREES
// ============================================================

function createTree(x, z) {

    const group =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.30,
                2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x704214
            })
        );

    trunk.position.y = 1;

    group.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.25,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x258a3d
            })
        );

    leaves.position.y = 2.6;

    group.add(leaves);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    scenery.push(group);
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


// ============================================================
// LIMB
// ============================================================

function createLimb(
    radius,
    height,
    color
) {

    // CapsuleGeometry isn't available
    // in some older Three.js builds.
    // Use a cylinder for maximum stability.

    return new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            10
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
// BUTTONS — IMPORTANT
// ============================================================

function setupButtons() {

    const playButton =
        document.getElementById(
            "play-btn"
        );

    const retryButton =
        document.getElementById(
            "retry-btn"
        );


    // PLAY
    if (playButton) {

        playButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                startGame();
            }
        );


        playButton.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                startGame();
            },
            {
                passive: false
            }
        );
    }


    // RETRY
    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                startGame();
            }
        );


        retryButton.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();
                e.stopPropagation();

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
// START GAME
// ============================================================

function startGame() {

    initAudio();


    if (!renderer) {

        init();
    }


    gameActive = true;
    gameOverState = false;

    score = 0;
    sessionCoins = 0;

    speed = 0.42;

    currentLane = 0;

    isJumping = false;

    yVelocity = 0;

    carMode = false;

    gameMode = "land";

    riverTimer = 0;


    clearObjects();


    player.visible = true;

    player.position.set(
        0,
        0,
        0
    );


    if (playerCar) {

        playerCar.visible = false;
    }


    if (boat) {

        boat.visible = false;
    }


    police.visible = true;

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
}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive)
        return;


    gameActive = false;

    gameOverState = true;


    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "kollinsHighScore",
            highScore
        );
    }


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    playGameOverSound();


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
// CLEAR OBJECTS
// ============================================================

function clearObjects() {

    obstacles.forEach(
        obj => scene.remove(obj)
    );

    coins.forEach(
        obj => scene.remove(obj)
    );


    obstacles = [];
    coins = [];


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    if (football) {

        scene.remove(
            football
        );

        football = null;
    }
}


// ============================================================
// SPAWN SYSTEM
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

        createTrain(lane);

    } else if (random < 0.36) {

        createTrafficCar(lane);

    } else if (random < 0.52) {

        createBike(lane);

    } else if (random < 0.65) {

        createMotorcycle(lane);

    } else if (random < 0.77) {

        createBarrier(lane);

    } else {

        createCoinLine(lane);
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                600,
                1050 -
                speed * 420
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
                2.8,
                3.5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x59636e,
                metalness: 0.55
            })
        );

    body.position.y =
        1.75;

    train.add(body);


    // FRONT LIGHT
    const lightMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffaa,
            emissive: 0xffff00,
            emissiveIntensity: 2
        });


    const light1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.16,
                10,
                10
            ),
            lightMaterial
        );


    const light2 =
        light1.clone();


    light1.position.set(
        -0.75,
        1.6,
        5.05
    );

    light2.position.set(
        0.75,
        1.6,
        5.05
    );


    train.add(light1);
    train.add(light2);


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
// CAR OBSTACLE
// ============================================================

function createTrafficCar(lane) {

    const group =
        new THREE.Group();


    const color =
        Math.random() > 0.5
        ? 0xe53935
        : 0xff6d00;


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                0.75,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: color
            })
        );


    body.position.y =
        0.65;

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


    roof.position.y =
        1.15;

    group.add(roof);


    addVehicleLights(
        group,
        2
    );


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


    const wheel1 =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.42,
                0.10,
                10,
                20
            ),
            wheelMaterial
        );


    const wheel2 =
        wheel1.clone();


    wheel1.position.z =
        -0.65;

    wheel2.position.z =
        0.65;


    bike.add(wheel1);
    bike.add(wheel2);


    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                0.65,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2196f3
            })
        );


    frame.position.y =
        0.45;

    bike.add(frame);


    const rider =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.45,
                0.9,
                0.35
            ),
            new THREE.MeshStandardMaterial({
                color: 0x333333
            })
        );


    rider.position.y =
        1.05;

    bike.add(rider);


    bike.position.set(
        lane,
        0,
        -130
    );


    bike.userData.type =
        "bike";


    scene.add(bike);

    obstacles.push(bike);
}


// ============================================================
// MOTORCYCLE
// ============================================================

function createMotorcycle(lane) {

    const motor =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.75,
                0.6,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202020,
                metalness: 0.6
            })
        );


    body.position.y =
        0.65;

    motor.add(body);


    const wheel1 =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.38,
                0.09,
                10,
                18
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );


    const wheel2 =
        wheel1.clone();


    wheel1.position.z =
        -0.7;

    wheel2.position.z =
        0.7;


    motor.add(
        wheel1,
        wheel2
    );


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.13,
                10,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0xffff00,
                emissiveIntensity: 2
            })
        );


    lamp.position.set(
        0,
        0.75,
        0.95
    );


    motor.add(lamp);


    motor.position.set(
        lane,
        0,
        -125
    );


    motor.userData.type =
        "motorcycle";


    scene.add(motor);

    obstacles.push(motor);
}


// ============================================================
// VEHICLE LIGHTS
// ============================================================

function addVehicleLights(
    vehicle,
    z
) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffffaa,
            emissive: 0xffff00,
            emissiveIntensity: 1.8
        });


    const left =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.12,
                10,
                10
            ),
            material
        );


    const right =
        left.clone();


    left.position.set(
        -0.65,
        0.65,
        z
    );

    right.position.set(
        0.65,
        0.65,
        z
    );


    vehicle.add(
        left,
        right
    );
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


        // VEHICLE LIGHTS TURN ON WHEN CLOSE
        if (
            obj.userData.type === "train" ||
            obj.userData.type === "car" ||
            obj.userData.type === "motorcycle"
        ) {

            if (
                obj.position.z > -55
            ) {

                obj.traverse(
                    child => {

                        if (
                            child.material &&
                            child.material.emissive
                        ) {

                            child.material
                                .emissiveIntensity =
                                3;
                        }
                    }
                );
            }
        }


        if (
            checkCollision(
                player,
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
            0.10;


        if (
            player.position.distanceTo(
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


    // RIVER AT 5000
    if (
        score >= 5000 &&
        gameMode === "land"
    ) {

        enterRiver();
    }


    if (
        gameMode === "river"
    ) {

        riverTimer += 1;

        if (
            riverTimer > 1000
        ) {

            returnToLand();
        }
    }


    updateHUD();
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(
    a,
    b
) {

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

function removeObstacle(
    index
) {

    if (
        !obstacles[index]
    )
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

function collectCoin(
    index
) {

    if (
        !coins[index]
    )
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
        !carMode
    ) {

        const t =
            performance.now() *
            0.012;


        player.userData.leftLeg
            .rotation.x =
            Math.sin(t) *
            0.65;


        player.userData.rightLeg
            .rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.65;


        player.userData.leftArm
            .rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.5;


        player.userData.rightArm
            .rotation.x =
            Math.sin(t) *
            0.5;
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
        let x of [-1, 1]
    ) {

        for (
            let z of [-1.25, 1.25]
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

    if (!gameActive)
        return;


    if (!playerCar) {

        createPlayerCar();
    }


    if (carMode) {

        carMode = false;

        playerCar.visible =
            false;

        player.visible =
            true;

        stopCarSound();

        return;
    }


    carMode = true;

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

    if (!gameActive)
        return;


    if (football) {

        scene.remove(
            football
        );
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
        player.position.x,
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

                    football =
                        null;

                    clearInterval(
                        footballTimer
                    );
                }

            },
            30
        );
}


// ============================================================
// RIVER
// ============================================================

function enterRiver() {

    gameMode =
        "river";

    riverTimer = 0;


    // Turn road blue
    scene.background =
        new THREE.Color(
            0x65bde8
        );


    // Hide runner
    player.visible =
        false;

    police.visible =
        false;


    if (playerCar) {

        playerCar.visible =
            false;
    }


    if (boat) {

        boat.position.set(
            0,
            0.3,
            0
        );

        boat.visible =
            true;
    }


    playBoatSound();
}


// ============================================================
// BOAT
// ============================================================

function createBoat() {

    boat =
        new THREE.Group();


    const hull =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3,
                0.55,
                5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x8b4513
            })
        );


    hull.position.y =
        0.45;


    boat.add(hull);


    const seat =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                0.35,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0xeeeeee
            })
        );


    seat.position.y =
        0.9;


    boat.add(seat);


    boat.visible =
        false;


    scene.add(
        boat
    );
}


// ============================================================
// RETURN TO LAND
// ============================================================

function returnToLand() {

    gameMode =
        "land";


    scene.background =
        new THREE.Color(
            0x72c7e8
        );


    if (boat) {

        boat.visible =
            false;
    }


    player.visible =
        true;

    police.visible =
        true;

    police.position.set(
        0,
        0,
        7
    );
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

            } else {

                if (
                    dy < -40
                ) {

                    jump();
                }
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
        isJumping
    )
        return;


    isJumping =
        true;

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


// ============================================================
// HIDE SCREEN
// ============================================================

function hideScreen(id) {

    const element =
        document.getElementById(
            id
        );


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

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;


        if (AudioCtx) {

            audioContext =
                new AudioCtx();
        }
    }


    if (
        audioContext &&
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function playTone(
    frequency,
    duration,
    type = "sine"
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
        0.08,
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


function playJumpSound() {

    playTone(
        500,
        0.12,
        "sine"
    );
}


function playKickSound() {

    playTone(
        240,
        0.12,
        "square"
    );
}


function playGameOverSound() {

    playTone(
        180,
        0.20,
        "sawtooth"
    );


    setTimeout(
        function() {

            playTone(
                100,
                0.30,
                "sawtooth"
            );

        },
        160
    );
}


function playBoatSound() {

    playTone(
        120,
        0.35,
        "sawtooth"
    );
}


// ============================================================
// CAR SOUND
// ============================================================

let carSoundOscillator =
    null;

let carSoundGain =
    null;


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
// ANIMATION
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    lastTime =
        now;


    if (gameActive) {

        updatePlayer();

        updateObjects();

        updatePolice();


        // Environment moves toward player
        // making it feel like the runner is moving.

        for (
            let i = 0;
            i < scenery.length;
            i++
        ) {

            const object =
                scenery[i];


            if (
                object !== null
            ) {

                object.position.z +=
                    speed;


                if (
                    object.position.z >
                    30
                ) {

                    object.position.z -=
                        1500;
                }
            }
        }


        // PLAYER CAR
        if (
            carMode &&
            playerCar
        ) {

            playerCar.position.x +=
                (
                    currentLane *
                    laneWidth -
                    playerCar.position.x
                ) * 0.18;
        }


        // BOAT
        if (
            gameMode === "river" &&
            boat
        ) {

            boat.position.x =
                Math.sin(
                    performance.now() *
                    0.0015
                ) * 2;


            boat.rotation.z =
                Math.sin(
                    performance.now() *
                    0.002
                ) * 0.025;
        }
    }


    renderer.render(
        scene,
        camera
    );
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
// START
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function() {

        // IMPORTANT:
        // Initialize the background BEFORE
        // the user presses TAP TO PLAY.

        try {

            init();

        } catch (error) {

            console.error(
                "Kollins Runner error:",
                error
            );
        }
    }
);
