// ============================================================
// KOLLINS RUNNER — COMPLETE GAME ENGINE
// Replace your ENTIRE script.js with this file
// ============================================================

let scene;
let camera;
let renderer;

let player;
let chaser;

let gameActive = false;
let gameStarted = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;

let speed = 0.34;
const startingSpeed = 0.34;
const maxSpeed = 0.95;

let obstacles = [];
let coins = [];
let effects = [];

let isJumping = false;
let isSliding = false;
let yVelocity = 0;

const gravity = 0.018;
const jumpForce = 0.42;

let spawnTimer = null;
let animationStarted = false;

let lastTime = 0;


// ============================================================
// SAFE DOM HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// INITIALIZATION
// ============================================================

function init() {

    if (animationStarted) return;

    animationStarted = true;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x78c9f5);

    scene.fog = new THREE.Fog(
        0x78c9f5,
        45,
        260
    );


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
        1.5,
        -25
    );


    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
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
        0.75
    );

    scene.add(ambient);


    const sun = new THREE.DirectionalLight(
        0xffffff,
        1.1
    );

    sun.position.set(
        20,
        35,
        15
    );

    sun.castShadow = true;

    scene.add(sun);


    // Build game

    createWorld();

    createRunner();

    createPolice();


    // Controls

    window.addEventListener(
        "keydown",
        handleKeyboardControls
    );

    setupTouchControls();


    window.addEventListener(
        "resize",
        onWindowResize
    );


    // Buttons

    connectButtons();


    // Start rendering

    animate();
}


// ============================================================
// BUTTON CONNECTION
// ============================================================

function connectButtons() {

    const playButton = $("play-btn");
    const retryButton = $("retry-btn");


    if (playButton) {

        // Remove old handlers by replacing the button
        const newPlayButton =
            playButton.cloneNode(true);

        playButton.parentNode.replaceChild(
            newPlayButton,
            playButton
        );

        newPlayButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                startGame();

            }
        );


        // Mobile safety

        newPlayButton.addEventListener(
            "touchend",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                startGame();

            },
            {
                passive: false
            }
        );
    }


    if (retryButton) {

        const newRetryButton =
            retryButton.cloneNode(true);

        retryButton.parentNode.replaceChild(
            newRetryButton,
            retryButton
        );


        newRetryButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                resetGame();

            }
        );


        newRetryButton.addEventListener(
            "touchend",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                resetGame();

            },
            {
                passive: false
            }
        );
    }
}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    gameActive = true;
    gameStarted = true;


    score = 0;
    sessionCoins = 0;

    speed = startingSpeed;

    currentLane = 0;

    isJumping = false;
    isSliding = false;

    yVelocity = 0;


    // Remove old objects

    clearGameObjects();


    // Reset player

    if (player) {

        player.position.set(
            0,
            0,
            0
        );

        player.rotation.set(
            0,
            0,
            0
        );

        player.scale.set(
            1,
            1,
            1
        );
    }


    // Reset police

    if (chaser) {

        chaser.position.set(
            0,
            0,
            7
        );
    }


    updateHUD();


    // Hide menu

    const menu = $("menu-screen");

    if (menu) {

        menu.classList.add("hidden");

        menu.style.pointerEvents = "none";
    }


    // Hide game over

    const gameOverScreen =
        $("gameover-screen");

    if (gameOverScreen) {

        gameOverScreen.classList.add("hidden");

        gameOverScreen.style.pointerEvents = "none";
    }


    // Start spawning

    if (spawnTimer) {

        clearTimeout(spawnTimer);
    }

    spawnTimer = null;

    spawnProceduralItemsLoop();
}


// ============================================================
// RESET GAME
// ============================================================

function resetGame() {

    const gameOverScreen =
        $("gameover-screen");

    if (gameOverScreen) {

        gameOverScreen.classList.add("hidden");

        gameOverScreen.style.pointerEvents = "none";
    }

    startGame();
}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive) return;

    gameActive = false;


    if (spawnTimer) {

        clearTimeout(spawnTimer);

        spawnTimer = null;
    }


    // Save coins

    try {

        const oldCoins =
            Number(
                localStorage.getItem(
                    "subway_total_coins"
                )
            ) || 0;

        localStorage.setItem(
            "subway_total_coins",
            oldCoins + sessionCoins
        );

    } catch (error) {

        console.log(
            "Local storage unavailable"
        );
    }


    updateHUD();


    const gameOverScreen =
        $("gameover-screen");

    if (gameOverScreen) {

        gameOverScreen.classList.remove(
            "hidden"
        );

        gameOverScreen.style.pointerEvents =
            "auto";
    }
}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // Ground

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                22,
                3000
            ),

            new THREE.MeshStandardMaterial({
                color: 0x292929,
                roughness: 0.85
            })
        );


    ground.rotation.x =
        -Math.PI / 2;

    ground.position.z =
        -1450;

    ground.receiveShadow = true;

    scene.add(ground);


    // Lane markings

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        const rail =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.16,
                    0.12,
                    3000
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x9e9e9e,
                    metalness: 0.8
                })
            );


        rail.position.set(
            i * laneWidth,
            0.08,
            -1450
        );


        scene.add(rail);
    }


    // Wooden sleepers

    for (
        let z = 0;
        z > -1500;
        z -= 5
    ) {

        const sleeper =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    12,
                    0.16,
                    0.35
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x513a2b
                })
            );


        sleeper.position.set(
            0,
            0.05,
            z
        );


        scene.add(sleeper);
    }


    // Buildings

    for (
        let z = 0;
        z > -1400;
        z -= 45
    ) {

        createBuilding(
            -12,
            z
        );

        createBuilding(
            12,
            z
        );
    }


    // Street lights

    for (
        let z = 0;
        z > -1200;
        z -= 35
    ) {

        createStreetLight(
            -7,
            z
        );

        createStreetLight(
            7,
            z
        );
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function createBuilding(x, z) {

    const height =
        6 + Math.random() * 9;

    const width =
        3 + Math.random() * 3;


    const building =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                8
            ),

            new THREE.MeshStandardMaterial({
                color:
                    new THREE.Color(
                        0.25 +
                        Math.random() * 0.18,
                        0.25 +
                        Math.random() * 0.18,
                        0.28 +
                        Math.random() * 0.18
                    )
            })
        );


    building.position.set(
        x,
        height / 2,
        z
    );


    scene.add(building);


    // Windows

    for (
        let y = 2;
        y < height - 1;
        y += 2
    ) {

        const windowMesh =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.55,
                    0.8,
                    0.08
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x9edcff,
                    emissive: 0x163d55,
                    emissiveIntensity: 0.25
                })
            );


        const side =
            x < 0 ? 1 : -1;

        windowMesh.position.set(
            x + side * (width / 2 + 0.04),
            y,
            z
        );


        scene.add(windowMesh);
    }
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
                4,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.8
            })
        );


    pole.position.set(
        x,
        2,
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
                color: 0xffffcc,
                emissive: 0xffee88,
                emissiveIntensity: 1
            })
        );


    lamp.position.set(
        x,
        4,
        z
    );


    scene.add(lamp);
}


// ============================================================
// RUNNER
// ============================================================

function createRunner() {

    player =
        new THREE.Group();


    // Body

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.85,
                1.15,
                0.58
            ),

            new THREE.MeshStandardMaterial({
                color: 0xf4511e,
                roughness: 0.65
            })
        );


    body.position.y = 1.25;

    body.castShadow = true;

    player.add(body);


    // Head

    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.42,
                20,
                20
            ),

            new THREE.MeshStandardMaterial({
                color: 0xb86b3e,
                roughness: 0.7
            })
        );


    head.position.y = 2.05;

    head.castShadow = true;

    player.add(head);


    // Hair

    const hair =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.43,
                16,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),

            new THREE.MeshStandardMaterial({
                color: 0x171717
            })
        );


    hair.position.y = 2.18;

    player.add(hair);


    // Left leg

    const leftLeg =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.27,
                0.8,
                0.3
            ),

            new THREE.MeshStandardMaterial({
                color: 0x17233a
            })
        );


    leftLeg.position.set(
        -0.22,
        0.55,
        0
    );


    player.add(leftLeg);


    // Right leg

    const rightLeg =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.27,
                0.8,
                0.3
            ),

            new THREE.MeshStandardMaterial({
                color: 0x17233a
            })
        );


    rightLeg.position.set(
        0.22,
        0.55,
        0
    );


    player.add(rightLeg);


    player.userData.leftLeg =
        leftLeg;

    player.userData.rightLeg =
        rightLeg;


    // Arms

    const leftArm =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                0.85,
                0.25
            ),

            new THREE.MeshStandardMaterial({
                color: 0xf4511e
            })
        );


    leftArm.position.set(
        -0.58,
        1.3,
        0
    );


    player.add(leftArm);


    const rightArm =
        leftArm.clone();


    rightArm.position.x =
        0.58;


    player.add(rightArm);


    player.userData.leftArm =
        leftArm;

    player.userData.rightArm =
        rightArm;


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


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.1,
                1.7,
                0.75
            ),

            new THREE.MeshStandardMaterial({
                color: 0x123a91
            })
        );


    body.position.y = 0.85;

    chaser.add(body);


    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.35,
                16,
                16
            ),

            new THREE.MeshStandardMaterial({
                color: 0x8d552f
            })
        );


    head.position.y = 1.9;

    chaser.add(head);


    chaser.position.set(
        0,
        0,
        7
    );


    scene.add(chaser);
}


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer(delta) {

    if (!player) return;


    // Jump

    if (isJumping) {

        player.position.y +=
            yVelocity;

        yVelocity -= gravity;


        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            yVelocity = 0;

            isJumping = false;
        }
    }


    // Lane movement

    const targetX =
        currentLane * laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // Running animation

    if (gameActive) {

        const t =
            Date.now() * 0.012;


        const leftLeg =
            player.userData.leftLeg;

        const rightLeg =
            player.userData.rightLeg;

        const leftArm =
            player.userData.leftArm;

        const rightArm =
            player.userData.rightArm;


        if (!isSliding) {

            leftLeg.rotation.x =
                Math.sin(t) * 0.7;

            rightLeg.rotation.x =
                Math.sin(t + Math.PI) * 0.7;

            leftArm.rotation.x =
                Math.sin(t + Math.PI) * 0.5;

            rightArm.rotation.x =
                Math.sin(t) * 0.5;
        }


        player.position.y +=
            Math.sin(t * 0.5) *
            0.002;
    }


    // Sliding

    if (isSliding) {

        player.scale.y = 0.55;

        player.position.y = 0.05;

    } else {

        player.scale.y = 1;
    }
}


// ============================================================
// OBJECT UPDATE
// ============================================================

function updateObjects() {

    // Obstacles

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const object =
            obstacles[i];


        object.position.z +=
            speed;


        // Vehicle rotation / animation

        if (
            object.userData &&
            object.userData.vehicle
        ) {

            object.rotation.y +=
                0.01;
        }


        // Collision

        if (
            player &&
            checkCollision(
                player,
                object
            )
        ) {

            gameOver();

            return;
        }


        if (
            object.position.z > 15
        ) {

            scene.remove(object);

            obstacles.splice(
                i,
                1
            );
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
            speed;


        coin.rotation.y +=
            0.08;


        coin.rotation.x +=
            0.02;


        if (
            player &&
            player.position.distanceTo(
                coin.position
            ) < 1.3
        ) {

            score += 10;

            sessionCoins++;

            updateHUD();


            createCoinEffect(
                coin.position
            );


            scene.remove(coin);

            coins.splice(
                i,
                1
            );

            continue;
        }


        if (
            coin.position.z > 15
        ) {

            scene.remove(coin);

            coins.splice(
                i,
                1
            );
        }
    }


    // Speed increase

    if (
        speed < maxSpeed
    ) {

        speed +=
            0.000025;
    }


    // Police slowly follows

    if (chaser && player) {

        const targetX =
            player.position.x;


        chaser.position.x +=
            (
                targetX -
                chaser.position.x
            ) * 0.025;


        chaser.position.z +=
            (
                3.5 -
                chaser.position.z
            ) * 0.01;
    }
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision(
    playerObject,
    obstacle
) {

    const dx =
        Math.abs(
            playerObject.position.x -
            obstacle.position.x
        );


    const dz =
        Math.abs(
            playerObject.position.z -
            obstacle.position.z
        );


    const dy =
        Math.abs(
            playerObject.position.y -
            obstacle.position.y
        );


    // Jump can avoid low obstacles

    if (
        obstacle.userData &&
        obstacle.userData.low &&
        playerObject.position.y > 0.7
    ) {

        return false;
    }


    // Air vehicles

    if (
        obstacle.userData &&
        obstacle.userData.air
    ) {

        if (
            playerObject.position.y < 2.5
        ) {

            return false;
        }
    }


    return (
        dx < 1.25 &&
        dz < 1.8 &&
        dy < 2
    );
}


// ============================================================
// SPAWNER
// ============================================================

function spawnProceduralItemsLoop() {

    if (!gameActive) {

        spawnTimer = null;

        return;
    }


    const lane =
        [-laneWidth, 0, laneWidth]
        [
            Math.floor(
                Math.random() * 3
            )
        ];


    const random =
        Math.random();


    if (random < 0.18) {

        createTrain(lane);

    } else if (random < 0.34) {

        createCar(lane);

    } else if (random < 0.45) {

        createPoliceCar(lane);

    } else if (random < 0.53) {

        createLowBarrier(lane);

    } else if (random < 0.61) {

        createHelicopter(lane);

    } else if (random < 0.67) {

        createAirplane(lane);

    } else {

        createCoinLine(lane);
    }


    const delay =
        Math.max(
            500,
            950 -
            speed * 300
        );


    spawnTimer =
        setTimeout(
            spawnProceduralItemsLoop,
            delay
        );
}


// ============================================================
// TRAIN
// ============================================================

function createTrain(lane) {

    const train =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.8,
                3.2,
                10
            ),

            new THREE.MeshStandardMaterial({
                color: 0x707070,
                metalness: 0.5
            })
        );


    train.position.set(
        lane,
        1.6,
        -170
    );


    train.castShadow = true;


    train.userData = {
        vehicle: true
    };


    scene.add(train);

    obstacles.push(train);
}


// ============================================================
// CAR
// ============================================================

function createCar(lane) {

    const car =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.8,
                0.7,
                3.5
            ),

            new THREE.MeshStandardMaterial({
                color: 0xd32f2f,
                metalness: 0.25
            })
        );


    body.position.y =
        0.55;


    car.add(body);


    const roof =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.35,
                0.55,
                1.5
            ),

            new THREE.MeshStandardMaterial({
                color: 0xeeeeee
            })
        );


    roof.position.y =
        1.1;


    car.add(roof);


    car.position.set(
        lane,
        0,
        -160
    );


    car.userData = {
        vehicle: true
    };


    scene.add(car);

    obstacles.push(car);
}


// ============================================================
// POLICE CAR
// ============================================================

function createPoliceCar(lane) {

    const car =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.9,
                0.75,
                3.7
            ),

            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );


    body.position.y =
        0.6;


    car.add(body);


    const lightBar =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.65,
                0.18,
                0.35
            ),

            new THREE.MeshStandardMaterial({
                color: 0x2255ff,
                emissive: 0x2255ff,
                emissiveIntensity: 1
            })
        );


    lightBar.position.y =
        1.1;


    car.add(lightBar);


    car.position.set(
        lane,
        0,
        -170
    );


    car.userData = {
        vehicle: true
    };


    scene.add(car);

    obstacles.push(car);
}


// ============================================================
// LOW BARRIER
// ============================================================

function createLowBarrier(lane) {

    const barrier =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.5,
                0.75,
                0.8
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffb300
            })
        );


    barrier.position.set(
        lane,
        0.38,
        -150
    );


    barrier.userData = {
        low: true
    };


    scene.add(barrier);

    obstacles.push(barrier);
}


// ============================================================
// HELICOPTER
// ============================================================

function createHelicopter(lane) {

    const helicopter =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.7,
                0.7,
                3
            ),

            new THREE.MeshStandardMaterial({
                color: 0x1769aa
            })
        );


    helicopter.add(body);


    const rotor =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3.5,
                0.08,
                0.18
            ),

            new THREE.MeshStandardMaterial({
                color: 0x222222
            })
        );


    rotor.position.y =
        0.55;


    helicopter.add(rotor);


    helicopter.position.set(
        lane,
        4,
        -190
    );


    helicopter.userData = {
        air: true,
        vehicle: true
    };


    scene.add(helicopter);

    obstacles.push(helicopter);
}


// ============================================================
// AIRPLANE
// ============================================================

function createAirplane(lane) {

    const plane =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.8,
                0.7,
                5
            ),

            new THREE.MeshStandardMaterial({
                color: 0xf4f4f4,
                metalness: 0.3
            })
        );


    plane.add(body);


    const wings =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                0.15,
                1.1
            ),

            new THREE.MeshStandardMaterial({
                color: 0xd8d8d8
            })
        );


    plane.add(wings);


    plane.position.set(
        lane,
        6,
        -220
    );


    plane.userData = {
        air: true,
        vehicle: true
    };


    scene.add(plane);

    obstacles.push(plane);
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
                    0.14,
                    24
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    metalness: 0.9,
                    roughness: 0.15
                })
            );


        coin.rotation.x =
            Math.PI / 2;


        coin.position.set(
            lane,
            1,
            -110 -
            i * 5
        );


        scene.add(coin);

        coins.push(coin);
    }
}


// ============================================================
// COIN EFFECT
// ============================================================

function createCoinEffect(position) {

    const ring =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.5,
                0.08,
                8,
                24
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.7
            })
        );


    ring.position.copy(
        position
    );


    ring.userData.life =
        20;


    scene.add(ring);

    effects.push(ring);
}


// ============================================================
// EFFECT UPDATE
// ============================================================

function updateEffects() {

    for (
        let i = effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.scale.multiplyScalar(
            1.05
        );


        effect.userData.life--;


        if (
            effect.userData.life <= 0
        ) {

            scene.remove(effect);

            effects.splice(
                i,
                1
            );
        }
    }
}


// ============================================================
// FOOTBALL ⚽
// ============================================================

function createFootball() {

    if (!gameActive || !player)
        return;


    const ball =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.32,
                20,
                20
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.45
            })
        );


    ball.position.set(
        player.position.x,
        0.5,
        player.position.z - 1
    );


    scene.add(ball);


    let distance = 0;


    const kick =
        setInterval(
            function() {

                ball.position.z -= 1.8;

                ball.rotation.x += 0.35;

                ball.rotation.z += 0.2;

                distance += 1.8;


                if (
                    distance > 100
                ) {

                    clearInterval(kick);

                    scene.remove(ball);
                }

            },
            30
        );
}


// ============================================================
// KEYBOARD CONTROLS
// ============================================================

function handleKeyboardControls(e) {

    const key =
        e.key.toLowerCase();


    // Start with Enter

    if (
        !gameActive &&
        (
            key === "enter" ||
            key === " "
        )
    ) {

        const menu =
            $("menu-screen");

        if (
            menu &&
            !menu.classList.contains(
                "hidden"
            )
        ) {

            startGame();

            return;
        }
    }


    if (!gameActive)
        return;


    // LEFT

    if (
        key === "arrowleft" ||
        key === "a"
    ) {

        e.preventDefault();

        if (
            currentLane > -1
        ) {

            currentLane--;
        }
    }


    // RIGHT

    if (
        key === "arrowright" ||
        key === "d"
    ) {

        e.preventDefault();

        if (
            currentLane < 1
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

        e.preventDefault();

        jump();
    }


    // SLIDE

    if (
        key === "arrowdown" ||
        key === "s"
    ) {

        e.preventDefault();

        slide();
    }


    // FOOTBALL

    if (key === "f") {

        createFootball();
    }
}


// ============================================================
// JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping ||
        isSliding
    )
        return;


    isJumping = true;

    yVelocity =
        jumpForce;
}


// ============================================================
// SLIDE
// ============================================================

function slide() {

    if (
        !gameActive ||
        isJumping
    )
        return;


    isSliding = true;


    setTimeout(
        function() {

            isSliding = false;

        },
        550
    );
}


// ============================================================
// TOUCH CONTROLS
// ============================================================

function setupTouchControls() {

    let startX = 0;
    let startY = 0;


    window.addEventListener(
        "touchstart",
        function(e) {

            if (
                e.touches &&
                e.touches.length > 0
            ) {

                startX =
                    e.touches[0].clientX;

                startY =
                    e.touches[0].clientY;
            }

        },
        {
            passive: true
        }
    );


    window.addEventListener(
        "touchend",
        function(e) {

            if (!gameActive)
                return;


            if (
                !e.changedTouches ||
                e.changedTouches.length === 0
            )
                return;


            const endX =
                e.changedTouches[0].clientX;

            const endY =
                e.changedTouches[0].clientY;


            const dx =
                endX - startX;

            const dy =
                endY - startY;


            const absX =
                Math.abs(dx);

            const absY =
                Math.abs(dy);


            // Horizontal swipe

            if (
                absX > absY &&
                absX > 45
            ) {

                if (dx > 0) {

                    if (
                        currentLane < 1
                    ) {

                        currentLane++;
                    }

                } else {

                    if (
                        currentLane > -1
                    ) {

                        currentLane--;
                    }
                }

                return;
            }


            // Vertical swipe

            if (
                absY > absX &&
                absY > 45
            ) {

                if (dy < 0) {

                    jump();

                } else {

                    slide();
                }
            }

        },
        {
            passive: true
        }
    );
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    const scoreElement =
        $("score-val");

    const coinElement =
        $("coin-val");


    if (scoreElement) {

        scoreElement.innerText =
            Math.floor(score);
    }


    if (coinElement) {

        coinElement.innerText =
            sessionCoins;
    }


    const bankedElement =
        $("banked-coins");


    if (bankedElement) {

        try {

            bankedElement.innerText =
                localStorage.getItem(
                    "subway_total_coins"
                ) || "0";

        } catch (error) {

            bankedElement.innerText =
                "0";
        }
    }
}


// ============================================================
// SCORE
// ============================================================

function updateScore() {

    if (!gameActive)
        return;


    score +=
        speed * 0.08;


    updateHUD();
}


// ============================================================
// CLEAR OBJECTS
// ============================================================

function clearGameObjects() {

    for (
        const object of obstacles
    ) {

        scene.remove(object);
    }


    for (
        const coin of coins
    ) {

        scene.remove(coin);
    }


    for (
        const effect of effects
    ) {

        scene.remove(effect);
    }


    obstacles = [];

    coins = [];

    effects = [];
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    if (!camera || !player)
        return;


    const targetX =
        player.position.x * 0.35;


    camera.position.x +=
        (
            targetX -
            camera.position.x
        ) * 0.04;


    camera.lookAt(
        player.position.x * 0.2,
        1.4,
        -25
    );
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
// ANIMATION LOOP
// ============================================================

function animate(time) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (time - lastTime) / 16.67 || 1,
            3
        );


    lastTime = time;


    if (gameActive) {

        updatePlayer(delta);

        updateObjects();

        updateEffects();

        updateScore();

        updateCamera();
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
// AUTOMATIC INITIALIZATION
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
