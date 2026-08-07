// ============================================================
// KOLLINS RUNNER — COMPLETE WORKING GAME
// ============================================================

let scene, camera, renderer;
let player, police, car, football;

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

let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let spawnTimer = null;
let footballTimer = null;

let audioContext = null;

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


    // CAMERA
    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8);

    camera.lookAt(0, 1.3, -18);


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

    document.body.appendChild(renderer.domElement);


    // LIGHT
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

    sunlight.position.set(20, 40, 15);
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

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // ROAD
    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(22, 3000),
            new THREE.MeshStandardMaterial({
                color: 0x30343b,
                roughness: 0.85
            })
        );

    road.rotation.x = -Math.PI / 2;
    road.position.z = -1500;
    road.receiveShadow = true;

    scene.add(road);


    // TRACK LINES
    for (let x of [-laneWidth / 2, laneWidth / 2]) {

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


    // RAILS
    for (let x of [-5.2, 5.2]) {

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

    lamp.position.set(
        x,
        6.1,
        z
    );

    scene.add(lamp);
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player = new THREE.Group();


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

    player.userData.leftLeg = leftLeg;
    player.userData.rightLeg = rightLeg;


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

    player.userData.leftArm = leftArm;
    player.userData.rightArm = rightArm;


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
// BUTTON SETUP
// ============================================================

function setupButtons() {

    const playButton =
        document.getElementById("play-btn");

    const retryButton =
        document.getElementById("retry-btn");


    if (playButton) {

        playButton.onclick = function(e) {

            e.preventDefault();

            startGame();
        };
    }


    if (retryButton) {

        retryButton.onclick = function(e) {

            e.preventDefault();

            startGame();
        };
    }


    // CAR BUTTON
    createGameButton(
        "🚗 CAR",
        enterCar
    );


    // BALL BUTTON
    createGameButton(
        "⚽ KICK",
        kickFootball
    );
}


// ============================================================
// MOBILE GAME BUTTONS
// ============================================================

function createGameButton(text, action) {

    let container =
        document.getElementById(
            "game-action-buttons"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "game-action-buttons";

        container.style.position = "fixed";
        container.style.bottom = "18px";
        container.style.left = "50%";
        container.style.transform =
            "translateX(-50%)";

        container.style.zIndex = "9999";

        container.style.display = "flex";
        container.style.gap = "10px";

        document.body.appendChild(container);
    }


    const button =
        document.createElement("button");

    button.innerText = text;

    button.style.padding =
        "13px 18px";

    button.style.border = "none";

    button.style.borderRadius =
        "16px";

    button.style.background =
        "rgba(10,10,10,0.9)";

    button.style.color = "white";

    button.style.fontWeight = "bold";

    button.style.fontSize = "15px";

    button.style.touchAction =
        "manipulation";


    button.addEventListener(
        "pointerdown",
        function(e) {

            e.preventDefault();

            action();
        }
    );


    container.appendChild(button);
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

    if (!gameActive) return;

    gameActive = false;

    gameOverState = true;


    if (spawnTimer) {

        clearTimeout(spawnTimer);

        spawnTimer = null;
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
            screen.querySelector("p");

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
// OBJECT CLEANUP
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

        clearTimeout(spawnTimer);

        spawnTimer = null;
    }


    if (football) {

        scene.remove(football);

        football = null;
    }
}


// ============================================================
// SPAWN OBJECTS
// ============================================================

function spawnObjects() {

    if (!gameActive) return;


    const lanes = [
        -laneWidth,
        0,
        laneWidth
    ];

    const lane =
        lanes[
            Math.floor(
                Math.random() * lanes.length
            )
        ];


    const random =
        Math.random();


    if (random < 0.35) {

        createBarrier(lane);

    } else if (random < 0.55) {

        createTrafficCar(lane);

    } else if (random < 0.72) {

        createTrain(lane);

    } else {

        createCoinLine(lane);
    }


    spawnTimer =
        setTimeout(
            spawnObjects,
            Math.max(
                650,
                1100 - speed * 400
            )
        );
}


// ============================================================
// TRAIN
// ============================================================

function createTrain(lane) {

    const train =
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


    group.position.set(
        lane,
        0,
        -140
    );

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
                    emissive: 0x8a6500,
                    emissiveIntensity: 0.5,
                    metalness: 1,
                    roughness: 0.2
                })
            );


        coin.position.set(
            lane,
            1.25,
            -105 - i * 5
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


    // OBSTACLES
    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];

        obj.position.z += speed;


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

        coin.position.z += speed;

        coin.rotation.y += 0.1;


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

            scene.remove(coin);

            coins.splice(i, 1);
        }
    }


    // SPEED
    if (speed < maxSpeed) {

        speed += 0.000035;
    }


    score += 1;

    updateHUD();
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(a, b) {

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

    if (!player) return;


    // JUMP
    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -= gravity;


        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            isJumping = false;

            yVelocity = 0;
        }
    }


    // LANE
    const targetX =
        currentLane * laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // RUNNING
    if (
        gameActive &&
        !isDriving
    ) {

        const t =
            performance.now() * 0.012;


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

    if (!gameActive) return;


    police.position.x +=
        (
            player.position.x -
            police.position.x
        ) * 0.035;
}


// ============================================================
// CAR
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

    body.position.y = 0.65;

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

    roof.position.y = 1.25;

    car.add(roof);


    // WHEELS
    for (let x of [-1, 1]) {

        for (let z of [-1.25, 1.25]) {

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

    car.visible = false;

    scene.add(car);
}


// ============================================================
// ENTER / EXIT CAR
// ============================================================

function enterCar() {

    if (!gameActive) return;


    if (!car) {

        createPlayerCar();
    }


    if (isDriving) {

        isDriving = false;

        car.visible = false;

        player.visible = true;

        stopCarSound();

        return;
    }


    isDriving = true;

    car.position.x =
        player.position.x;

    car.visible = true;

    player.visible = false;

    playCarSound();

    score += 100;

    updateHUD();
}


// ============================================================
// FOOTBALL
// ============================================================

function kickFootball() {

    if (!gameActive) return;


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
        ? car.position.x
        : player.position.x,

        0.45,

        -1
    );


    scene.add(football);


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
// CONTROLS
// ============================================================

function setupControls() {

    window.addEventListener(
        "keydown",
        function(e) {

            if (!gameActive) return;


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

            startX = touch.clientX;
            startY = touch.clientY;
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
                touch.clientX - startX;

            const dy =
                touch.clientY - startY;


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
// JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping
    )
        return;


    isJumping = true;

    yVelocity = jumpForce;
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
    type = "sine"
) {

    if (!audioContext)
        return;


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = type;

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


    oscillator.connect(gain);

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


let carSoundOscillator = null;
let carSoundGain = null;


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

    if (carSoundOscillator) {

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

    if (!camera || !renderer)
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
        now - lastFrameTime;

    lastFrameTime = now;


    if (gameActive) {

        updatePlayer(delta);

        updateObjects();

        updatePolice();


        if (isDriving && car) {

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
