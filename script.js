// ============================================================
// KOLLINS RUNNER — UPDATED FULL GAME
// Train + Cars + Bikes + Moving Environment + River/Boat
// High Score + Sounds + Tap-to-Play / Retry
// ============================================================

let scene, camera, renderer;
let player, police, car, football;

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
let isDriving = false;
let isRiver = false;
let isBoat = false;

let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let spawnTimer = null;
let footballTimer = null;
let riverTimer = null;

let audioContext = null;

let carSoundOscillator = null;
let carSoundGain = null;

let lastFrameTime = performance.now();


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    if (renderer) return;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x76c7e8);

    scene.fog = new THREE.Fog(
        0x76c7e8,
        35,
        180
    );


    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8);

    camera.lookAt(0, 1.3, -18);


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

    document.body.appendChild(renderer.domElement);


    scene.add(
        new THREE.AmbientLight(
            0xffffff,
            0.7
        )
    );


    const sunlight =
        new THREE.DirectionalLight(
            0xffffff,
            1.2
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

    updateHighScoreDisplay();

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

    createRoad();

    createRails();

    createBuildings();

    createStreetLights();
}


// ============================================================
// ROAD
// ============================================================

function createRoad() {

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
    }


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
    }
}


// ============================================================
// RAILS
// ============================================================

function createRails() {

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
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuildings() {

    for (
        let z = 0;
        z > -1500;
        z -= 45
    ) {

        const left =
            createBuilding(
                -13,
                z
            );

        const right =
            createBuilding(
                13,
                z
            );

        scenery.push(left);
        scenery.push(right);
    }
}


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

    return building;
}


// ============================================================
// STREET LIGHTS
// ============================================================

function createStreetLights() {

    for (
        let z = -10;
        z > -1500;
        z -= 55
    ) {

        scenery.push(
            createStreetLight(
                -8,
                z
            )
        );

        scenery.push(
            createStreetLight(
                8,
                z
            )
        );
    }
}


function createStreetLight(x, z) {

    const group =
        new THREE.Group();


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

    pole.position.y = 3;

    group.add(pole);


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
                emissiveIntensity: 0.7
            })
        );

    lamp.position.y = 6.1;

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
// ACTION BUTTONS
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

    gameActive = true;
    gameOverState = false;

    score = 0;
    sessionCoins = 0;

    speed = 0.42;

    currentLane = 0;

    isJumping = false;
    isDriving = false;

    isRiver = false;
    isBoat = false;

    yVelocity = 0;


    if (riverTimer) {

        clearTimeout(
            riverTimer
        );

        riverTimer = null;
    }


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


    resetLandEnvironment();

    spawnObjects();

    updateHUD();

    playStartSound();
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
        score >
        highScore
    ) {

        highScore =
            score;

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


    playGameOverSound();
}


// ============================================================
// OBJECT CLEANUP
// ============================================================

function clearObjects() {

    obstacles.forEach(
        obj =>
            scene.remove(obj)
    );

    coins.forEach(
        coin =>
            scene.remove(coin)
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
// SPAWNING
// ============================================================

function spawnObjects() {

    if (!gameActive)
        return;


    if (isRiver) {

        spawnRiverObjects();

    } else {

        spawnLandObjects();
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                520,
                1050 -
                speed * 450
            )
        );
}


// ============================================================
// LAND SPAWNING
// ============================================================

function spawnLandObjects() {

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


    if (random < 0.24) {

        createBarrier(lane);

    } else if (random < 0.44) {

        createTrafficCar(lane);

    } else if (random < 0.62) {

        createBike(lane);

    } else if (random < 0.80) {

        createTrain(lane);

    } else {

        createCoinLine(lane);
    }
}


// ============================================================
// RIVER SPAWNING
// ============================================================

function spawnRiverObjects() {

    if (!isBoat)
        return;


    const lane =
        (
            Math.floor(
                Math.random() * 3
            ) - 1
        ) * laneWidth;


    if (
        Math.random() <
        0.45
    ) {

        createBoatObstacle(
            lane
        );

    } else {

        createWaterCoinLine(
            lane
        );
    }
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
        -150
    );


    scene.add(barrier);

    obstacles.push(
        barrier
    );
}


// ============================================================
// TRAFFIC CAR
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
                    Math.random() >
                    0.5
                    ? 0xe53935
                    : 0xff6d00
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
        2,
        1.0
    );


    group.position.set(
        lane,
        0,
        -150
    );


    scene.add(group);

    obstacles.push(
        group
    );
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
                0.18,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );


    frame.position.y =
        0.8;

    bike.add(frame);


    for (
        let z of [-0.65, 0.65]
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
                    color: 0x111111
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
                0.32,
                14,
                14
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1e88e5
            })
        );


    rider.position.y =
        1.25;

    bike.add(rider);


    addVehicleLights(
        bike,
        0.5,
        1.05
    );


    bike.position.set(
        lane,
        0,
        -150
    );


    scene.add(bike);

    obstacles.push(
        bike
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
                metalness: 0.5
            })
        );


    body.position.y =
        1.75;

    train.add(body);


    const front =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.4,
                1.3,
                0.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x30343b
            })
        );


    front.position.set(
        0,
        1.5,
        5
    );


    train.add(front);


    // TRAIN HEADLIGHTS
    addTrainLights(
        train
    );


    train.position.set(
        lane,
        0,
        -180
    );


    scene.add(train);

    obstacles.push(
        train
    );
}


// ============================================================
// VEHICLE LIGHTS
// ============================================================

function addVehicleLights(
    group,
    width,
    height
) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1.5
        });


    for (
        let x of [
            -width / 2,
            width / 2
        ]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.13,
                    10,
                    10
                ),
                material
            );


        light.position.set(
            x,
            height,
            1.95
        );


        group.add(light);
    }
}


function addTrainLights(train) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffff66,
            emissiveIntensity: 2
        });


    for (
        let x of [-0.75, 0.75]
    ) {

        const light =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    12,
                    12
                ),
                material
            );


        light.position.set(
            x,
            1.2,
            5.15
        );


        train.add(light);
    }
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
                    emissiveIntensity: 0.5,
                    metalness: 1,
                    roughness: 0.2
                })
            );


        coin.position.set(
            lane,
            1.25,
            -115 -
            i * 5
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// WATER COINS
// ============================================================

function createWaterCoinLine(lane) {

    for (
        let i = 0;
        i < 6;
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
                    metalness: 1
                })
            );


        coin.position.set(
            lane,
            1,
            -100 -
            i * 6
        );


        scene.add(coin);

        coins.push(
            coin
        );
    }
}


// ============================================================
// RIVER BOAT OBSTACLE
// ============================================================

function createBoatObstacle(lane) {

    const boat =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                0.7,
                5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x8d4b20
            })
        );


    boat.position.set(
        lane,
        0.3,
        -150
    );


    scene.add(boat);

    obstacles.push(
        boat
    );
}


// ============================================================
// OBJECT UPDATE
// ============================================================

function updateObjects() {

    if (!gameActive)
        return;


    for (
        let i =
            obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];


        // EVERYTHING COMES TOWARD PLAYER
        obj.position.z +=
            speed;


        // VEHICLE LIGHT EFFECT
        updateVehicleLights(
            obj
        );


        if (
            checkCollision(
                player,
                obj
            )
        ) {

            if (!isDriving) {

                gameOver();

                removeObstacle(i);

                continue;
            }
        }


        if (
            obj.position.z >
            15
        ) {

            removeObstacle(i);
        }
    }


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
            0.1;


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
            15
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
        speed <
        maxSpeed
    ) {

        speed +=
            0.000035;
    }


    score += 1;

    checkRiverCheckpoint();

    updateHUD();
}


// ============================================================
// LIGHTS WHEN VEHICLES APPROACH
// ============================================================

function updateVehicleLights(obj) {

    if (!obj.children)
        return;


    const close =
        obj.position.z >
        -45;


    obj.children.forEach(
        child => {

            if (
                child.material &&
                child.material.emissive
            ) {

                child.material.emissiveIntensity =
                    close
                    ? 2.5
                    : 0.5;
            }
        }
    );
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
// COIN COLLECTION
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
        !isDriving &&
        !isBoat
    ) {

        const t =
            performance.now() *
            0.012;


        player.userData.leftLeg.rotation.x =
            Math.sin(t) * 0.65;

        player.userData.rightLeg.rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.65;

        player.userData.leftArm.rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.5;

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


    if (isRiver)
        return;


    scenery.forEach(
        object => {

            object.position.z +=
                speed;


            if (
                object.position.z >
                20
            ) {

                object.position.z -=
                    1500;
            }
        }
    );
}


// ============================================================
// PLAYER CAR
// ============================================================

function createPlayerCar() {

    car =
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

    car.add(body);


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

    car.add(roof);


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


            car.add(wheel);
        }
    }


    car.position.set(
        0,
        0,
        0
    );


    car.visible =
        false;


    scene.add(car);
}


// ============================================================
// ENTER CAR
// ============================================================

function enterCar() {

    if (!gameActive)
        return;


    if (!car) {

        createPlayerCar();
    }


    if (isDriving) {

        isDriving =
            false;

        car.visible =
            false;

        player.visible =
            true;

        stopCarSound();

        return;
    }


    isDriving =
        true;

    car.position.x =
        player.position.x;

    car.visible =
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

        football =
            null;
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
        ? car.position.x
        : player.position.x,

        0.45,

        -1
    );


    scene.add(
        football
    );


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

                    football =
                        null;

                    clearInterval(
                        footballTimer
                    );
                }

            },
            30
        );


    playKickSound();
}


// ============================================================
// RIVER CHECKPOINT
// ============================================================

function checkRiverCheckpoint() {

    if (
        score >= 5000 &&
        !isRiver
    ) {

        enterRiver();
    }
}


// ============================================================
// ENTER RIVER
// ============================================================

function enterRiver() {

    isRiver = true;
    isBoat = true;


    clearLandObjects();


    createRiverEnvironment();


    player.visible =
        false;


    if (!car) {

        createPlayerCar();
    }


    car.visible =
        false;


    createPlayerBoat();


    playRiverSound();


    riverTimer =
        setTimeout(
            function() {

                leaveRiver();

            },
            30000
        );
}


// ============================================================
// RIVER ENVIRONMENT
// ============================================================

function createRiverEnvironment() {

    scene.background =
        new THREE.Color(
            0x78bde8
        );


    scene.fog =
        new THREE.Fog(
            0x78bde8,
            30,
            170
        );


    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                100,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1976a8,
                roughness: 0.25,
                metalness: 0.1
            })
        );


    water.rotation.x =
        -Math.PI / 2;


    water.position.y =
        -0.15;


    water.position.z =
        -1500;


    scene.add(
        water
    );


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const island =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    5,
                    7,
                    6
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x388e3c
                })
            );


        island.position.set(
            (
                Math.random() *
                60
            ) - 30,

            3,

            -i * 45
        );


        scene.add(
            island
        );

        scenery.push(
            island
        );
    }
}


// ============================================================
// PLAYER BOAT
// ============================================================

function createPlayerBoat() {

    if (car) {

        car.visible =
            false;
    }


    const boat =
        new THREE.Group();


    const hull =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.6,
                0.65,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0xff6f00
            })
        );


    hull.position.y =
        0.25;


    boat.add(
        hull
    );


    const seat =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                0.4,
                1.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x222222
            })
        );


    seat.position.y =
        0.8;


    boat.add(
        seat
    );


    boat.position.set(
        0,
        0,
        0
    );


    boat.userData.isBoat =
        true;


    player =
        boat;


    scene.add(
        player
    );
}


// ============================================================
// LEAVE RIVER
// ============================================================

function leaveRiver() {

    isRiver =
        false;

    isBoat =
        false;


    clearObjects();


    if (riverTimer) {

        clearTimeout(
            riverTimer
        );

        riverTimer =
            null;
    }


    scene.remove(
        player
    );


    createRunner();


    player.position.set(
        0,
        0,
        0
    );


    player.visible =
        true;


    resetLandEnvironment();


    playLandReturnSound();
}


// ============================================================
// CLEAR RIVER/LAND OBJECTS
// ============================================================

function clearLandObjects() {

    obstacles.forEach(
        obj =>
            scene.remove(obj)
    );

    coins.forEach(
        coin =>
            scene.remove(coin)
    );


    obstacles = [];
    coins = [];
}


// ============================================================
// RESET LAND ENVIRONMENT
// ============================================================

function resetLandEnvironment() {

    isRiver =
        false;

    isBoat =
        false;


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

                if (dx > 40) {

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
        isJumping ||
        isBoat
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
        () =>
            playTone(
                750,
                0.12,
                "square"
            ),
        100
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
        180,
        0.15,
        "sawtooth"
    );
}


function playKickSound() {

    playTone(
        220,
        0.08,
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
        220,
        0.2,
        "sawtooth"
    );


    setTimeout(
        () =>
            playTone(
                120,
                0.3,
                "sawtooth"
            ),
        180
    );
}


function playRiverSound() {

    playTone(
        600,
        0.12,
        "sine"
    );


    setTimeout(
        () =>
            playTone(
                850,
                0.18,
                "sine"
            ),
        150
    );
}


function playLandReturnSound() {

    playTone(
        500,
        0.1,
        "square"
    );


    setTimeout(
        () =>
            playTone(
                750,
                0.12,
                "square"
            ),
        120
    );
}


// ============================================================
// CAR ENGINE SOUND
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


    const delta =
        now -
        lastFrameTime;


    lastFrameTime =
        now;


    if (gameActive) {

        updatePlayer(
            delta
        );


        updateObjects();


        updatePolice();


        updateEnvironment();


        if (
            isDriving &&
            car
        ) {

            car.position.x +=
                (
                    currentLane *
                    laneWidth -
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
// START EVERYTHING
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function() {

        init();

    }
);
