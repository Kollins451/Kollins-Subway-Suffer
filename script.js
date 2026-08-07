// ============================================================
// KOLLINS RUNNER — COMPLETE GAME ENGINE
// Replace the ENTIRE contents of script.js with this file.
// ============================================================

let scene, camera, renderer;
let player, policeCar;
let gameActive = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;
let speed = 0.42;
const maxSpeed = 1.05;

let obstacles = [];
let coins = [];
let effects = [];

let isJumping = false;
let isSliding = false;
let yVelocity = 0;

const gravity = 0.022;
const jumpPower = 0.43;

let playerMode = "RUNNER";
// RUNNER
// CAR

let playerCar = null;
let carCooldown = false;

let footballCooldown = false;

let spawnTimer = null;
let lastTime = 0;


// ============================================================
// INITIALIZATION
// ============================================================

function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x78c8f5);

    scene.fog = new THREE.Fog(
        0x78c8f5,
        35,
        180
    );


    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8.5);

    camera.lookAt(0, 1.5, -25);


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

    document.body.appendChild(
        renderer.domElement
    );


    // Lighting

    const ambient = new THREE.AmbientLight(
        0xffffff,
        0.7
    );

    scene.add(ambient);


    const sun = new THREE.DirectionalLight(
        0xffffff,
        1.2
    );

    sun.position.set(
        15,
        30,
        20
    );

    sun.castShadow = true;

    scene.add(sun);


    createWorld();
    createRunner();
    createPoliceCar();
    createGameControls();

    setupKeyboard();
    setupTouch();

    window.addEventListener(
        "resize",
        resizeGame
    );


    connectMenuButtons();

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // Track

    const track = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 3000),
        new THREE.MeshStandardMaterial({
            color: 0x252525,
            roughness: 0.85
        })
    );

    track.rotation.x = -Math.PI / 2;
    track.position.z = -1450;

    track.receiveShadow = true;

    scene.add(track);


    // Lane markings

    for (let i = -1; i <= 1; i++) {

        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.16,
                0.08,
                3000
            ),
            new THREE.MeshStandardMaterial({
                color: 0xbfc7ce,
                metalness: 0.8
            })
        );

        rail.position.set(
            i * laneWidth,
            0.06,
            -1450
        );

        scene.add(rail);
    }


    // Side walls / buildings

    for (
        let z = 0;
        z > -1500;
        z -= 45
    ) {

        createBuilding(-12, z);
        createBuilding(12, z);
    }


    // Street lights

    for (
        let z = 0;
        z > -1500;
        z -= 35
    ) {

        createStreetLight(-8, z);
        createStreetLight(8, z);
    }
}


function createBuilding(x, z) {

    const height =
        6 + Math.random() * 8;

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,
            height,
            8
        ),
        new THREE.MeshStandardMaterial({
            color:
                0x555555 +
                Math.floor(Math.random() * 4) * 0x111111
        })
    );

    building.position.set(
        x,
        height / 2,
        z
    );

    scene.add(building);
}


function createStreetLight(x, z) {

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.08,
            0.08,
            5,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8
        })
    );

    pole.position.set(
        x,
        2.5,
        z
    );

    scene.add(pole);


    const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.25,
            12,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffff88,
            emissiveIntensity: 1
        })
    );

    lamp.position.set(
        x,
        5,
        z
    );

    scene.add(lamp);
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player = new THREE.Group();

    // Body

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.85,
            1.25,
            0.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff5a1f
        })
    );

    body.position.y = 1.25;
    body.castShadow = true;

    player.add(body);


    // Head

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.38,
            20,
            20
        ),
        new THREE.MeshStandardMaterial({
            color: 0xc98255
        })
    );

    head.position.y = 2.15;

    player.add(head);


    // Cap

    const cap = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.7,
            0.18,
            0.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0x1565c0
        })
    );

    cap.position.set(
        0,
        2.48,
        0
    );

    player.add(cap);


    // Legs

    player.leftLeg = createLimb(
        0x222222,
        0.25,
        0.85,
        -0.25,
        0.55
    );

    player.rightLeg = createLimb(
        0x222222,
        0.25,
        0.85,
        0.25,
        0.55
    );

    player.add(player.leftLeg);
    player.add(player.rightLeg);


    // Arms

    player.leftArm = createLimb(
        0xff5a1f,
        0.2,
        0.8,
        -0.55,
        1.35
    );

    player.rightArm = createLimb(
        0xff5a1f,
        0.2,
        0.8,
        0.55,
        1.35
    );

    player.add(player.leftArm);
    player.add(player.rightArm);


    player.position.set(
        0,
        0,
        0
    );

    scene.add(player);
}


function createLimb(
    color,
    width,
    height,
    x,
    y
) {

    const limb = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            width
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    limb.position.set(
        x,
        y,
        0
    );

    limb.castShadow = true;

    return limb;
}


// ============================================================
// POLICE CAR CHASER
// ============================================================

function createPoliceCar() {

    policeCar = new THREE.Group();


    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.8,
            0.65,
            3.6
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.5
        })
    );

    body.position.y = 0.55;

    policeCar.add(body);


    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.25,
            0.55,
            1.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        })
    );

    roof.position.y = 1;

    policeCar.add(roof);


    // Red/blue police lights

    const redLight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.25,
            0.15,
            0.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000
        })
    );

    redLight.position.set(
        -0.25,
        1.35,
        0
    );

    policeCar.add(redLight);


    const blueLight = redLight.clone();

    blueLight.material =
        blueLight.material.clone();

    blueLight.material.color.set(
        0x0066ff
    );

    blueLight.material.emissive.set(
        0x0066ff
    );

    blueLight.position.x = 0.25;

    policeCar.add(blueLight);


    policeCar.position.set(
        0,
        0,
        8
    );

    scene.add(policeCar);
}


// ============================================================
// GAME BUTTONS
// ============================================================

function createGameControls() {

    let controls =
        document.getElementById(
            "game-controls"
        );


    if (!controls) {

        controls =
            document.createElement("div");

        controls.id =
            "game-controls";

        controls.style.position =
            "fixed";

        controls.style.bottom =
            "25px";

        controls.style.left =
            "50%";

        controls.style.transform =
            "translateX(-50%)";

        controls.style.zIndex =
            "9999";

        controls.style.display =
            "none";

        controls.style.gap =
            "10px";

        controls.style.alignItems =
            "center";

        controls.style.justifyContent =
            "center";

        document.body.appendChild(
            controls
        );
    }


    controls.innerHTML = `
        <button id="left-game-btn">⬅️</button>
        <button id="jump-game-btn">⬆️ JUMP</button>
        <button id="football-game-btn">⚽ KICK</button>
        <button id="right-game-btn">➡️</button>
        <button id="car-game-btn">🚗 ENTER CAR</button>
    `;


    styleGameButtons();


    document
        .getElementById("left-game-btn")
        .onclick = moveLeft;

    document
        .getElementById("right-game-btn")
        .onclick = moveRight;

    document
        .getElementById("jump-game-btn")
        .onclick = jump;

    document
        .getElementById("football-game-btn")
        .onclick = kickFootball;

    document
        .getElementById("car-game-btn")
        .onclick = toggleCar;
}


function styleGameButtons() {

    const buttons =
        document.querySelectorAll(
            "#game-controls button"
        );

    buttons.forEach(button => {

        button.style.border = "none";
        button.style.borderRadius = "14px";
        button.style.padding = "12px 14px";
        button.style.fontWeight = "bold";
        button.style.fontSize = "14px";
        button.style.background =
            "rgba(15,23,42,.9)";
        button.style.color = "white";
        button.style.boxShadow =
            "0 5px 18px rgba(0,0,0,.35)";
        button.style.touchAction = "manipulation";

    });
}


// ============================================================
// START / RETRY
// ============================================================

function connectMenuButtons() {

    const play =
        document.getElementById(
            "play-btn"
        );

    const retry =
        document.getElementById(
            "retry-btn"
        );


    if (play) {

        play.onclick = function(e) {

            e.preventDefault();

            startGame();

        };
    }


    if (retry) {

        retry.onclick = function(e) {

            e.preventDefault();

            resetGame();

        };
    }
}


function startGame() {

    gameActive = true;

    score = 0;
    sessionCoins = 0;

    speed = 0.42;

    currentLane = 0;

    playerMode = "RUNNER";

    isJumping = false;
    isSliding = false;

    player.position.set(
        0,
        0,
        0
    );

    policeCar.position.set(
        0,
        0,
        8
    );


    clearObjects();


    updateHUD();


    const menu =
        document.getElementById(
            "menu-screen"
        );

    if (menu) {

        menu.classList.add(
            "hidden"
        );
    }


    const gameOver =
        document.getElementById(
            "gameover-screen"
        );

    if (gameOver) {

        gameOver.classList.add(
            "hidden"
        );
    }


    const controls =
        document.getElementById(
            "game-controls"
        );

    if (controls) {

        controls.style.display =
            "flex";
    }


    beginSpawning();
}


function resetGame() {

    clearObjects();

    startGame();
}


// ============================================================
// SPAWNING
// ============================================================

function beginSpawning() {

    if (spawnTimer) {

        clearTimeout(spawnTimer);
    }

    spawnNext();
}


function spawnNext() {

    if (!gameActive) return;


    const lane =
        [-1, 0, 1][
            Math.floor(
                Math.random() * 3
            )
        ] * laneWidth;


    const random =
        Math.random();


    if (random < 0.35) {

        createObstacle(lane);

    } else if (random < 0.7) {

        createCoinLine(lane);

    } else {

        createVehicleObstacle(lane);
    }


    const delay =
        Math.max(
            500,
            1050 - speed * 450
        );


    spawnTimer =
        setTimeout(
            spawnNext,
            delay
        );
}


// ============================================================
// OBSTACLES
// ============================================================

function createObstacle(lane) {

    const obstacle =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.5,
                1.4,
                1.5
            ),

            new THREE.MeshStandardMaterial({
                color: 0xff3b30
            })

        );


    obstacle.position.set(
        lane,
        0.7,
        -110
    );


    obstacle.userData.type =
        "obstacle";


    scene.add(obstacle);

    obstacles.push(obstacle);
}


function createVehicleObstacle(lane) {

    const car =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2,
                1.1,
                4
            ),

            new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.5
            })

        );


    car.position.set(
        lane,
        0.6,
        -110
    );


    car.userData.type =
        "vehicle";


    scene.add(car);

    obstacles.push(car);
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

        const coin =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.38,
                    0.38,
                    0.13,
                    20
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    metalness: 1,
                    roughness: 0.15
                })

            );


        coin.rotation.z =
            Math.PI / 2;


        coin.position.set(
            lane,
            1.2,
            -90 - i * 5
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer(time) {

    if (!player) return;


    const targetX =
        currentLane * laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // Jump

    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -=
            gravity;


        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            yVelocity = 0;

            isJumping = false;
        }
    }


    // Runner animation

    if (
        gameActive &&
        playerMode === "RUNNER" &&
        !isJumping
    ) {

        const run =
            Math.sin(time * 0.018);


        player.leftLeg.rotation.x =
            run * 0.8;

        player.rightLeg.rotation.x =
            -run * 0.8;

        player.leftArm.rotation.x =
            -run * 0.6;

        player.rightArm.rotation.x =
            run * 0.6;


        player.position.y =
            Math.abs(run) * 0.035;
    }


    // Sliding

    if (isSliding) {

        player.scale.y = 0.55;

    } else {

        player.scale.y = 1;
    }


    // Car mode

    if (
        playerMode === "CAR" &&
        playerCar
    ) {

        playerCar.position.x +=
            (
                targetX -
                playerCar.position.x
            ) * 0.18;
    }
}


// ============================================================
// POLICE CHASING SYSTEM
// ============================================================

function updatePolice() {

    if (!policeCar) return;


    const targetX =
        playerMode === "CAR" &&
        playerCar
            ? playerCar.position.x
            : player.position.x;


    policeCar.position.x +=
        (
            targetX -
            policeCar.position.x
        ) * 0.035;


    // Police gets closer as speed increases

    const targetZ =
        playerMode === "CAR"
            ? 5.5
            : 6.5;


    policeCar.position.z +=
        (
            targetZ -
            policeCar.position.z
        ) * 0.02;


    // Flash police lights

    policeCar.children.forEach(
        (part, index) => {

            if (
                part.material &&
                part.material.emissive
            ) {

                part.material.emissiveIntensity =
                    Math.sin(
                        Date.now() * 0.015
                    ) > 0
                        ? 1.5
                        : 0.2;
            }
        }
    );


    // Police catches player

    if (
        gameActive &&
        policeCar.position.distanceTo(
            player.position
        ) < 2.1
    ) {

        gameOver();
    }
}


// ============================================================
// OBJECT UPDATE + COLLISION
// ============================================================

function updateObjects() {

    const moveSpeed =
        speed;


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
            obj.position.z > 12
        ) {

            scene.remove(obj);

            obstacles.splice(
                i,
                1
            );

            continue;
        }


        if (
            gameActive &&
            playerMode === "RUNNER"
        ) {

            const dx =
                Math.abs(
                    player.position.x -
                    obj.position.x
                );

            const dz =
                Math.abs(
                    player.position.z -
                    obj.position.z
                );


            if (
                dx < 1.25 &&
                dz < 1.6
            ) {

                if (
                    !isJumping &&
                    !isSliding
                ) {

                    gameOver();

                    return;
                }
            }
        }


        if (
            gameActive &&
            playerMode === "CAR" &&
            playerCar
        ) {

            const dx =
                Math.abs(
                    playerCar.position.x -
                    obj.position.x
                );

            const dz =
                Math.abs(
                    playerCar.position.z -
                    obj.position.z
                );


            if (
                dx < 1.5 &&
                dz < 2
            ) {

                gameOver();

                return;
            }
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
            0.12;


        const target =
            playerMode === "CAR" &&
            playerCar
                ? playerCar
                : player;


        if (
            target.position.distanceTo(
                coin.position
            ) < 1.4
        ) {

            score += 10;
            sessionCoins++;

            updateHUD();

            scene.remove(coin);

            coins.splice(
                i,
                1
            );

            continue;
        }


        if (
            coin.position.z > 12
        ) {

            scene.remove(coin);

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
            0.000035;
    }
}


// ============================================================
// ENTER / EXIT CAR
// ============================================================

function toggleCar() {

    if (!gameActive) return;


    if (playerMode === "RUNNER") {

        enterCar();

    } else {

        exitCar();
    }
}


function enterCar() {

    if (carCooldown) return;

    carCooldown = true;


    playerMode = "CAR";


    if (!playerCar) {

        playerCar =
            createPlayerCar();

        scene.add(
            playerCar
        );
    }


    playerCar.position.set(
        player.position.x,
        0,
        player.position.z
    );


    player.visible = false;
    playerCar.visible = true;


    const button =
        document.getElementById(
            "car-game-btn"
        );

    if (button) {

        button.innerText =
            "🏃 EXIT CAR";
    }


    showMessage(
        "🚗 YOU ENTERED THE CAR!"
    );


    setTimeout(
        () => {
            carCooldown = false;
        },
        700
    );
}


function exitCar() {

    if (carCooldown) return;

    carCooldown = true;


    playerMode = "RUNNER";


    player.position.set(
        playerCar.position.x,
        0,
        playerCar.position.z
    );


    player.visible = true;

    playerCar.visible = false;


    const button =
        document.getElementById(
            "car-game-btn"
        );

    if (button) {

        button.innerText =
            "🚗 ENTER CAR";
    }


    showMessage(
        "🏃 BACK TO RUNNING!"
    );


    setTimeout(
        () => {
            carCooldown = false;
        },
        700
    );
}


function createPlayerCar() {

    const car =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                0.65,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe53935,
                metalness: 0.5
            })
        );

    body.position.y = 0.6;

    car.add(body);


    const cabin =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.35,
                0.7,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202020,
                roughness: 0.2
            })
        );

    cabin.position.y = 1.05;

    car.add(cabin);


    // Wheels

    const wheelGeometry =
        new THREE.CylinderGeometry(
            0.38,
            0.38,
            0.25,
            16
        );


    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });


    const wheelPositions = [
        [-1, 0.35, -1.3],
        [1, 0.35, -1.3],
        [-1, 0.35, 1.3],
        [1, 0.35, 1.3]
    ];


    wheelPositions.forEach(
        position => {

            const wheel =
                new THREE.Mesh(
                    wheelGeometry,
                    wheelMaterial
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                position[0],
                position[1],
                position[2]
            );

            car.add(wheel);
        }
    );


    car.position.set(
        0,
        0,
        0
    );


    car.visible = false;

    return car;
}


// ============================================================
// FOOTBALL ⚽
// ============================================================

function kickFootball() {

    if (
        !gameActive ||
        footballCooldown ||
        playerMode !== "RUNNER"
    ) return;


    footballCooldown = true;


    const ball =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.34,
                20,
                20
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.5
            })
        );


    ball.position.set(
        player.position.x,
        0.45,
        player.position.z - 1
    );


    scene.add(ball);

    effects.push(ball);


    showMessage(
        "⚽ KICK!"
    );


    let distance = 0;


    const kickAnimation =
        setInterval(
            () => {

                ball.position.z -=
                    1.8;

                ball.rotation.x +=
                    0.35;

                ball.rotation.z +=
                    0.25;

                distance +=
                    1.8;


                // Football can hit an obstacle

                for (
                    let i =
                        obstacles.length - 1;
                    i >= 0;
                    i--
                ) {

                    const obstacle =
                        obstacles[i];


                    if (
                        ball.position.distanceTo(
                            obstacle.position
                        ) < 1.5
                    ) {

                        scene.remove(
                            obstacle
                        );

                        obstacles.splice(
                            i,
                            1
                        );

                        score += 50;

                        updateHUD();

                        showMessage(
                            "⚽ +50!"
                        );

                        clearInterval(
                            kickAnimation
                        );

                        scene.remove(
                            ball
                        );

                        return;
                    }
                }


                if (
                    distance > 80
                ) {

                    clearInterval(
                        kickAnimation
                    );

                    scene.remove(
                        ball
                    );
                }

            },
            30
        );


    setTimeout(
        () => {
            footballCooldown = false;
        },
        1200
    );
}


// ============================================================
// MOVEMENT
// ============================================================

function moveLeft() {

    if (!gameActive) return;

    if (
        currentLane > -1
    ) {

        currentLane--;
    }
}


function moveRight() {

    if (!gameActive) return;

    if (
        currentLane < 1
    ) {

        currentLane++;
    }
}


function jump() {

    if (
        !gameActive ||
        playerMode !== "RUNNER"
    ) return;


    if (!isJumping) {

        isJumping = true;

        yVelocity =
            jumpPower;
    }
}


function slide() {

    if (
        !gameActive ||
        playerMode !== "RUNNER"
    ) return;


    isSliding = true;


    setTimeout(
        () => {
            isSliding = false;
        },
        650
    );
}


// ============================================================
// KEYBOARD
// ============================================================

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        e => {

            const key =
                e.key.toLowerCase();


            if (
                key === "arrowleft" ||
                key === "a"
            ) {

                moveLeft();
            }


            if (
                key === "arrowright" ||
                key === "d"
            ) {

                moveRight();
            }


            if (
                key === "arrowup" ||
                key === "w" ||
                key === " "
            ) {

                e.preventDefault();

                jump();
            }


            if (
                key === "arrowdown" ||
                key === "s"
            ) {

                slide();
            }


            if (key === "f") {

                kickFootball();
            }


            if (key === "e") {

                toggleCar();
            }
        }
    );
}


// ============================================================
// MOBILE SWIPE
// ============================================================

function setupTouch() {

    let startX = 0;
    let startY = 0;


    window.addEventListener(
        "touchstart",
        e => {

            if (
                !e.touches.length
            ) return;


            startX =
                e.touches[0].clientX;

            startY =
                e.touches[0].clientY;
        },
        { passive: true }
    );


    window.addEventListener(
        "touchend",
        e => {

            if (
                !gameActive ||
                !e.changedTouches.length
            ) return;


            const endX =
                e.changedTouches[0].clientX;

            const endY =
                e.changedTouches[0].clientY;


            const dx =
                endX - startX;

            const dy =
                endY - startY;


            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (dx > 50) {

                    moveRight();

                } else if (dx < -50) {

                    moveLeft();
                }

            } else {

                if (dy < -50) {

                    jump();

                } else if (dy > 50) {

                    slide();
                }
            }
        },
        { passive: true }
    );
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
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive) return;


    gameActive = false;


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    const controls =
        document.getElementById(
            "game-controls"
        );

    if (controls) {

        controls.style.display =
            "none";
    }


    const gameOverScreen =
        document.getElementById(
            "gameover-screen"
        );


    if (gameOverScreen) {

        gameOverScreen.classList.remove(
            "hidden"
        );
    }


    showMessage(
        "🚓 CAUGHT!"
    );
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

    effects.forEach(
        obj => scene.remove(obj)
    );


    obstacles = [];
    coins = [];
    effects = [];
}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(text) {

    let message =
        document.getElementById(
            "game-message"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.id =
            "game-message";

        message.style.position =
            "fixed";

        message.style.top =
            "28%";

        message.style.left =
            "50%";

        message.style.transform =
            "translate(-50%, -50%)";

        message.style.zIndex =
            "10000";

        message.style.color =
            "white";

        message.style.fontSize =
            "30px";

        message.style.fontWeight =
            "900";

        message.style.textShadow =
            "0 3px 10px #000";

        message.style.pointerEvents =
            "none";

        document.body.appendChild(
            message
        );
    }


    message.innerText =
        text;

    message.style.opacity =
        "1";


    setTimeout(
        () => {

            message.style.transition =
                "opacity .4s";

            message.style.opacity =
                "0";

        },
        700
    );
}


// ============================================================
// ANIMATION LOOP
// ============================================================

function animate(time = 0) {

    requestAnimationFrame(
        animate
    );


    if (!lastTime) {

        lastTime = time;
    }


    lastTime = time;


    if (gameActive) {

        updatePlayer(time);

        updatePolice();

        updateObjects();


        // Camera follows runner

        camera.position.x +=
            (
                player.position.x -
                camera.position.x
            ) * 0.04;


        camera.lookAt(
            player.position.x,
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
// RESIZE
// ============================================================

function resizeGame() {

    if (
        !camera ||
        !renderer
    ) return;


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
// START EVERYTHING
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        init();

    }
);
