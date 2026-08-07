// ============================================================
// KOLLINS RUNNER GAME
// COMPLETE SCRIPT
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

let isJumping = false;
let isSliding = false;
let yVelocity = 0;

const gravity = 0.018;
const jumpForce = 0.38;

// ------------------------------------------------------------
// SKATEBOARD SHIELD
// ------------------------------------------------------------

let skateboardActive = false;
let skateboardTimer = null;
let lastTapTime = 0;

// 15 seconds
const skateboardDuration = 15000;

// ------------------------------------------------------------
// RUNNING ANIMATION
// ------------------------------------------------------------

let runTime = 0;

// ------------------------------------------------------------
// SPAWNING
// ------------------------------------------------------------

let spawnTimer = null;

// ============================================================
// INITIALIZE
// ============================================================

function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x87ceeb);

    scene.fog = new THREE.Fog(
        0x87ceeb,
        35,
        180
    );

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5.2, 8);

    camera.lookAt(
        0,
        1.5,
        -15
    );

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

    // --------------------------------------------------------
    // LIGHTING
    // --------------------------------------------------------

    const ambient = new THREE.AmbientLight(
        0xffffff,
        0.65
    );

    scene.add(ambient);

    const sun = new THREE.DirectionalLight(
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

    // --------------------------------------------------------
    // WORLD
    // --------------------------------------------------------

    createWorld();

    // --------------------------------------------------------
    // PLAYER
    // --------------------------------------------------------

    createRunner();

    // --------------------------------------------------------
    // CHASER
    // --------------------------------------------------------

    createPolice();

    // --------------------------------------------------------
    // CONTROLS
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // BUTTONS
    // --------------------------------------------------------

    setupButtons();

    // --------------------------------------------------------
    // START ANIMATION
    // --------------------------------------------------------

    animate();
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // Ground

    const ground = new THREE.Mesh(

        new THREE.PlaneGeometry(
            24,
            3000
        ),

        new THREE.MeshStandardMaterial({
            color: 0x292929,
            roughness: 0.9
        })

    );

    ground.rotation.x = -Math.PI / 2;

    ground.position.z = -1200;

    ground.receiveShadow = true;

    scene.add(ground);


    // Rails

    for (let i = -1; i <= 1; i++) {

        const rail = new THREE.Mesh(

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


    // Sleepers

    for (
        let z = 0;
        z > -1500;
        z -= 5
    ) {

        const sleeper = new THREE.Mesh(

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


    // Side buildings

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
        8 + Math.random() * 8;

    const left = new THREE.Mesh(

        new THREE.BoxGeometry(
            4,
            height,
            12
        ),

        new THREE.MeshStandardMaterial({
            color:
                0x454545 +
                Math.floor(Math.random() * 5)
        })

    );

    left.position.set(
        -12,
        height / 2,
        z
    );

    scene.add(left);


    const right = left.clone();

    right.position.x = 12;

    scene.add(right);
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player = new THREE.Group();

    // Body

    const body = new THREE.Mesh(

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


    // Head

    const head = new THREE.Mesh(

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

    head.castShadow = true;

    player.add(head);


    // Legs

    const legMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x171717
        });


    const leftLeg = new THREE.Mesh(
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

    player.add(leftLeg);


    const rightLeg = new THREE.Mesh(
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

    player.add(rightLeg);


    // Arms

    const armMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffc58a
        });


    const leftArm = new THREE.Mesh(
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

    player.add(leftArm);


    const rightArm = new THREE.Mesh(
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

    player.add(rightArm);


    player.userData.leftLeg = leftLeg;
    player.userData.rightLeg = rightLeg;
    player.userData.leftArm = leftArm;
    player.userData.rightArm = rightArm;


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

    chaser = new THREE.Group();

    const body = new THREE.Mesh(

        new THREE.BoxGeometry(
            1.3,
            1.4,
            1.7
        ),

        new THREE.MeshStandardMaterial({
            color: 0x111111
        })

    );

    body.position.y = 0.8;

    chaser.add(body);


    // Police light

    const redLight = new THREE.Mesh(

        new THREE.BoxGeometry(
            0.45,
            0.18,
            0.35
        ),

        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        })

    );

    redLight.position.set(
        -0.28,
        1.55,
        0
    );

    chaser.add(redLight);


    const blueLight = redLight.clone();

    blueLight.material =
        new THREE.MeshStandardMaterial({
            color: 0x0055ff,
            emissive: 0x0055ff,
            emissiveIntensity: 0.8
        });

    blueLight.position.x = 0.28;

    chaser.add(blueLight);


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

    const board = new THREE.Group();

    const deck = new THREE.Mesh(

        new THREE.BoxGeometry(
            1.35,
            0.12,
            2.5
        ),

        new THREE.MeshStandardMaterial({
            color: 0x00d9ff,
            metalness: 0.5,
            roughness: 0.25,
            emissive: 0x003344
        })

    );

    deck.rotation.x = 0.02;

    board.add(deck);


    // Wheels

    for (
        let x of [-0.48, 0.48]
    ) {

        const wheel = new THREE.Mesh(

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


    board.position.y = 0.12;

    player.add(board);

    player.userData.skateboard = board;

    board.visible = false;
}


// ============================================================
// ACTIVATE SKATEBOARD
// ============================================================

function activateSkateboard() {

    if (!gameActive) return;

    // If already active, don't restart timer
    if (skateboardActive) return;

    skateboardActive = true;

    const board =
        player.userData.skateboard;

    if (board) {
        board.visible = true;
    }

    // Slight lift
    player.position.y = 0.18;

    if (skateboardTimer) {
        clearTimeout(skateboardTimer);
    }

    skateboardTimer = setTimeout(() => {

        deactivateSkateboard();

    }, skateboardDuration);
}


// ============================================================
// DEACTIVATE SKATEBOARD
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

            if (!gameActive) return;

            const now =
                Date.now();

            if (
                now - lastTapTime <
                350
            ) {

                activateSkateboard();

                lastTapTime = 0;

            } else {

                lastTapTime = now;
            }

        }
    );


    // Desktop double-click

    window.addEventListener(
        "dblclick",
        function () {

            if (!gameActive) return;

            activateSkateboard();

        }
    );
}


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer() {

    if (!player) return;


    // Jump

    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -= gravity;


        if (
            player.position.y <=
            (skateboardActive ? 0.18 : 0)
        ) {

            player.position.y =
                skateboardActive
                    ? 0.18
                    : 0;

            isJumping = false;

            yVelocity = 0;
        }
    }


    // Lane movement

    const targetX =
        currentLane *
        laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // Running animation

    if (gameActive) {

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

        player.rotation.z =
            (
                targetX -
                player.position.x
            ) * -0.08;
    }


    // Skateboard lean

    if (
        skateboardActive &&
        player.userData.skateboard
    ) {

        player.userData.skateboard.rotation.z =
            Math.sin(
                Date.now() * 0.008
            ) * 0.04;
    }
}


// ============================================================
// OBJECT UPDATE
// ============================================================

function updateObjects() {

    // --------------------------------------------------------
    // OBSTACLES
    // --------------------------------------------------------

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];

        obj.position.z += speed;


        // Collision

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

                // --------------------------------------------
                // SKATEBOARD SHIELD
                // --------------------------------------------

                if (skateboardActive) {

                    scene.remove(obj);

                    obstacles.splice(
                        i,
                        1
                    );

                    deactivateSkateboard();

                    score += 25;

                    updateHUD();

                    continue;

                } else {

                    gameOver();

                    return;
                }
            }
        }


        // Remove old obstacle

        if (obj.position.z > 12) {

            scene.remove(obj);

            obstacles.splice(
                i,
                1
            );
        }
    }


    // --------------------------------------------------------
    // COINS
    // --------------------------------------------------------

    for (
        let i = coins.length - 1;
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
            ) < 1.35
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


    // --------------------------------------------------------
    // POLICE CHASER
    // --------------------------------------------------------

    if (
        chaser &&
        player
    ) {

        const desiredZ =
            skateboardActive
                ? 5.5
                : 6.5;

        chaser.position.z +=
            (
                desiredZ -
                chaser.position.z
            ) * 0.035;

        chaser.position.x +=
            (
                player.position.x -
                chaser.position.x
            ) * 0.035;

        chaser.position.y =
            0;

        // flashing police lights

        chaser.rotation.y =
            Math.sin(
                Date.now() * 0.01
            ) * 0.02;
    }


    // --------------------------------------------------------
    // SPEED
    // --------------------------------------------------------

    if (
        speed <
        maxSpeed
    ) {

        speed +=
            0.000025;
    }


    score += 1;

    updateHUD();
}


// ============================================================
// SPAWN SYSTEM
// ============================================================

function spawnProceduralItemsLoop() {

    if (!gameActive) return;


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


    // --------------------------------------------------------
    // TRAIN
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // POLICE CAR
    // --------------------------------------------------------

    else if (random < 0.42) {

        const car =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    2,
                    1.1,
                    4.2
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x151515,
                    metalness: 0.4
                })

            );


        car.position.set(
            lane,
            0.55,
            -160
        );

        scene.add(car);

        obstacles.push(car);
    }


    // --------------------------------------------------------
    // BARRIER
    // --------------------------------------------------------

    else if (random < 0.62) {

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


    // --------------------------------------------------------
    // COINS
    // --------------------------------------------------------

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

    if (!gameActive || !player)
        return;


    const ball =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.35,
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
        -1.5
    );


    scene.add(ball);

    footballs.push(ball);
}


// ============================================================
// UPDATE FOOTBALLS
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

    skateboardActive = false;

    lastTapTime = 0;


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;
    }


    // Remove old objects

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


    deactivateSkateboard();


    if (player) {

        player.position.set(
            0,
            0,
            0
        );
    }


    if (chaser) {

        chaser.position.set(
            0,
            0,
            7
        );
    }


    const menu =
        document.getElementById(
            "menu-screen"
        );

    if (menu) {

        menu.classList.add(
            "hidden"
        );
    }


    const gameOverScreen =
        document.getElementById(
            "gameover-screen"
        );

    if (gameOverScreen) {

        gameOverScreen.classList.add(
            "hidden"
        );
    }


    updateHUD();


    spawnProceduralItemsLoop();
}


// ============================================================
// RESET GAME
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


    if (scoreEl) {

        scoreEl.innerText =
            Math.floor(score);
    }


    if (coinEl) {

        coinEl.innerText =
            sessionCoins;
    }
}


// ============================================================
// KEYBOARD CONTROLS
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

        if (currentLane > -1)
            currentLane--;
    }


    // RIGHT

    if (
        key === "arrowright" ||
        key === "d"
    ) {

        if (currentLane < 1)
            currentLane++;
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
            () => {
                isSliding = false;
            },
            500
        );
    }


    // FOOTBALL

    if (key === "f") {

        createFootball();
    }


    // DESKTOP DOUBLE-TAP EQUIVALENT

    if (key === "b") {

        activateSkateboard();
    }
}


// ============================================================
// MOBILE SWIPE CONTROLS
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
        { passive: true }
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


            // Ignore tiny movements

            if (
                Math.abs(dx) < 40 &&
                Math.abs(dy) < 40
            ) {
                return;
            }


            // LEFT

            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (dx < -50) {

                    if (
                        currentLane >
                        -1
                    ) {
                        currentLane--;
                    }
                }


                // RIGHT

                if (dx > 50) {

                    if (
                        currentLane <
                        1
                    ) {
                        currentLane++;
                    }
                }
            }


            // UP = JUMP

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
        { passive: true }
    );
}


// ============================================================
// BUTTON CONNECTION
// ============================================================

function setupButtons() {

    const playBtn =
        document.getElementById(
            "play-btn"
        );

    const retryBtn =
        document.getElementById(
            "retry-btn"
        );


    if (playBtn) {

        playBtn.addEventListener(
            "click",
            function (e) {

                e.preventDefault();

                startGame();

            }
        );
    }


    if (retryBtn) {

        retryBtn.addEventListener(
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
// START EVERYTHING
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        init();

    }
);
