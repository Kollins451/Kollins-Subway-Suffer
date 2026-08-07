// ============================================================
// KOLLINS RUNNER GAME - COMPLETE SCRIPT
// ============================================================

let scene, camera, renderer;
let player, chaser;

let gameActive = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;
let speed = 0.38;
const maxSpeed = 1.0;

let obstacles = [];
let coins = [];
let footballs = [];
let worldCars = [];

let isJumping = false;
let isSliding = false;
let yVelocity = 0;

const gravity = 0.018;
const jumpForce = 0.38;

let spawnTimer = null;

// ============================================================
// SPECIAL FEATURES
// ============================================================

let skateboardActive = false;
let skateboardTimer = null;
let lastTapTime = 0;

const skateboardDuration = 15000;

let carMode = false;
let playerCar = null;

let runTime = 0;


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x87ceeb);

    scene.fog = new THREE.Fog(
        0x87ceeb,
        35,
        180
    );


    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth /
        window.innerHeight,
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
        1.5,
        -15
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

    document.body.appendChild(
        renderer.domElement
    );


    // LIGHTING

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.7
        );

    scene.add(ambient);


    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            1.1
        );

    sun.position.set(
        20,
        30,
        15
    );

    sun.castShadow = true;

    scene.add(sun);


    // WORLD

    createWorld();

    // PLAYER

    createRunner();

    // POLICE

    createPolice();

    // CONTROLS

    window.addEventListener(
        "keydown",
        handleKeyboardControls
    );

    window.addEventListener(
        "resize",
        onWindowResize
    );

    setupTouchControls();

    setupDoubleTap();

    setupButtons();

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                24,
                3000
            ),

            new THREE.MeshStandardMaterial({
                color: 0x292929,
                roughness: 0.9
            })

        );


    ground.rotation.x =
        -Math.PI / 2;

    ground.position.z =
        -1200;

    ground.receiveShadow = true;

    scene.add(ground);


    // RAILS

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        const rail =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.22,
                    0.12,
                    3000
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xaaaaaa,
                    metalness: 0.8
                })

            );


        rail.position.set(
            i * laneWidth,
            0.08,
            -1200
        );

        scene.add(rail);
    }


    // SLEEPERS

    for (
        let z = 0;
        z > -1500;
        z -= 5
    ) {

        const sleeper =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    12,
                    0.15,
                    0.35
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x5a4030
                })

            );


        sleeper.position.set(
            0,
            0.03,
            z
        );

        scene.add(sleeper);
    }


    // BUILDINGS

    for (
        let z = 0;
        z > -1200;
        z -= 45
    ) {

        createBuilding(z);
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(z) {

    const height =
        8 +
        Math.random() * 8;


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x505050
        });


    const left =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                height,
                12
            ),

            material
        );


    left.position.set(
        -12,
        height / 2,
        z
    );

    scene.add(left);


    const right =
        left.clone();

    right.position.x = 12;

    scene.add(right);
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
                color: 0xff5a1f
            })

        );


    body.position.y = 1.25;

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
                color: 0xffc58a
            })

        );


    head.position.y = 2.15;

    player.add(head);


    // LEGS

    const legMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x171717
        });


    const leftLeg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.28,
                0.85,
                0.35
            ),
            legMaterial
        );


    leftLeg.position.set(
        -0.22,
        0.45,
        0
    );


    const rightLeg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.28,
                0.85,
                0.35
            ),
            legMaterial
        );


    rightLeg.position.set(
        0.22,
        0.45,
        0
    );


    player.add(leftLeg);
    player.add(rightLeg);


    // ARMS

    const armMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffc58a
        });


    const leftArm =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.22,
                0.85,
                0.22
            ),
            armMaterial
        );


    leftArm.position.set(
        -0.62,
        1.35,
        0
    );


    const rightArm =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.22,
                0.85,
                0.22
            ),
            armMaterial
        );


    rightArm.position.set(
        0.62,
        1.35,
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


    // SKATEBOARD

    createSkateboard();


    player.position.set(
        0,
        0,
        0
    );


    scene.add(player);
}


// ============================================================
// POLICE CHASER
// ============================================================

function createPolice() {

    chaser =
        new THREE.Group();


    // POLICE CAR BODY

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.5,
                0.8,
                2.8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.5
            })

        );


    body.position.y = 0.55;

    chaser.add(body);


    // ROOF

    const roof =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.15,
                0.45,
                1.4
            ),

            new THREE.MeshStandardMaterial({
                color: 0xeeeeee
            })

        );


    roof.position.y = 1.05;

    chaser.add(roof);


    // RED LIGHT

    const red =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.4,
                0.16,
                0.3
            ),

            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000
            })

        );


    red.position.set(
        -0.25,
        1.35,
        0
    );


    chaser.add(red);


    // BLUE LIGHT

    const blue =
        red.clone();


    blue.material =
        new THREE.MeshStandardMaterial({
            color: 0x0055ff,
            emissive: 0x0055ff
        });


    blue.position.x = 0.25;

    chaser.add(blue);


    chaser.position.set(
        0,
        0,
        7
    );


    scene.add(chaser);
}


// ============================================================
// SKATEBOARD
// ============================================================

function createSkateboard() {

    const board =
        new THREE.Group();


    const deck =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.4,
                0.12,
                2.5
            ),

            new THREE.MeshStandardMaterial({
                color: 0x00d9ff,
                metalness: 0.6,
                emissive: 0x003344
            })

        );


    board.add(deck);


    for (
        const x of [-0.48, 0.48]
    ) {

        const wheel =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.13,
                    0.13,
                    0.12,
                    12
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x111111
                })

            );


        wheel.rotation.z =
            Math.PI / 2;


        wheel.position.set(
            x,
            -0.12,
            0
        );


        board.add(wheel);
    }


    board.position.y =
        0.12;


    board.visible = false;

    player.add(board);

    player.userData.skateboard =
        board;
}


// ============================================================
// SKATEBOARD ACTIVATE
// ============================================================

function activateSkateboard() {

    if (!gameActive)
        return;


    if (skateboardActive)
        return;


    skateboardActive = true;


    const board =
        player.userData.skateboard;


    if (board)
        board.visible = true;


    if (!isJumping)
        player.position.y = 0.18;


    if (skateboardTimer)
        clearTimeout(skateboardTimer);


    skateboardTimer =
        setTimeout(
            deactivateSkateboard,
            15000
        );
}


// ============================================================
// SKATEBOARD DEACTIVATE
// ============================================================

function deactivateSkateboard() {

    skateboardActive = false;


    if (skateboardTimer) {

        clearTimeout(
            skateboardTimer
        );

        skateboardTimer = null;
    }


    if (
        player &&
        player.userData.skateboard
    ) {

        player.userData.skateboard.visible =
            false;
    }


    if (
        player &&
        !isJumping
    ) {

        player.position.y = 0;
    }
}


// ============================================================
// DOUBLE TAP
// ============================================================

function setupDoubleTap() {

    window.addEventListener(
        "touchend",
        function () {

            if (!gameActive)
                return;


            const now =
                Date.now();


            if (
                now -
                lastTapTime <
                350
            ) {

                activateSkateboard();

                lastTapTime = 0;

            } else {

                lastTapTime = now;
            }

        },
        {
            passive: true
        }
    );


    window.addEventListener(
        "dblclick",
        function () {

            activateSkateboard();

        }
    );
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

        yVelocity -= gravity;


        const ground =
            skateboardActive
                ? 0.18
                : 0;


        if (
            player.position.y <=
            ground
        ) {

            player.position.y =
                ground;

            isJumping = false;

            yVelocity = 0;
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


    // RUNNING ANIMATION

    runTime += 0.25;


    const swing =
        Math.sin(runTime) *
        0.65;


    if (player.userData.leftLeg)
        player.userData.leftLeg.rotation.x =
            swing;


    if (player.userData.rightLeg)
        player.userData.rightLeg.rotation.x =
            -swing;


    if (player.userData.leftArm)
        player.userData.leftArm.rotation.x =
            -swing;


    if (player.userData.rightArm)
        player.userData.rightArm.rotation.x =
            swing;


    // LEAN

    player.rotation.z =
        (
            targetX -
            player.position.x
        ) * -0.08;
}


// ============================================================
// OBJECT UPDATE
// ============================================================

function updateObjects() {

    // OBSTACLES

    for (
        let i =
            obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];


        obj.position.z += speed;


        // COLLISION

        if (
            player &&
            obj.position.z > -4 &&
            obj.position.z < 2
        ) {

            const dx =
                Math.abs(
                    player.position.x -
                    obj.position.x
                );


            const dy =
                Math.abs(
                    player.position.y -
                    obj.position.y
                );


            if (
                dx < 1.35 &&
                dy < 2
            ) {

                // SKATEBOARD SAVES PLAYER

                if (skateboardActive) {

                    scene.remove(obj);

                    obstacles.splice(
                        i,
                        1
                    );


                    score += 25;

                    updateHUD();


                    // skateboard ends
                    deactivateSkateboard();


                    continue;

                } else {

                    gameOver();

                    return;
                }
            }
        }


        if (
            obj.position.z >
            12
        ) {

            scene.remove(obj);

            obstacles.splice(
                i,
                1
            );
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


        coin.position.z += speed;

        coin.rotation.y += 0.12;


        if (
            player &&
            player.position.distanceTo(
                coin.position
            ) < 1.3
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
            coin.position.z >
            12
        ) {

            scene.remove(coin);

            coins.splice(
                i,
                1
            );
        }
    }


    // POLICE CHASER

    if (
        chaser &&
        player
    ) {

        const targetZ =
            skateboardActive
                ? 5.5
                : 6.5;


        chaser.position.z +=
            (
                targetZ -
                chaser.position.z
            ) * 0.035;


        chaser.position.x +=
            (
                player.position.x -
                chaser.position.x
            ) * 0.04;


        chaser.position.y = 0;
    }


    // OTHER CARS

    for (
        let i =
            worldCars.length - 1;
        i >= 0;
        i--
    ) {

        const car =
            worldCars[i];


        car.position.z +=
            speed * 1.15;


        if (
            car.position.z >
            12
        ) {

            scene.remove(car);

            worldCars.splice(
                i,
                1
            );
        }
    }


    // SPEED

    if (
        speed <
        maxSpeed
    ) {

        speed += 0.000025;
    }


    score += 1;

    updateHUD();
}


// ============================================================
// SPAWN
// ============================================================

function spawnProceduralItemsLoop() {

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
                Math.random() * 3
            )
        ];


    const random =
        Math.random();


    // TRAIN

    if (random < 0.20) {

        const train =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    2.8,
                    3.2,
                    12
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x555b63,
                    metalness: 0.5
                })

            );


        train.position.set(
            lane,
            1.6,
            -160
        );


        scene.add(train);

        obstacles.push(train);
    }


    // POLICE CAR OBSTACLE

    else if (random < 0.38) {

        const car =
            createCarModel(
                lane,
                -160,
                false
            );


        obstacles.push(car);
    }


    // BARRIER

    else if (random < 0.58) {

        const barrier =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    2.6,
                    1.4,
                    1.3
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xff8c00
                })

            );


        barrier.position.set(
            lane,
            0.7,
            -160
        );


        scene.add(barrier);

        obstacles.push(barrier);
    }


    // COINS

    else {

        createCoins(lane);
    }


    const delay =
        Math.max(
            550,
            1100 -
            speed * 350
        );


    spawnTimer =
        setTimeout(
            spawnProceduralItemsLoop,
            delay
        );
}


// ============================================================
// CREATE CAR
// ============================================================

function createCarModel(
    lane,
    z,
    usable
) {

    const car =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.0,
                0.75,
                4.0
            ),

            new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.5
            })

        );


    body.position.y = 0.55;

    car.add(body);


    const cabin =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.45,
                0.55,
                1.8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x6f8fa8,
                metalness: 0.2,
                roughness: 0.25
            })

        );


    cabin.position.y = 1.05;

    car.add(cabin);


    // WHEELS

    for (
        const x of [-0.85, 0.85]
    ) {

        for (
            const zOffset of [-1.25, 1.25]
        ) {

            const wheel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(
                        0.35,
                        0.35,
                        0.22,
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
                0.35,
                zOffset
            );


            car.add(wheel);
        }
    }


    car.position.set(
        lane,
        0,
        z
    );


    scene.add(car);


    car.userData.usable =
        usable;


    return car;
}


// ============================================================
// ENTER CAR
// ============================================================

function enterCar() {

    if (!gameActive)
        return;


    if (carMode)
        return;


    carMode = true;


    if (!player)
        return;


    // Hide runner

    player.visible = false;


    // Create player's car

    playerCar =
        createCarModel(
            player.position.x,
            player.position.z,
            true
        );


    playerCar.userData.playerCar =
        true;


    // Place it where player is

    playerCar.position.x =
        player.position.x;

    playerCar.position.z =
        player.position.z;


    // Temporarily make runner disappear

    player.visible = false;
}


// ============================================================
// EXIT CAR
// ============================================================

function exitCar() {

    if (!carMode)
        return;


    carMode = false;


    if (playerCar) {

        player.position.x =
            playerCar.position.x;

        player.position.z =
            playerCar.position.z;


        scene.remove(
            playerCar
        );

        playerCar = null;
    }


    player.visible = true;
}


// ============================================================
// UPDATE PLAYER CAR
// ============================================================

function updatePlayerCar() {

    if (
        !carMode ||
        !playerCar
    )
        return;


    playerCar.position.z = 0;


    const targetX =
        currentLane *
        laneWidth;


    playerCar.position.x +=
        (
            targetX -
            playerCar.position.x
        ) * 0.18;


    // Move world toward player

    playerCar.rotation.y =
        (
            targetX -
            playerCar.position.x
        ) * 0.03;
}


// ============================================================
// COINS
// ============================================================

function createCoins(lane) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const coin =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.42,
                    0.42,
                    0.16,
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
            -120 -
            i * 4
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// FOOTBALL
// ============================================================

function createFootball() {

    if (!gameActive)
        return;


    if (!player)
        return;


    const ball =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.35,
                20,
                20
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.7
            })

        );


    ball.position.set(
        player.position.x,
        0.45,
        player.position.z - 1.5
    );


    scene.add(ball);

    footballs.push(ball);
}


// ============================================================
// FOOTBALL UPDATE
// ============================================================

function updateFootballs() {

    for (
        let i =
            footballs.length - 1;
        i >= 0;
        i--
    ) {

        const ball =
            footballs[i];


        ball.position.z -=
            1.4;


        ball.rotation.x +=
            0.25;


        ball.rotation.z +=
            0.12;


        if (
            ball.position.z <
            -150
        ) {

            scene.remove(ball);

            footballs.splice(
                i,
                1
            );
        }
    }
}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive)
        return;


    gameActive = false;


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    deactivateSkateboard();


    const screen =
        document.getElementById(
            "gameover-screen"
        );


    if (screen) {

        screen.classList.remove(
            "hidden"
        );
    }
}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    gameActive = true;

    score = 0;

    sessionCoins = 0;

    speed = 0.38;

    currentLane = 0;

    isJumping = false;

    isSliding = false;

    yVelocity = 0;

    carMode = false;


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    // REMOVE OLD OBJECTS

    obstacles.forEach(
        obj => scene.remove(obj)
    );

    coins.forEach(
        coin => scene.remove(coin)
    );

    footballs.forEach(
        ball => scene.remove(ball)
    );


    obstacles = [];
    coins = [];
    footballs = [];


    if (playerCar) {

        scene.remove(
            playerCar
        );

        playerCar = null;
    }


    deactivateSkateboard();


    player.visible = true;


    player.position.set(
        0,
        0,
        0
    );


    chaser.position.set(
        0,
        0,
        7
    );


    const menu =
        document.getElementById(
            "menu-screen"
        );


    if (menu)
        menu.classList.add(
            "hidden"
        );


    const gameOverScreen =
        document.getElementById(
            "gameover-screen"
        );


    if (gameOverScreen)
        gameOverScreen.classList.add(
            "hidden"
        );


    updateHUD();


    spawnProceduralItemsLoop();
}


// ============================================================
// RESET
// ============================================================

function resetGame() {

    startGame();
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    const scoreEl =
        document.getElementById(
            "score-val"
        );


    const coinEl =
        document.getElementById(
            "coin-val"
        );


    if (scoreEl)
        scoreEl.innerText =
            Math.floor(score);


    if (coinEl)
        coinEl.innerText =
            sessionCoins;
}


// ============================================================
// KEYBOARD
// ============================================================

function handleKeyboardControls(e) {

    if (!gameActive)
        return;


    const key =
        e.key.toLowerCase();


    // LEFT

    if (
        key === "arrowleft" ||
        key === "a"
    ) {

        if (
            currentLane >
            -1
        ) {

            currentLane--;
        }
    }


    // RIGHT

    if (
        key === "arrowright" ||
        key === "d"
    ) {

        if (
            currentLane <
            1
        ) {

            currentLane++;
        }
    }


    // JUMP

    if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
    ) {

        if (!isJumping) {

            isJumping = true;

            yVelocity =
                jumpForce;
        }
    }


    // SLIDE

    if (
        key === "arrowdown" ||
        key === "s"
    ) {

        isSliding = true;


        setTimeout(
            function () {

                isSliding = false;

            },
            500
        );
    }


    // FOOTBALL

    if (key === "f") {

        createFootball();
    }


    // SKATEBOARD TEST

    if (key === "b") {

        activateSkateboard();
    }


    // ENTER CAR

    if (key === "e") {

        if (!carMode) {

            enterCar();

        } else {

            exitCar();
        }
    }
}


// ============================================================
// TOUCH SWIPES
// ============================================================

function setupTouchControls() {

    let startX = 0;
    let startY = 0;


    window.addEventListener(
        "touchstart",
        function (e) {

            if (!e.touches.length)
                return;


            startX =
                e.touches[0].clientX;

            startY =
                e.touches[0].clientY;

        },
        {
            passive: true
        }
    );


    window.addEventListener(
        "touchend",
        function (e) {

            if (!gameActive)
                return;


            if (!e.changedTouches.length)
                return;


            const endX =
                e.changedTouches[0].clientX;


            const endY =
                e.changedTouches[0].clientY;


            const dx =
                endX - startX;


            const dy =
                endY - startY;


            if (
                Math.abs(dx) < 40 &&
                Math.abs(dy) < 40
            ) {

                return;
            }


            // LEFT / RIGHT

            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (
                    dx < -50 &&
                    currentLane > -1
                ) {

                    currentLane--;
                }


                if (
                    dx > 50 &&
                    currentLane < 1
                ) {

                    currentLane++;
                }
            }


            // JUMP

            if (
                Math.abs(dy) >
                Math.abs(dx)
            ) {

                if (
                    dy < -50 &&
                    !isJumping
                ) {

                    isJumping = true;

                    yVelocity =
                        jumpForce;
                }
            }

        },
        {
            passive: true
        }
    );
}


// ============================================================
// BUTTONS
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
            function (e) {

                e.preventDefault();

                startGame();

            }
        );
    }


    if (retry) {

        retry.addEventListener(
            "click",
            function (e) {

                e.preventDefault();

                resetGame();

            }
        );
    }
}


// ============================================================
// RESIZE
// ============================================================

function onWindowResize() {

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


    if (gameActive) {

        updatePlayer();

        updateObjects();

        updateFootballs();

        updatePlayerCar();
    }


    if (
        renderer &&
        scene &&
        camera
    ) {

        renderer.render(
            scene,
            camera
        );
    }
}


// ============================================================
// START
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        init();

    }
);
