// ============================================================
// KOLLINS RUNNER - COMPLETE GAME ENGINE
// ============================================================
// Features:
// 🏃 Running character
// 🚓 Police chase
// 🚗 Car mode
// ⚽ Football kick
// 🛹 Double-tap skateboard (15 seconds)
// 🪙 Coins
// 🚧 Obstacles
// 👆 Mobile swipe controls
// 📱 Bottom mobile action buttons
// 🎮 Keyboard controls
// ▶️ Tap to Play
// ============================================================


// ============================================================
// 1. GLOBAL VARIABLES
// ============================================================

let scene;
let camera;
let renderer;

let player;
let police;

let runnerBody;
let runnerHead;
let leftLeg;
let rightLeg;
let leftArm;
let rightArm;

let car;
let football;
let skateboard;

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
let movingVehicles = [];
let effects = [];

let isJumping = false;
let isSliding = false;

let yVelocity = 0;
const gravity = 0.020;
const jumpForce = 0.42;

let isDriving = false;
let isSkateboardActive = false;

let skateboardTimer = null;
let lastTapTime = 0;

let spawnTimer = null;

let gameStartedOnce = false;

let touchStartX = 0;
let touchStartY = 0;

let lastFrameTime = performance.now();


// ============================================================
// 2. INITIALIZATION
// ============================================================

function init() {

    if (renderer) return;

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x76c7e8);

    scene.fog =
        new THREE.Fog(
            0x76c7e8,
            35,
            180
        );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

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
        5.2,
        8
    );

    camera.lookAt(
        0,
        1.3,
        -18
    );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

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


    document.body.appendChild(
        renderer.domElement
    );


    renderer.domElement.style.position =
        "fixed";

    renderer.domElement.style.top =
        "0";

    renderer.domElement.style.left =
        "0";

    renderer.domElement.style.zIndex =
        "0";


    // --------------------------------------------------------
    // LIGHTING
    // --------------------------------------------------------

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.65
        );

    scene.add(ambient);


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


    // --------------------------------------------------------
    // WORLD
    // --------------------------------------------------------

    createWorld();

    createRunner();

    createPolice();

    createActionButtons();


    // --------------------------------------------------------
    // CONTROLS
    // --------------------------------------------------------

    window.addEventListener(
        "keydown",
        handleKeyboard
    );

    window.addEventListener(
        "resize",
        onWindowResize
    );

    setupTouchControls();


    // --------------------------------------------------------
    // PLAY / RETRY BUTTONS
    // --------------------------------------------------------

    setupPlayButtons();


    animate();
}


// ============================================================
// 3. PLAY BUTTON SYSTEM
// ============================================================

function setupPlayButtons() {

    // --------------------------------------------------------
    // NORMAL PLAY BUTTON
    // --------------------------------------------------------

    const playButton =
        document.getElementById(
            "play-btn"
        );

    if (playButton) {

        playButton.onclick =
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                startGame();

            };


        playButton.ontouchend =
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                startGame();

            };

    }


    // --------------------------------------------------------
    // RETRY BUTTON
    // --------------------------------------------------------

    const retryButton =
        document.getElementById(
            "retry-btn"
        );

    if (retryButton) {

        retryButton.onclick =
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                resetGame();

            };


        retryButton.ontouchend =
            function(e) {

                e.preventDefault();
                e.stopPropagation();

                resetGame();

            };

    }


    // --------------------------------------------------------
    // TAP MENU TO PLAY
    // --------------------------------------------------------

    const menuScreen =
        document.getElementById(
            "menu-screen"
        );

    if (menuScreen) {

        let tapLocked = false;


        function playFromMenu(e) {

            if (
                e.target &&
                (
                    e.target.id ===
                    "play-btn" ||

                    e.target.closest(
                        "#play-btn"
                    )
                )
            ) {

                return;

            }


            if (
                gameActive ||
                tapLocked
            ) {

                return;

            }


            tapLocked = true;


            e.preventDefault();
            e.stopPropagation();


            startGame();


            setTimeout(
                function() {

                    tapLocked = false;

                },
                500
            );

        }


        menuScreen.addEventListener(
            "touchend",
            playFromMenu,
            {
                passive: false
            }
        );


        menuScreen.addEventListener(
            "click",
            playFromMenu
        );

    }

}


// ============================================================
// 4. WORLD
// ============================================================

function createWorld() {

    const ground =
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


    ground.rotation.x =
        -Math.PI / 2;

    ground.position.z =
        -1500;

    ground.receiveShadow = true;

    scene.add(ground);


    // --------------------------------------------------------
    // TRACK LANES
    // --------------------------------------------------------

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        const rail =
            new THREE.Mesh(

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


    // --------------------------------------------------------
    // SLEEPER BLOCKS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // BUILDINGS
    // --------------------------------------------------------

    for (
        let z = 0;
        z > -1500;
        z -= 45
    ) {

        createBuilding(
            -13,
            z
        );

        createBuilding(
            13,
            z
        );

    }


    // --------------------------------------------------------
    // LIGHTS
    // --------------------------------------------------------

    for (
        let z = -10;
        z > -1500;
        z -= 55
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

}


// ============================================================
// 5. BUILDINGS
// ============================================================

function createBuilding(x, z) {

    const height =
        7 +
        Math.random() * 10;


    const building =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4 +
                Math.random() * 3,
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

}


// ============================================================
// 6. STREET LIGHT
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
// 7. RUNNER
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
                color: 0xff5b22,
                roughness: 0.65
            })

        );


    body.position.y =
        1.35;

    body.castShadow = true;

    runnerBody = body;

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


    head.position.y =
        2.25;

    head.castShadow = true;

    runnerHead = head;

    player.add(head);


    const hair =
        new THREE.Mesh(

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


    hair.position.y =
        2.43;

    player.add(hair);


    leftLeg =
        createLimb(
            0.24,
            0.9,
            0x222222
        );

    rightLeg =
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


    leftArm =
        createLimb(
            0.20,
            0.75,
            0xff5b22
        );

    rightArm =
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


    player.position.set(
        0,
        0,
        0
    );


    scene.add(player);

}


// ============================================================
// 8. LIMB
// ============================================================

function createLimb(
    radius,
    height,
    color
) {

    const limb =
        new THREE.Mesh(

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


    limb.castShadow = true;

    return limb;

}


// ============================================================
// 9. POLICE
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


    body.position.y =
        1;

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


    head.position.y =
        2;

    police.add(head);


    police.position.set(
        0,
        0,
        7
    );


    scene.add(police);

}


// ============================================================
// 10. START GAME
// ============================================================

function startGame() {

    gameActive = true;

    gameOverState = false;

    score = 0;

    sessionCoins = 0;

    speed = 0.42;

    currentLane = 0;

    isJumping = false;

    isSliding = false;

    isDriving = false;


    // --------------------------------------------------------
    // RESET SKATEBOARD
    // --------------------------------------------------------

    isSkateboardActive = false;


    if (skateboardTimer) {

        clearTimeout(
            skateboardTimer
        );

        skateboardTimer = null;

    }


    if (skateboard) {

        skateboard.visible = false;

    }


    // --------------------------------------------------------
    // RESET CAR
    // --------------------------------------------------------

    if (car) {

        car.visible = false;

    }


    // --------------------------------------------------------
    // SHOW RUNNER
    // --------------------------------------------------------

    if (player) {

        player.visible = true;

        player.position.set(
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


    // --------------------------------------------------------
    // RESET POLICE
    // --------------------------------------------------------

    if (police) {

        police.position.set(
            0,
            0,
            7
        );

    }


    updateHUD();


    hideElement(
        "menu-screen"
    );


    hideElement(
        "gameover-screen"
    );


    clearObjects();


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;

    }


    spawnObjects();


    gameStartedOnce = true;

}


// ============================================================
// 11. RESET
// ============================================================

function resetGame() {

    clearObjects();

    startGame();

}


// ============================================================
// 12. GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive)
        return;


    // Skateboard protects player
    // from the collision.

    if (isSkateboardActive) {

        deactivateSkateboard();

        createImpactEffect();

        return;

    }


    gameActive = false;

    gameOverState = true;


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;

    }


    showElement(
        "gameover-screen"
    );


    const finalScore =
        document.querySelector(
            "#gameover-screen p"
        );


    if (finalScore) {

        finalScore.innerText =
            "Score: " +
            score +
            " • Coins: " +
            sessionCoins;

    }

}


// ============================================================
// 13. PLAYER UPDATE
// ============================================================

function updatePlayer(delta) {

    if (!player)
        return;


    // --------------------------------------------------------
    // JUMP
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // LANE
    // --------------------------------------------------------

    const targetX =
        currentLane *
        laneWidth;


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;


    // --------------------------------------------------------
    // RUNNING ANIMATION
    // --------------------------------------------------------

    if (
        gameActive &&
        !isDriving
    ) {

        const t =
            performance.now() *
            0.012;


        leftLeg.rotation.x =
            Math.sin(t) *
            0.65;


        rightLeg.rotation.x =
            Math.sin(
                t +
                Math.PI
            ) *
            0.65;


        leftArm.rotation.x =
            Math.sin(
                t +
                Math.PI
            ) *
            0.5;


        rightArm.rotation.x =
            Math.sin(t) *
            0.5;


        player.position.y =
            isJumping ?
            player.position.y :
            Math.abs(
                Math.sin(
                    t * 0.5
                )
            ) *
            0.035;

    }


    // --------------------------------------------------------
    // DRIVING
    // --------------------------------------------------------

    if (isDriving) {

        player.position.y = 0;

        player.rotation.x = 0;

        player.rotation.z = 0;

    }

}


// ============================================================
// 14. POLICE UPDATE
// ============================================================

function updatePolice() {

    if (
        !police ||
        !gameActive
    )
        return;


    const targetX =
        player.position.x;


    police.position.x +=
        (
            targetX -
            police.position.x
        ) * 0.035;


    if (
        police.position.z <
        5.5
    ) {

        police.position.z +=
            0.01;

    }


    if (
        police.position.z >
        8
    ) {

        police.position.z = 8;

    }


    const pulse =
        Math.sin(
            performance.now() *
            0.02
        );


    police.children.forEach(
        child => {

            if (
                child.material &&
                child.material.color
            ) {

                child.material.emissive =
                    pulse > 0 ?
                    new THREE.Color(
                        0x330000
                    ) :
                    new THREE.Color(
                        0x000033
                    );

            }

        }
    );

}


// ============================================================
// 15. OBJECT UPDATE
// ============================================================

function updateObjects() {

    if (!gameActive)
        return;


    // --------------------------------------------------------
    // OBSTACLES
    // --------------------------------------------------------

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
                obj,
                1.25
            )
        ) {

            gameOver();

            removeObstacle(i);

            continue;

        }


        if (
            obj.position.z > 12
        ) {

            removeObstacle(i);

        }

    }


    // --------------------------------------------------------
    // COINS
    // --------------------------------------------------------

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
            0.08;


        const collectionDistance =
            isDriving ?
            2.5 :
            1.25;


        if (
            player.position.distanceTo(
                coin.position
            ) <
            collectionDistance
        ) {

            collectCoin(i);

            continue;

        }


        if (
            coin.position.z > 12
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


    // --------------------------------------------------------
    // VEHICLES
    // --------------------------------------------------------

    for (
        let i =
            movingVehicles.length - 1;
        i >= 0;
        i--
    ) {

        const vehicle =
            movingVehicles[i];


        vehicle.position.z +=
            speed * 0.85;


        if (
            vehicle.position.z > 15
        ) {

            scene.remove(
                vehicle
            );

            movingVehicles.splice(
                i,
                1
            );

        }

    }


    // --------------------------------------------------------
    // DIFFICULTY
    // --------------------------------------------------------

    if (
        speed < maxSpeed
    ) {

        speed +=
            0.000035;

    }


    // --------------------------------------------------------
    // SCORE
    // --------------------------------------------------------

    score +=
        Math.max(
            1,
            Math.floor(
                speed * 0.08
            )
        );


    updateHUD();

}


// ============================================================
// 16. COLLISION
// ============================================================

function checkCollision(
    a,
    b,
    distance
) {

    if (!a || !b)
        return false;


    const xDistance =
        Math.abs(
            a.position.x -
            b.position.x
        );


    const zDistance =
        Math.abs(
            a.position.z -
            b.position.z
        );


    const yDistance =
        Math.abs(
            a.position.y -
            b.position.y
        );


    return (
        xDistance < distance &&
        zDistance < 2.0 &&
        yDistance < 2.2
    );

}


// ============================================================
// 17. REMOVE OBSTACLE
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
// 18. COLLECT COIN
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


    createCoinEffect();

    updateHUD();

}


// ============================================================
// 19. SPAWN SYSTEM
// ============================================================

function spawnObjects() {

    if (!gameActive)
        return;


    const lane =
        [
            -laneWidth,
            0,
            laneWidth
        ][
            Math.floor(
                Math.random() * 3
            )
        ];


    const random =
        Math.random();


    if (random < 0.18) {

        createTrain(lane);

    }

    else if (random < 0.36) {

        createBarrier(lane);

    }

    else if (random < 0.52) {

        createTrafficCar(lane);

    }

    else {

        createCoinLine(lane);

    }


    const delay =
        Math.max(
            500,
            1050 -
            speed * 500
        );


    spawnTimer =
        setTimeout(
            spawnObjects,
            delay
        );

}


// ============================================================
// 20. TRAIN
// ============================================================

function createTrain(lane) {

    const train =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.7,
                3.5,
                13
            ),

            new THREE.MeshStandardMaterial({
                color: 0x59636e,
                metalness: 0.55,
                roughness: 0.35
            })

        );


    train.position.set(
        lane,
        1.75,
        -150
    );


    train.castShadow = true;

    scene.add(train);

    obstacles.push(train);

}


// ============================================================
// 21. BARRIER
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


    barrier.castShadow = true;

    scene.add(barrier);

    obstacles.push(barrier);

}


// ============================================================
// 22. TRAFFIC CAR
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
                    Math.random() > 0.5 ?
                    0xc62828 :
                    0x1565c0
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


    group.position.set(
        lane,
        0,
        -140
    );


    scene.add(group);

    obstacles.push(group);

}


// ============================================================
// 23. COINS
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
            -105 -
            i * 5
        );


        scene.add(coin);

        coins.push(coin);

    }

}


// ============================================================
// 24. FOOTBALL ⚽
/* ============================================================ */

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
                24,
                24
            ),

            new THREE.MeshStandardMaterial({
                color: 0xf4f4f4,
                roughness: 0.45
            })

        );


    football.position.set(
        player.position.x,
        0.45,
        player.position.z - 1.2
    );


    scene.add(
        football
    );


    let distance = 0;


    const kickInterval =
        setInterval(
            function() {

                if (!football) {

                    clearInterval(
                        kickInterval
                    );

                    return;

                }


                football.position.z -=
                    1.5;


                football.rotation.x +=
                    0.35;


                football.rotation.z +=
                    0.22;


                distance += 1.5;


                for (
                    let i =
                        obstacles.length - 1;
                    i >= 0;
                    i--
                ) {

                    const obj =
                        obstacles[i];


                    if (
                        football.position.distanceTo(
                            obj.position
                        ) < 1.8
                    ) {

                        scene.remove(
                            obj
                        );


                        obstacles.splice(
                            i,
                            1
                        );


                        score += 50;

                        createImpactEffect();

                    }

                }


                if (
                    distance > 100
                ) {

                    clearInterval(
                        kickInterval
                    );


                    if (football) {

                        scene.remove(
                            football
                        );

                        football = null;

                    }

                }

            },
            30
        );

}


// ============================================================
// 25. CAR MODE 🚗
// ============================================================

function enterCar() {

    if (!gameActive)
        return;


    if (isDriving) {

        exitCar();

        return;

    }


    isDriving = true;


    if (!car) {

        createPlayerCar();

    }


    car.visible = true;


    // Keep car in player's lane.

    car.position.x =
        player.position.x;


    player.visible = false;


    score += 100;

    updateHUD();

}


// ============================================================
// 26. PLAYER CAR
// ============================================================

function createPlayerCar() {

    car =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.1,
                0.7,
                4
            ),

            new THREE.MeshStandardMaterial({
                color: 0xd71920,
                metalness: 0.35,
                roughness: 0.35
            })

        );


    body.position.y =
        0.65;


    car.add(body);


    const roof =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.4,
                0.65,
                1.9
            ),

            new THREE.MeshStandardMaterial({
                color: 0x171717,
                roughness: 0.2
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


    car.visible = false;

    scene.add(car);

}


// ============================================================
// 27. UPDATE CAR
// ============================================================

function updateCar() {

    if (
        !car ||
        !isDriving ||
        !gameActive
    )
        return;


    const targetX =
        currentLane *
        laneWidth;


    car.position.x +=
        (
            targetX -
            car.position.x
        ) * 0.18;


    car.position.y = 0;

}


// ============================================================
// 28. EXIT CAR
// ============================================================

function exitCar() {

    isDriving = false;


    if (car) {

        car.visible = false;

    }


    if (player) {

        player.visible = true;

        player.position.x =
            currentLane *
            laneWidth;

    }

}


// ============================================================
// 29. SKATEBOARD 🛹
// ============================================================

function activateSkateboard() {

    if (!gameActive)
        return;


    if (isSkateboardActive)
        return;


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


    // 15 SECOND TIMER

    skateboardTimer =
        setTimeout(
            function() {

                deactivateSkateboard();

            },
            15000
        );

}


// ============================================================
// 30. CREATE SKATEBOARD
// ============================================================

function createSkateboard() {

    skateboard =
        new THREE.Group();


    const board =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.3,
                0.12,
                2.8
            ),

            new THREE.MeshStandardMaterial({
                color: 0xe91e63,
                metalness: 0.5
            })

        );


    board.position.y =
        0.12;


    skateboard.add(board);


    for (
        let x of [-0.48, 0.48]
    ) {

        for (
            let z of [-0.9, 0.9]
        ) {

            const wheel =
                new THREE.Mesh(

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

    scene.add(
        skateboard
    );

}


// ============================================================
// 31. UPDATE SKATEBOARD
// ============================================================

function updateSkateboard() {

    if (
        !skateboard ||
        !isSkateboardActive
    )
        return;


    skateboard.position.copy(
        isDriving ?
        car.position :
        player.position
    );


    skateboard.position.y =
        0;


    skateboard.rotation.y =
        player.rotation.y;

}


// ============================================================
// 32. DEACTIVATE SKATEBOARD
// ============================================================

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
// 33. MOBILE ACTION BUTTONS
// ============================================================

function createActionButtons() {

    if (
        document.getElementById(
            "mobile-actions"
        )
    ) {

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "mobile-actions";


    // --------------------------------------------------------
    // FIXED TO BOTTOM OF PHONE
    // --------------------------------------------------------

    container.style.position =
        "fixed";

    container.style.left =
        "0";

    container.style.right =
        "0";

    container.style.bottom =
        "calc(14px + env(safe-area-inset-bottom))";


    container.style.width =
        "100%";


    container.style.display =
        "flex";


    container.style.justifyContent =
        "center";


    container.style.alignItems =
        "center";


    container.style.gap =
        "8px";


    container.style.padding =
        "0 10px";


    container.style.boxSizing =
        "border-box";


    container.style.zIndex =
        "99999";


    container.style.pointerEvents =
        "auto";


    const buttons = [

        {
            id: "football-btn",
            text: "⚽ KICK",
            action: kickFootball
        },

        {
            id: "car-btn",
            text: "🚗 CAR",
            action: enterCar
        },

        {
            id: "board-btn",
            text: "🛹 BOARD",
            action: activateSkateboard
        }

    ];


    buttons.forEach(
        function(item) {

            const button =
                document.createElement(
                    "button"
                );


            button.id =
                item.id;


            button.type =
                "button";


            button.innerText =
                item.text;


            // ------------------------------------------------
            // BUTTON DESIGN
            // ------------------------------------------------

            button.style.minWidth =
                "88px";


            button.style.height =
                "52px";


            button.style.padding =
                "0 12px";


            button.style.border =
                "2px solid rgba(255,255,255,0.18)";


            button.style.borderRadius =
                "16px";


            button.style.background =
                "rgba(10,10,10,0.90)";


            button.style.color =
                "white";


            button.style.fontSize =
                "14px";


            button.style.fontWeight =
                "800";


            button.style.boxShadow =
                "0 5px 20px rgba(0,0,0,0.45)";


            button.style.touchAction =
                "manipulation";


            button.style.userSelect =
                "none";


            button.style.webkitUserSelect =
                "none";


            button.style.cursor =
                "pointer";


            // ------------------------------------------------
            // TOUCH
            // ------------------------------------------------

            button.addEventListener(
                "touchstart",
                function(e) {

                    e.preventDefault();
                    e.stopPropagation();

                },
                {
                    passive: false
                }
            );


            button.addEventListener(
                "touchend",
                function(e) {

                    e.preventDefault();
                    e.stopPropagation();

                    item.action();

                },
                {
                    passive: false
                }
            );


            // ------------------------------------------------
            // CLICK
            // ------------------------------------------------

            button.addEventListener(
                "click",
                function(e) {

                    e.preventDefault();
                    e.stopPropagation();

                    item.action();

                }
            );


            container.appendChild(
                button
            );

        }
    );


    document.body.appendChild(
        container
    );

}


// ============================================================
// 34. KEYBOARD CONTROLS
// ============================================================

function handleKeyboard(e) {

    if (!gameActive)
        return;


    const key =
        e.key.toLowerCase();


    if (
        key === "arrowleft" ||
        key === "a"
    ) {

        if (
            currentLane > -1
        ) {

            currentLane--;

        }

    }


    if (
        key === "arrowright" ||
        key === "d"
    ) {

        if (
            currentLane < 1
        ) {

            currentLane++;

        }

    }


    if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
    ) {

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


    if (key === "c") {

        enterCar();

    }


    if (key === "b") {

        activateSkateboard();

    }

}


// ============================================================
// 35. JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping ||
        isDriving
    )
        return;


    isJumping = true;

    yVelocity =
        jumpForce;

}


// ============================================================
// 36. SLIDE
// ============================================================

function slide() {

    if (
        !gameActive ||
        isDriving
    )
        return;


    if (isSliding)
        return;


    isSliding = true;


    player.scale.y =
        0.55;


    setTimeout(
        function() {

            isSliding = false;

            player.scale.y =
                1;

        },
        600
    );

}


// ============================================================
// 37. TOUCH CONTROLS
// ============================================================

function setupTouchControls() {

    window.addEventListener(
        "touchstart",
        function(e) {

            if (
                e.touches &&
                e.touches.length > 0
            ) {

                touchStartX =
                    e.touches[0].clientX;

                touchStartY =
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

            if (
                !gameActive ||
                !e.changedTouches ||
                !e.changedTouches.length
            )
                return;


            // Don't process swipes if the
            // user touched the action buttons.

            if (
                e.target &&
                e.target.closest(
                    "#mobile-actions"
                )
            ) {

                return;

            }


            const endX =
                e.changedTouches[0].clientX;


            const endY =
                e.changedTouches[0].clientY;


            const deltaX =
                endX -
                touchStartX;


            const deltaY =
                endY -
                touchStartY;


            if (
                Math.abs(deltaX) < 35 &&
                Math.abs(deltaY) < 35
            ) {

                return;

            }


            if (
                Math.abs(deltaX) >
                Math.abs(deltaY)
            ) {

                if (
                    deltaX > 35 &&
                    currentLane < 1
                ) {

                    currentLane++;

                }


                if (
                    deltaX < -35 &&
                    currentLane > -1
                ) {

                    currentLane--;

                }

            }

            else {

                if (
                    deltaY < -35
                ) {

                    jump();

                }


                if (
                    deltaY > 35
                ) {

                    slide();

                }

            }

        },
        {
            passive: true
        }
    );


    // --------------------------------------------------------
    // DOUBLE TAP = SKATEBOARD
    // --------------------------------------------------------

    window.addEventListener(
        "touchend",
        function(e) {

            if (
                !gameActive ||
                (
                    e.target &&
                    e.target.closest(
                        "#mobile-actions"
                    )
                )
            ) {

                return;

            }


            const now =
                Date.now();


            if (
                now -
                lastTapTime <
                350
            ) {

                activateSkateboard();

                lastTapTime = 0;

                return;

            }


            lastTapTime =
                now;

        }
    );

}


// ============================================================
// 38. DOUBLE CLICK = SKATEBOARD
// ============================================================

window.addEventListener(
    "dblclick",
    function() {

        if (gameActive) {

            activateSkateboard();

        }

    }
);


// ============================================================
// 39. HUD
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


    const banked =
        document.getElementById(
            "banked-coins"
        );


    if (banked) {

        try {

            banked.innerText =
                localStorage.getItem(
                    "kollins_coins"
                ) || 0;

        }
        catch(error) {

            banked.innerText =
                "0";

        }

    }

}


// ============================================================
// 40. COIN EFFECT
// ============================================================

function createCoinEffect() {

    const ring =
        new THREE.Mesh(

            new THREE.RingGeometry(
                0.3,
                0.55,
                16
            ),

            new THREE.MeshBasicMaterial({
                color: 0xffd700,
                transparent: true,
                opacity: 0.9,
                side:
                    THREE.DoubleSide
            })

        );


    ring.position.copy(
        isDriving ?
        car.position :
        player.position
    );


    ring.position.y +=
        1;


    scene.add(ring);


    effects.push({
        mesh: ring,
        life: 1
    });

}


// ============================================================
// 41. IMPACT EFFECT
// ============================================================

function createImpactEffect() {

    const ring =
        new THREE.Mesh(

            new THREE.RingGeometry(
                0.4,
                0.7,
                20
            ),

            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1,
                side:
                    THREE.DoubleSide
            })

        );


    ring.position.copy(
        isDriving ?
        car.position :
        player.position
    );


    ring.position.y +=
        1;


    scene.add(ring);


    effects.push({
        mesh: ring,
        life: 1
    });

}


// ============================================================
// 42. EFFECT UPDATE
// ============================================================

function updateEffects() {

    for (
        let i =
            effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.life -=
            0.04;


        effect.mesh.scale.multiplyScalar(
            1.08
        );


        effect.mesh.material.opacity =
            effect.life;


        if (
            effect.life <= 0
        ) {

            scene.remove(
                effect.mesh
            );


            effects.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// 43. CLEAR OBJECTS
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


    movingVehicles.forEach(
        vehicle =>
            scene.remove(vehicle)
    );


    obstacles = [];

    coins = [];

    movingVehicles = [];


    if (football) {

        scene.remove(
            football
        );

        football = null;

    }

}


// ============================================================
// 44. HIDE ELEMENT
// ============================================================

function hideElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.classList.add(
            "hidden"
        );


        element.style.pointerEvents =
            "none";

    }

}


// ============================================================
// 45. SHOW ELEMENT
// ============================================================

function showElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.classList.remove(
            "hidden"
        );


        element.style.pointerEvents =
            "auto";

    }

}


// ============================================================
// 46. RESIZE
// ============================================================

function onWindowResize() {

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
// 47. ANIMATION LOOP
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    const delta =
        Math.min(
            0.05,
            (
                now -
                lastFrameTime
            ) / 1000
        );


    lastFrameTime =
        now;


    if (gameActive) {

        updatePlayer(delta);

        updateObjects();

        updatePolice();

        updateCar();

        updateSkateboard();

        updateEffects();

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
// 48. START AFTER HTML LOAD
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function() {

        init();

    }
);
