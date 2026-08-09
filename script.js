// ============================================================
// KOLLINS RUNNER 3D — TRAFFIC / TRAIN / BIKE EDITION
// ============================================================

let scene, camera, renderer;
let player, police, playerCar, football;

let gameActive = false;
let gameOverState = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;

let speed = 0.48;
const maxSpeed = 1.25;

let obstacles = [];
let coins = [];
let scenery = [];

let isJumping = false;
let isDriving = false;

let yVelocity = 0;

const gravity = 0.021;
const jumpForce = 0.43;

let spawnTimer = null;
let footballTimer = null;

let audioContext = null;
let carSoundOscillator = null;
let carSoundGain = null;
let trainSoundOscillator = null;

let lastFrameTime = performance.now();


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    if (renderer) return;

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x79c9ed);

    scene.fog =
        new THREE.Fog(
            0x79c9ed,
            35,
            180
        );


    camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1000
        );

    camera.position.set(
        0,
        5.3,
        8
    );

    camera.lookAt(
        0,
        1.3,
        -22
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
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

    renderer.domElement.style.left =
        "0";

    renderer.domElement.style.top =
        "0";

    renderer.domElement.style.zIndex =
        "0";

    document.body.appendChild(
        renderer.domElement
    );


    // LIGHTING

    scene.add(
        new THREE.HemisphereLight(
            0xffffff,
            0x4a4a4a,
            1.1
        )
    );


    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            1.3
        );

    sun.position.set(
        20,
        35,
        15
    );

    sun.castShadow = true;

    scene.add(sun);


    createWorld();
    createRunner();
    createPolice();
    createPlayerCar();

    setupButtons();
    setupControls();

    window.addEventListener(
        "resize",
        resizeGame
    );

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // GROUND

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                200,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x526b42,
                roughness: 1
            })
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.position.z =
        -1500;

    ground.receiveShadow = true;

    scene.add(ground);


    // ROAD

    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                13,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x292d32,
                roughness: 0.9
            })
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.y =
        0.01;

    road.position.z =
        -1500;

    road.receiveShadow = true;

    scene.add(road);


    // TRACK LINES

    [-laneWidth / 2,
     laneWidth / 2].forEach(
        x => {

            const line =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.08,
                        0.04,
                        3000
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0xf1f1f1
                    })
                );

            line.position.set(
                x,
                0.05,
                -1500
            );

            scene.add(line);
        }
    );


    // RAILS

    [-5.1, 5.1].forEach(
        x => {

            const rail =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.18,
                        0.2,
                        3000
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0xa9a9a9,
                        metalness: 0.8
                    })
                );

            rail.position.set(
                x,
                0.1,
                -1500
            );

            scene.add(rail);
        }
    );


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
                    0.42
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x574335
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
        let z = -20;
        z > -1500;
        z -= 45
    ) {

        const left =
            createBuilding(
                -12,
                z
            );

        const right =
            createBuilding(
                12,
                z - 18
            );

        scenery.push(
            left,
            right
        );
    }


    // STREET LIGHTS

    for (
        let z = -10;
        z > -1500;
        z -= 35
    ) {

        const left =
            createStreetLight(
                -7.5,
                z
            );

        const right =
            createStreetLight(
                7.5,
                z - 17
            );

        scenery.push(
            left,
            right
        );
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(x, z) {

    const height =
        7 +
        Math.random() * 11;

    const width =
        4 +
        Math.random() * 4;

    const building =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                14
            ),
            new THREE.MeshStandardMaterial({
                color:
                    0x51565c +
                    Math.floor(
                        Math.random() *
                        0x181818
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

    return building;
}


// ============================================================
// STREET LIGHT
// ============================================================

function createStreetLight(x, z) {

    const group =
        new THREE.Group();


    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.07,
                0.07,
                5.5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x3d4145
            })
        );

    pole.position.y = 2.75;

    group.add(pole);


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.2,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xfff2a6,
                emissive: 0xffc928,
                emissiveIntensity: 1.2
            })
        );

    lamp.position.y = 5.5;

    group.add(lamp);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    return group;
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
                color: 0x15100d
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

    player.add(
        leftLeg,
        rightLeg
    );


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

    player.add(
        leftArm,
        rightArm
    );


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
            color
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
                1.2,
                1.5,
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
// BUTTONS
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


    if (playButton) {

        playButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                startGame();
            }
        );

        playButton.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();

                startGame();
            }
        );
    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                startGame();
            }
        );

        retryButton.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();

                startGame();
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

    button.innerText = text;

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

    gameActive = true;
    gameOverState = false;

    score = 0;
    sessionCoins = 0;

    speed = 0.48;

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


    playerCar.visible = false;


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


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    stopCarSound();
    stopTrainSound();


    playCollisionSound();


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
                sessionCoins;
        }
    }
}


// ============================================================
// CLEANUP
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
// OBJECT SPAWNING
// ============================================================

function spawnObjects() {

    if (!gameActive)
        return;


    const lanes = [
        -1,
        0,
        1
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


    if (random < 0.20) {

        createTrain(
            lane
        );

    } else if (random < 0.40) {

        createTrafficCar(
            lane
        );

    } else if (random < 0.55) {

        createBike(
            lane
        );

    } else if (random < 0.68) {

        createBarrier(
            lane
        );

    } else if (random < 0.80) {

        createConeBarrier(
            lane
        );

    } else {

        createCoinLine(
            lane
        );
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                520,
                1000 -
                speed * 330
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
                2.75,
                3.6,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x59636e,
                metalness: 0.65,
                roughness: 0.35
            })
        );

    body.position.y = 1.8;

    train.add(body);


    // FRONT

    const front =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.6,
                2.5,
                0.25
            ),
            new THREE.MeshStandardMaterial({
                color: 0x25282b
            })
        );

    front.position.set(
        0,
        1.7,
        5
    );

    train.add(front);


    // WINDOWS

    for (
        let x of [-0.75, 0.75]
    ) {

        const window =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.55,
                    0.65,
                    0.08
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x071b2a,
                    metalness: 0.5
                })
            );

        window.position.set(
            x,
            2.4,
            5.14
        );

        train.add(window);
    }


    // HEADLIGHTS

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
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 2
                })
            );

        light.position.set(
            x,
            1.1,
            5.2
        );

        train.add(light);


        const point =
            new THREE.PointLight(
                0xffffff,
                2,
                15
            );

        point.position.copy(
            light.position
        );

        train.add(point);
    }


    train.position.set(
        lane * laneWidth,
        0,
        -150
    );


    train.userData.type =
        "train";

    train.userData.soundPlayed =
        false;


    scene.add(train);

    obstacles.push(train);
}


// ============================================================
// CAR
// ============================================================

function createTrafficCar(lane) {

    const car =
        new THREE.Group();


    const colors = [
        0xe53935,
        0xff6d00,
        0x1976d2,
        0x43a047,
        0xfdd835
    ];


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.05,
                0.75,
                4.1
            ),
            new THREE.MeshStandardMaterial({
                color:
                    colors[
                        Math.floor(
                            Math.random() *
                            colors.length
                        )
                    ],
                metalness: 0.35
            })
        );

    body.position.y =
        0.65;

    car.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.45,
                0.65,
                1.9
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202124,
                metalness: 0.5
            })
        );

    roof.position.y =
        1.2;

    car.add(roof);


    createVehicleWheels(
        car
    );

    createVehicleLights(
        car
    );


    car.position.set(
        lane * laneWidth,
        0,
        -140
    );


    car.userData.type =
        "car";


    scene.add(car);

    obstacles.push(car);
}


// ============================================================
// BIKE / MOTORCYCLE
// ============================================================

function createBike(lane) {

    const bike =
        new THREE.Group();


    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                0.65,
                1.7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x151515,
                metalness: 0.7
            })
        );

    frame.position.y =
        0.7;

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
                    18
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x111111
                })
            );

        wheel.rotation.y =
            Math.PI / 2;

        wheel.position.set(
            0,
            0.38,
            z
        );

        bike.add(wheel);
    }


    const handle =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                0.08,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0x333333
            })
        );

    handle.position.set(
        0,
        1.25,
        0.35
    );

    bike.add(handle);


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.13,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 2
            })
        );

    lamp.position.set(
        0,
        0.95,
        0.95
    );

    bike.add(lamp);


    bike.position.set(
        lane * laneWidth,
        0,
        -130
    );


    bike.userData.type =
        "bike";


    scene.add(bike);

    obstacles.push(bike);
}


// ============================================================
// VEHICLE WHEELS
// ============================================================

function createVehicleWheels(
    vehicle
) {

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

            vehicle.add(wheel);
        }
    }
}


// ============================================================
// VEHICLE LIGHTS
// ============================================================

function createVehicleLights(
    vehicle
) {

    for (
        let x of [-0.65, 0.65]
    ) {

        const headlight =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.13,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 2
                })
            );

        headlight.position.set(
            x,
            0.75,
            2.05
        );

        vehicle.add(
            headlight
        );


        const point =
            new THREE.PointLight(
                0xffffff,
                1.4,
                8
            );

        point.position.copy(
            headlight.position
        );

        vehicle.add(point);
    }
}


// ============================================================
// BARRIER
// ============================================================

function createBarrier(lane) {

    const barrier =
        new THREE.Group();


    const base =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.4,
                0.8,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffc107
            })
        );

    base.position.y =
        0.4;

    barrier.add(base);


    const stripe =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                0.15,
                0.85
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );

    stripe.position.y =
        0.6;

    barrier.add(stripe);


    barrier.position.set(
        lane * laneWidth,
        0,
        -125
    );


    barrier.userData.type =
        "barrier";


    scene.add(barrier);

    obstacles.push(barrier);
}


// ============================================================
// CONE BARRIER
// ============================================================

function createConeBarrier(lane) {

    const group =
        new THREE.Group();


    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        const cone =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.3,
                    0.9,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xff5a00
                })
            );

        cone.position.set(
            i * 0.8,
            0.45,
            0
        );

        group.add(cone);
    }


    group.position.set(
        lane * laneWidth,
        0,
        -125
    );


    group.userData.type =
        "cones";


    scene.add(group);

    obstacles.push(group);
}


// ============================================================
// YELLOW RING COINS
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
                    emissive: 0x9a7000,
                    emissiveIntensity: 0.7,
                    metalness: 1,
                    roughness: 0.2
                })
            );


        coin.position.set(
            lane * laneWidth,
            1.25,
            -105 -
            i * 5
        );


        coin.rotation.x =
            Math.PI / 2;


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// UPDATE WORLD
// ============================================================

function updateWorld() {

    if (!gameActive)
        return;


    scenery.forEach(
        obj => {

            obj.position.z +=
                speed;

            if (
                obj.position.z >
                30
            ) {

                obj.position.z -=
                    1500;
            }
        }
    );
}


// ============================================================
// UPDATE OBJECTS
// ============================================================

function updateObjects() {

    if (!gameActive)
        return;


    // OBSTACLES

    for (
        let i =
            obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];


        obj.position.z +=
            speed;


        // Rotate bike wheels / visual motion

        if (
            obj.userData.type ===
            "bike"
        ) {

            obj.rotation.y =
                Math.sin(
                    performance.now() *
                    0.004
                ) * 0.02;
        }


        // Collision

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


        // Approaching vehicle sound

        if (
            !obj.userData.soundPlayed &&
            obj.position.z > -35 &&
            (
                obj.userData.type ===
                "train" ||
                obj.userData.type ===
                "car" ||
                obj.userData.type ===
                "bike"
            )
        ) {

            obj.userData.soundPlayed =
                true;

            playVehicleApproachSound(
                obj.userData.type
            );
        }


        if (
            obj.position.z >
            18
        ) {

            removeObstacle(i);
        }
    }


    // COINS

    for (
        let i =
            coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coins[i];


        coin.position.z +=
            speed;


        coin.rotation.y +=
            0.12;


        if (
            player.position.distanceTo(
                coin.position
            ) < 1.5
        ) {

            collectCoin(i);

            continue;
        }


        if (
            coin.position.z >
            18
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


    // SPEED INCREASE

    if (
        speed <
        maxSpeed
    ) {

        speed +=
            0.00004;
    }


    score += 1;

    updateHUD();
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(
    a,
    b
) {

    if (
        isJumping &&
        b.userData.type !==
        "train"
    ) {

        if (
            a.position.y >
            0.8
        ) {

            return false;
        }
    }


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
// COIN COLLECTION
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
// PLAYER UPDATE
// ============================================================

function updatePlayer() {

    if (!player)
        return;


    // JUMP

    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -=
            gravity;


        if (
            player.position.y <=
            0
        ) {

            player.position.y =
                0;

            isJumping =
                false;

            yVelocity =
                0;
        }
    }


    // LANE

    const targetX =
        currentLane *
        laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // RUN ANIMATION

    if (
        gameActive &&
        !isDriving
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
                metalness: 0.4
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
                color: 0x171717,
                metalness: 0.5
            })
        );

    roof.position.y =
        1.25;

    playerCar.add(roof);


    createVehicleWheels(
        playerCar
    );

    createVehicleLights(
        playerCar
    );


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
// ENTER / EXIT CAR
// ============================================================

function enterCar() {

    if (!gameActive)
        return;


    if (isDriving) {

        isDriving =
            false;

        playerCar.visible =
            false;

        player.visible =
            true;

        stopCarSound();

        playTone(
            300,
            0.1
        );

        return;
    }


    isDriving =
        true;


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
        isDriving
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
                    1.8;


                football.rotation.x +=
                    0.35;


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

                        score +=
                            50;

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
                key ===
                "arrowleft" ||
                key === "a"
            ) {

                currentLane =
                    Math.max(
                        -1,
                        currentLane - 1
                    );
            }


            if (
                key ===
                "arrowright" ||
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
// SCREEN
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


// ============================================================
// COIN SOUND
// ============================================================

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
                0.1,
                "square"
            );

        },
        70
    );
}


// ============================================================
// COLLISION SOUND
// ============================================================

function playCollisionSound() {

    playTone(
        100,
        0.35,
        "sawtooth"
    );


    setTimeout(
        function() {

            playTone(
                60,
                0.3,
                "square"
            );

        },
        120
    );
}


// ============================================================
// JUMP SOUND
// ============================================================

function playJumpSound() {

    playTone(
        500,
        0.12,
        "sine"
    );
}


// ============================================================
// FOOTBALL SOUND
// ============================================================

function playKickSound() {

    playTone(
        180,
        0.08,
        "square"
    );
}


function playHitSound() {

    playTone(
        220,
        0.15,
        "sawtooth"
    );
}


// ============================================================
// VEHICLE APPROACH SOUND
// ============================================================

function playVehicleApproachSound(
    type
) {

    if (type === "train") {

        playTone(
            80,
            0.35,
            "sawtooth"
        );

        setTimeout(
            () => playTone(
                55,
                0.3,
                "sawtooth"
            ),
            120
        );

    } else if (
        type === "car"
    ) {

        playTone(
            120,
            0.15,
            "sawtooth"
        );

    } else {

        playTone(
            180,
            0.12,
            "sawtooth"
        );
    }
}


// ============================================================
// PLAYER CAR SOUND
// ============================================================

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
        90;


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
// TRAIN SOUND
// ============================================================

function stopTrainSound() {

    if (
        trainSoundOscillator
    ) {

        try {

            trainSoundOscillator.stop();

        } catch (e) {}


        trainSoundOscillator =
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

        updateWorld();

        updatePolice();


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


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// START
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function() {

        init();

    }
);
