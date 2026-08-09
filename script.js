// ============================================================
// KOLLINS RUNNER — REALISTIC RUNNER EDITION
// Three.js r128 compatible
// ============================================================

let scene, camera, renderer;

let player;
let police;
let playerCar = null;
let football = null;

let gameActive = false;
let gameOverState = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;
let highScore = Number(localStorage.getItem("kollinsHighScore")) || 0;

let speed = 0.55;
const maxSpeed = 1.15;

let obstacles = [];
let coins = [];
let environmentObjects = [];

let isJumping = false;
let yVelocity = 0;

const gravity = 0.022;
const jumpForce = 0.45;

let spawnTimer = null;
let footballTimer = null;

let audioContext = null;
let engineOscillator = null;
let engineGain = null;

let lastFrameTime = performance.now();


// ============================================================
// INITIALIZATION
// ============================================================

function init() {

    if (renderer) return;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x82c9e8);

    scene.fog = new THREE.Fog(
        0x82c9e8,
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

    camera.position.set(0, 5.2, 8);

    camera.lookAt(
        0,
        1.5,
        -25
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

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.zIndex = "0";

    document.body.appendChild(
        renderer.domElement
    );


    // LIGHTING
    scene.add(
        new THREE.HemisphereLight(
            0xffffff,
            0x555555,
            1.1
        )
    );


    const sunlight =
        new THREE.DirectionalLight(
            0xffffff,
            1.4
        );

    sunlight.position.set(
        20,
        40,
        15
    );

    sunlight.castShadow = true;

    scene.add(sunlight);


    createWorld();
    createRunner();
    createPolice();

    setupButtons();
    setupControls();

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
                color: 0x292d32,
                roughness: 0.9
            })
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.z =
        -1500;

    road.receiveShadow = true;

    scene.add(road);


    // ROAD EDGE
    for (const x of [-10.5, 10.5]) {

        const edge =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.3,
                    0.12,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x777777,
                    metalness: 0.5
                })
            );

        edge.position.set(
            x,
            0.06,
            -1500
        );

        scene.add(edge);
    }


    // LANE LINES
    for (
        const x of [
            -laneWidth / 2,
            laneWidth / 2
        ]
    ) {

        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.08,
                    0.035,
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
    }


    // RAIL TRACKS
    for (
        const x of [-5.2, 5.2]
    ) {

        const rail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.16,
                    0.18,
                    3000
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xbfc5ca,
                    metalness: 0.8,
                    roughness: 0.25
                })
            );

        rail.position.set(
            x,
            0.12,
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

        const sleeper =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10,
                    0.12,
                    0.42
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x4d382d
                })
            );

        sleeper.position.set(
            0,
            0.02,
            z
        );

        scene.add(sleeper);

        environmentObjects.push(
            sleeper
        );
    }


    // BUILDINGS
    for (
        let z = 0;
        z > -1500;
        z -= 35
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


    // STREET LIGHTS
    for (
        let z = -10;
        z > -1500;
        z -= 45
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


    // TREES
    for (
        let z = -15;
        z > -1500;
        z -= 38
    ) {

        createTree(
            -11.5,
            z
        );

        createTree(
            11.5,
            z - 15
        );
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(x, z) {

    const height =
        8 + Math.random() * 14;

    const width =
        4 + Math.random() * 4;

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

    environmentObjects.push(
        building
    );


    // WINDOWS
    for (
        let y = 2;
        y < height - 1;
        y += 2.5
    ) {

        for (
            let zz = -4;
            zz <= 4;
            zz += 3
        ) {

            const windowMesh =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.65,
                        0.8,
                        0.06
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0x8fc5d8,
                        emissive: 0x244d5a,
                        emissiveIntensity: 0.3
                    })
                );

            windowMesh.position.set(
                x > 0
                    ? x - width / 2 - 0.04
                    : x + width / 2 + 0.04,
                y,
                z + zz
            );

            scene.add(windowMesh);

            environmentObjects.push(
                windowMesh
            );
        }
    }
}


// ============================================================
// TREE
// ============================================================

function createTree(x, z) {

    const group =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.3,
                2.4,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x68452d
            })
        );

    trunk.position.y = 1.2;

    group.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.35,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x287a3b
            })
        );

    leaves.position.y = 2.8;

    group.add(leaves);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    environmentObjects.push(
        group
    );
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
                6,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.7
            })
        );

    pole.position.set(
        x,
        3,
        z
    );

    scene.add(pole);

    environmentObjects.push(
        pole
    );


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.2,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffeeaa,
                emissive: 0xffb300,
                emissiveIntensity: 1
            })
        );

    lamp.position.set(
        x,
        6.1,
        z
    );

    scene.add(lamp);

    environmentObjects.push(
        lamp
    );
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player =
        new THREE.Group();


    // BODY
    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.9,
                1.25,
                0.65
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff5722
            })
        );

    body.position.y = 1.35;

    body.castShadow = true;

    player.add(body);


    // HEAD
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

    head.castShadow = true;

    player.add(head);


    // HAIR
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


    // LEGS
    const leftLeg =
        createLimb(
            0.23,
            0.85,
            0x202020
        );

    const rightLeg =
        createLimb(
            0.23,
            0.85,
            0x202020
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
    const leftArm =
        createLimb(
            0.19,
            0.7,
            0xff5722
        );

    const rightArm =
        createLimb(
            0.19,
            0.7,
            0xff5722
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


// ============================================================
// LIMB
// ============================================================

function createLimb(
    radius,
    height,
    color
) {

    // CapsuleGeometry is NOT used.
    // This works with Three.js r128.

    const group =
        new THREE.Group();


    const material =
        new THREE.MeshStandardMaterial({
            color: color
        });


    const cylinder =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                radius,
                radius,
                height,
                10
            ),
            material
        );

    group.add(cylinder);


    const top =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                radius,
                10,
                10
            ),
            material
        );

    top.position.y =
        height / 2;

    group.add(top);


    const bottom =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                radius,
                10,
                10
            ),
            material
        );

    bottom.position.y =
        -height / 2;

    group.add(bottom);


    return group;
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
// BUTTONS — FIXED
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
            "pointerdown",
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
            "pointerdown",
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

    button.innerText =
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

    speed = 0.55;

    currentLane = 0;

    isJumping = false;

    yVelocity = 0;


    clearObjects();


    if (!player) return;


    player.visible = true;

    player.position.set(
        0,
        0,
        0
    );


    if (playerCar) {

        playerCar.visible =
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

        highScore =
            score;

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


    stopCarSound();


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


    updateHighScoreDisplay();

    playGameOverSound();
}


// ============================================================
// CLEAR OBJECTS
// ============================================================

function clearObjects() {

    obstacles.forEach(
        function(obj) {

            scene.remove(obj);
        }
    );


    coins.forEach(
        function(coin) {

            scene.remove(coin);
        }
    );


    obstacles = [];

    coins = [];


    if (football) {

        scene.remove(
            football
        );

        football = null;
    }


    if (footballTimer) {

        clearInterval(
            footballTimer
        );

        footballTimer = null;
    }


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
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


    if (random < 0.22) {

        createBarrier(
            lane
        );

    } else if (random < 0.42) {

        createTrafficCar(
            lane
        );

    } else if (random < 0.60) {

        createBike(
            lane
        );

    } else if (random < 0.76) {

        createTrain(
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
                600,
                1100 -
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
                2.8,
                3.4,
                11
            ),
            new THREE.MeshStandardMaterial({
                color: 0x59636e,
                metalness: 0.7,
                roughness: 0.3
            })
        );

    body.position.y =
        1.7;

    train.add(body);


    // WINDOWS
    for (
        let z = -4;
        z <= 4;
        z += 2
    ) {

        const windowMesh =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.1,
                    0.7,
                    0.08
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x18252c,
                    metalness: 0.5
                })
            );

        windowMesh.position.set(
            0,
            2.1,
            z
        );

        train.add(
            windowMesh
        );
    }


    // HEADLIGHTS
    for (
        const x of [-0.8, 0.8]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 4
                })
            );

        light.position.set(
            x,
            1.1,
            5.55
        );

        train.add(light);


        const pointLight =
            new THREE.PointLight(
                0xffffff,
                2,
                14
            );

        pointLight.position.set(
            x,
            1.1,
            5.5
        );

        train.add(
            pointLight
        );
    }


    train.position.set(
        lane,
        0,
        -150
    );


    scene.add(train);

    obstacles.push(
        train
    );


    playTrainSound();
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
                color: 0xff9800
            })
        );

    barrier.position.set(
        lane,
        0.6,
        -130
    );

    barrier.castShadow = true;

    scene.add(barrier);

    obstacles.push(
        barrier
    );
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
                2.1,
                0.75,
                4
            ),
            new THREE.MeshStandardMaterial({
                color:
                    Math.random() > 0.5
                    ? 0xe53935
                    : 0xff6d00,
                metalness: 0.4
            })
        );

    body.position.y =
        0.65;

    car.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.45,
                0.6,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202124
            })
        );

    roof.position.y =
        1.2;

    car.add(roof);


    // HEADLIGHTS
    for (
        const x of [-0.65, 0.65]
    ) {

        const headlight =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.25,
                    0.2,
                    0.1
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 3
                })
            );

        headlight.position.set(
            x,
            0.7,
            -2.02
        );

        car.add(
            headlight
        );
    }


    car.position.set(
        lane,
        0,
        -140
    );


    scene.add(car);

    obstacles.push(
        car
    );
}


// ============================================================
// BIKE
// ============================================================

function createBike(lane) {

    const bike =
        new THREE.Group();


    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.5
        });


    for (
        const z of [-0.75, 0.75]
    ) {

        const wheel =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.42,
                    0.09,
                    10,
                    20
                ),
                wheelMaterial
            );

        wheel.rotation.y =
            Math.PI / 2;

        wheel.position.z =
            z;

        wheel.position.y =
            0.48;

        bike.add(wheel);
    }


    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                0.12,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff1744,
                metalness: 0.7
            })
        );

    frame.position.y =
        0.5;

    bike.add(frame);


    const rider =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.3,
                14,
                14
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1976d2
            })
        );

    rider.position.y =
        1.15;

    bike.add(rider);


    bike.position.set(
        lane,
        0,
        -135
    );


    scene.add(bike);

    obstacles.push(
        bike
    );
}


// ============================================================
// COINS — YELLOW RINGS
// ============================================================

function createCoinLine(lane) {

    for (
        let i = 0;
        i < 8;
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
                    emissive: 0xffa000,
                    emissiveIntensity: 0.7,
                    metalness: 1,
                    roughness: 0.2
                })
            );


        coin.position.set(
            lane,
            1.3,
            -105 -
            i * 5
        );


        scene.add(coin);

        coins.push(
            coin
        );
    }
}


// ============================================================
// UPDATE OBJECTS
// ============================================================

function updateObjects() {

    if (!gameActive)
        return;


    // ENVIRONMENT MOVEMENT
    environmentObjects.forEach(
        function(obj) {

            obj.position.z +=
                speed;

            if (
                obj.position.z > 20
            ) {

                obj.position.z -=
                    1500;
            }
        }
    );


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
            obj.position.z > 18
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
            coin.position.z > 18
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


    if (
        speed < maxSpeed
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
        x < 1.3 &&
        z < 2.2 &&
        y < 2.3 &&
        !isJumping
    );
}


// ============================================================
// REMOVE OBSTACLE
// ============================================================

function removeObstacle(index) {

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

function collectCoin(index) {

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


    // LANE MOVEMENT
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
        gameActive
    ) {

        const t =
            performance.now() *
            0.014;


        player.userData.leftLeg.rotation.x =
            Math.sin(t) *
            0.7;

        player.userData.rightLeg.rotation.x =
            Math.sin(
                t + Math.PI
            ) *
            0.7;

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
                metalness: 0.5
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


    // WHEELS
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


    // HEADLIGHTS
    for (
        const x of [-0.65, 0.65]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.15,
                    10,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 4
                })
            );

        light.position.set(
            x,
            0.8,
            -2
        );

        playerCar.add(light);
    }


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

    if (!gameActive)
        return;


    if (!playerCar) {

        createPlayerCar();
    }


    if (
        playerCar.visible
    ) {

        playerCar.visible =
            false;

        player.visible =
            true;

        stopCarSound();

        playTone(
            350,
            0.12,
            "square"
        );

        return;
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
                    1.8;

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

                        score +=
                            50;

                        playHitSound();
                    }
                }


                if (
                    football.position.z <
                    -150
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
        },
        {
            passive: true
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
// HIGH SCORE
// ============================================================

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
// SCREEN
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


// COIN
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


// HIT
function playHitSound() {

    playTone(
        130,
        0.18,
        "sawtooth"
    );

    setTimeout(
        function() {

            playTone(
                70,
                0.12,
                "sawtooth"
            );

        },
        80
    );
}


// JUMP
function playJumpSound() {

    playTone(
        500,
        0.12,
        "triangle"
    );
}


// KICK
function playKickSound() {

    playTone(
        180,
        0.08,
        "square"
    );
}


// TRAIN
function playTrainSound() {

    playTone(
        95,
        0.25,
        "sawtooth"
    );
}


// GAME OVER
function playGameOverSound() {

    playTone(
        300,
        0.15,
        "sawtooth"
    );


    setTimeout(
        function() {

            playTone(
                180,
                0.25,
                "sawtooth"
            );

        },
        160
    );
}


// CAR ENGINE
function playCarSound() {

    if (!audioContext)
        return;


    stopCarSound();


    engineOscillator =
        audioContext.createOscillator();


    engineGain =
        audioContext.createGain();


    engineOscillator.type =
        "sawtooth";


    engineOscillator.frequency.value =
        90;


    engineGain.gain.value =
        0.025;


    engineOscillator.connect(
        engineGain
    );


    engineGain.connect(
        audioContext.destination
    );


    engineOscillator.start();
}


function stopCarSound() {

    if (
        engineOscillator
    ) {

        try {

            engineOscillator.stop();

        } catch (e) {}


        engineOscillator =
            null;
    }


    engineGain =
        null;
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


        if (
            playerCar &&
            playerCar.visible
        ) {

            playerCar.position.x +=
                (
                    currentLane *
                    laneWidth -
                    playerCar.position.x
                ) * 0.18;
        }


        // CAMERA SHAKE
        camera.position.x =
            player.position.x *
            0.08;


        camera.lookAt(
            player.position.x *
            0.15,
            1.5,
            -25
        );
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
