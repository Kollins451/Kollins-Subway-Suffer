// ============================================================
// KOLLINS RUNNER — COMPLETE GAME
// ============================================================
// 🏃 Runner
// 🚓 Police chase
// 🏙️ Buildings / city
// 🚧 Obstacles + trains
// 🪙 Yellow ring coins + sound
// 🚗 Orange/red player car + engine sound
// ⚽ Kickable football + kick sound
// ▶️ TAP TO PLAY
// 🔄 RUN AGAIN
// 📱 Mobile controls
// ⌨️ Keyboard controls
// ============================================================


// ============================================================
// 1. GLOBAL VARIABLES
// ============================================================

let scene;
let camera;
let renderer;

let player;
let police;
let car = null;
let football = null;

let runnerBody;
let runnerHead;
let leftLeg;
let rightLeg;
let leftArm;
let rightArm;

let obstacles = [];
let coins = [];

let gameActive = false;
let gameOverState = false;
let isDriving = false;
let isJumping = false;
let isSliding = false;

let currentLane = 0;

const laneWidth = 3.3;

let score = 0;
let sessionCoins = 0;

let speed = 0.42;
const maxSpeed = 0.95;

let yVelocity = 0;

const gravity = 0.020;
const jumpForce = 0.42;

let spawnTimer = null;
let lastFrameTime = performance.now();

let touchStartX = 0;
let touchStartY = 0;

let audioContext = null;
let engineOscillator = null;
let engineGain = null;


// ============================================================
// 2. INITIALIZATION
// ============================================================

function init() {

    if (renderer) return;

    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x76c7e8);

    scene.fog = new THREE.Fog(
        0x76c7e8,
        35,
        180
    );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

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
        -18
    );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

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
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "0";

    document.body.appendChild(
        renderer.domElement
    );


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

    setupTouchControls();


    // --------------------------------------------------------
    // PLAY BUTTON
    // --------------------------------------------------------

    const playButton =
        document.getElementById("play-btn");

    if (playButton) {

        playButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                startGame();

            }
        );

    }


    // --------------------------------------------------------
    // RETRY BUTTON
    // --------------------------------------------------------

    const retryButton =
        document.getElementById("retry-btn");

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                resetGame();

            }
        );

    }


    // --------------------------------------------------------
    // KEYBOARD
    // --------------------------------------------------------

    window.addEventListener(
        "keydown",
        handleKeyboard
    );


    window.addEventListener(
        "resize",
        onWindowResize
    );


    // --------------------------------------------------------
    // START LOOP
    // --------------------------------------------------------

    gameActive = false;

    gameOverState = false;

    animate();
}


// ============================================================
// 3. WORLD
// ============================================================

function createWorld() {

    // GROUND

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


    // LANE RAILS

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


    // CROSS SLEEPERS

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
// 4. BUILDINGS
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
// 5. STREET LIGHT
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
// 6. RUNNER
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
                color: 0xff5b22
            })

        );

    body.position.y = 1.35;

    body.castShadow = true;

    runnerBody = body;

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

    runnerHead = head;

    player.add(head);


    // HAIR

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

    hair.position.y = 2.43;

    player.add(hair);


    // LEGS

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


    // ARMS

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
// 7. LIMB
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
// 8. POLICE
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
// 9. AUDIO SYSTEM
// ============================================================

function initAudio() {

    if (audioContext) {

        if (
            audioContext.state === "suspended"
        ) {

            audioContext.resume();

        }

        return;
    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) return;

    audioContext =
        new AudioContext();
}


// ============================================================
// COIN SOUND
// ============================================================

function playCoinSound() {

    if (!audioContext) return;

    const now =
        audioContext.currentTime;

    const osc =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    osc.type = "sine";

    osc.frequency.setValueAtTime(
        700,
        now
    );

    osc.frequency.exponentialRampToValueAtTime(
        1200,
        now + 0.12
    );

    gain.gain.setValueAtTime(
        0.001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.25,
        now + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.16
    );

    osc.connect(gain);

    gain.connect(
        audioContext.destination
    );

    osc.start(now);

    osc.stop(
        now + 0.17
    );
}


// ============================================================
// FOOTBALL SOUND
// ============================================================

function playKickSound() {

    if (!audioContext) return;

    const now =
        audioContext.currentTime;

    const osc =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    osc.type = "triangle";

    osc.frequency.setValueAtTime(
        180,
        now
    );

    osc.frequency.exponentialRampToValueAtTime(
        70,
        now + 0.15
    );

    gain.gain.setValueAtTime(
        0.3,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.15
    );

    osc.connect(gain);

    gain.connect(
        audioContext.destination
    );

    osc.start(now);

    osc.stop(
        now + 0.16
    );
}


// ============================================================
// CAR ENGINE SOUND
// ============================================================

function startEngineSound() {

    if (!audioContext) return;

    stopEngineSound();

    engineOscillator =
        audioContext.createOscillator();

    engineGain =
        audioContext.createGain();

    engineOscillator.type =
        "sawtooth";

    engineOscillator.frequency.value =
        75;

    engineGain.gain.value =
        0.035;

    engineOscillator.connect(
        engineGain
    );

    engineGain.connect(
        audioContext.destination
    );

    engineOscillator.start();
}


function updateEngineSound() {

    if (
        !engineOscillator ||
        !audioContext
    ) return;

    engineOscillator.frequency.value =
        65 + speed * 80;
}


function stopEngineSound() {

    if (engineOscillator) {

        try {
            engineOscillator.stop();
        } catch (e) {}

        engineOscillator.disconnect();

        engineOscillator = null;
    }

    if (engineGain) {

        engineGain.disconnect();

        engineGain = null;
    }
}


// ============================================================
// 10. START GAME
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

    isSliding = false;

    isDriving = false;

    yVelocity = 0;


    player.position.set(
        0,
        0,
        0
    );

    player.visible = true;


    if (car) {

        car.visible = false;

    }


    if (football) {

        scene.remove(
            football
        );

        football = null;

    }


    if (police) {

        police.position.set(
            0,
            0,
            7
        );

    }


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


    const gameOverScreen =
        document.getElementById(
            "gameover-screen"
        );

    if (gameOverScreen) {

        gameOverScreen.classList.add(
            "hidden"
        );

    }


    createActionButtons();

    spawnObjects();
}


// ============================================================
// 11. RESET GAME
// ============================================================

function resetGame() {

    stopEngineSound();

    clearObjects();

    if (football) {

        scene.remove(
            football
        );

        football = null;

    }

    if (car) {

        car.visible = false;

    }

    if (player) {

        player.visible = true;

        player.position.set(
            0,
            0,
            0
        );

    }

    gameActive = false;

    gameOverState = false;

    startGame();
}


// ============================================================
// 12. GAME OVER
// ============================================================

function gameOver() {

    if (!gameActive)
        return;


    gameActive = false;

    gameOverState = true;

    stopEngineSound();


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;

    }


    if (car) {

        car.visible = false;

    }


    player.visible = true;

    isDriving = false;


    const screen =
        document.getElementById(
            "gameover-screen"
        );

    if (screen) {

        screen.classList.remove(
            "hidden"
        );

    }


    const finalScore =
        screen ?
        screen.querySelector("p") :
        null;

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

            player.position.y = 0;

            isJumping = false;

            yVelocity = 0;

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


    // RUNNING ANIMATION

    if (
        gameActive &&
        !isDriving
    ) {

        const t =
            performance.now() *
            0.012;

        leftLeg.rotation.x =
            Math.sin(t) * 0.65;

        rightLeg.rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.65;

        leftArm.rotation.x =
            Math.sin(
                t + Math.PI
            ) * 0.5;

        rightArm.rotation.x =
            Math.sin(t) * 0.5;

        if (!isJumping) {

            player.position.y =
                Math.abs(
                    Math.sin(
                        t * 0.5
                    )
                ) * 0.035;

        }

    }


    // SLIDE

    if (isSliding) {

        player.scale.y = 0.55;

    } else {

        player.scale.y = 1;

    }


    // DRIVING

    if (isDriving) {

        player.position.y = 0;

        player.visible = false;

        if (car) {

            car.position.x =
                player.position.x;

        }

    }
}


// ============================================================
// 14. POLICE UPDATE
// ============================================================

function updatePolice() {

    if (
        !police ||
        !gameActive
    ) return;


    police.position.x +=
        (
            player.position.x -
            police.position.x
        ) * 0.035;


    const pulse =
        Math.sin(
            performance.now() * 0.02
        );

    police.children.forEach(
        child => {

            if (
                child.material &&
                child.material.color
            ) {

                child.material.emissive =
                    pulse > 0
                    ?
                    new THREE.Color(0x330000)
                    :
                    new THREE.Color(0x000033);

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
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obj =
            obstacles[i];

        obj.position.z += speed;


        if (
            checkCollision(
                isDriving && car ?
                car :
                player,
                obj,
                isDriving ? 1.8 : 1.25
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

        coin.rotation.y += 0.08;


        const target =
            isDriving && car ?
            car :
            player;


        if (
            target.position.distanceTo(
                coin.position
            ) < 1.6
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


    // --------------------------------------------------------
    // SPEED
    // --------------------------------------------------------

    if (speed < maxSpeed) {

        speed += 0.000035;

    }


    // --------------------------------------------------------
    // SCORE
    // --------------------------------------------------------

    score += Math.max(
        1,
        Math.floor(speed * 0.08)
    );


    updateEngineSound();

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


    playCoinSound();

    updateHUD();
}


// ============================================================
// 19. SPAWN SYSTEM
// ============================================================

function spawnObjects() {

    if (!gameActive)
        return;


    const lane =
        [-laneWidth, 0, laneWidth]
        [
            Math.floor(
                Math.random() * 3
            )
        ];


    const random =
        Math.random();


    if (random < 0.20) {

        createTrain(lane);

    }

    else if (random < 0.40) {

        createBarrier(lane);

    }

    else if (random < 0.58) {

        createTrafficCar(lane);

    }

    else {

        createCoinLine(lane);

    }


    const delay =
        Math.max(
            550,
            1050 - speed * 500
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
                    Math.random() > 0.5
                    ?
                    0xc62828
                    :
                    0x1565c0
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
// 23. YELLOW RING COINS
// ============================================================

function createCoinLine(lane) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const coin =
            new THREE.Mesh(

                new THREE.TorusGeometry(
                    0.43,
                    0.13,
                    12,
                    24
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    emissive: 0x8a6500,
                    emissiveIntensity: 0.25,
                    metalness: 0.9,
                    roughness: 0.15
                })

            );


        coin.rotation.x =
            Math.PI / 2;


        coin.position.set(
            lane,
            1.25,
            -105 - i * 5
        );


        coin.castShadow = true;

        scene.add(coin);

        coins.push(coin);

    }
}


// ============================================================
// 24. FOOTBALL
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
                24,
                24
            ),

            new THREE.MeshStandardMaterial({
                color: 0xf4f4f4,
                roughness: 0.45
            })

        );


    football.position.set(
        isDriving && car ?
        car.position.x :
        player.position.x,
        0.45,
        -1.2
    );


    scene.add(
        football
    );


    playKickSound();


    let distance = 0;


    const kickInterval =
        setInterval(
            function() {

                if (
                    !football ||
                    !gameActive
                ) {

                    clearInterval(
                        kickInterval
                    );

                    return;

                }


                football.position.z -= 1.5;

                football.rotation.x += 0.35;

                football.rotation.z += 0.22;

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
                        ) < 2
                    ) {

                        scene.remove(
                            obj
                        );

                        obstacles.splice(
                            i,
                            1
                        );

                        score += 50;

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
// 25. CAR MODE
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

    car.position.x =
        player.position.x;


    player.visible = false;


    score += 100;

    startEngineSound();

    updateHUD();
}


// ============================================================
// 26. PLAYER CAR
// ============================================================

function createPlayerCar() {

    car =
        new THREE.Group();


    // BODY

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.1,
                0.7,
                4
            ),

            new THREE.MeshStandardMaterial({
                color: 0xe53935,
                metalness: 0.35,
                roughness: 0.35
            })

        );

    body.position.y = 0.65;

    body.castShadow = true;

    car.add(body);


    // ROOF

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

    roof.position.y = 1.25;

    car.add(roof);


    // WINDOWS

    const windowMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x202c3a,
            metalness: 0.2,
            roughness: 0.15
        });


    const frontWindow =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.25,
                0.4,
                0.08
            ),
            windowMaterial
        );

    frontWindow.position.set(
        0,
        1.25,
        -0.96
    );

    car.add(frontWindow);


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
// 27. EXIT CAR
// ============================================================

function exitCar() {

    isDriving = false;

    stopEngineSound();


    if (car) {

        car.visible = false;

    }


    if (player) {

        player.visible = true;

    }
}


// ============================================================
// 28. MOBILE ACTION BUTTONS
// ============================================================

function createActionButtons() {

    if (
        document.getElementById(
            "mobile-actions"
        )
    ) return;


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "mobile-actions";


    container.style.position =
        "fixed";

    container.style.bottom =
        "15px";

    container.style.left =
        "50%";

    container.style.transform =
        "translateX(-50%)";

    container.style.display =
        "flex";

    container.style.gap =
        "8px";

    container.style.zIndex =
        "9999";

    container.style.width =
        "96%";

    container.style.justifyContent =
        "center";


    const buttons = [

        {
            id: "football-btn",
            text: "⚽ BALL",
            action: kickFootball
        },

        {
            id: "car-btn",
            text: "🚗 CAR",
            action: enterCar
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

            button.innerText =
                item.text;


            button.style.padding =
                "14px 18px";

            button.style.minWidth =
                "100px";

            button.style.border =
                "none";

            button.style.borderRadius =
                "16px";

            button.style.background =
                "rgba(10,10,10,0.88)";

            button.style.color =
                "white";

            button.style.fontSize =
                "15px";

            button.style.fontWeight =
                "bold";

            button.style.boxShadow =
                "0 4px 15px rgba(0,0,0,0.4)";

            button.style.touchAction =
                "manipulation";


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
// 29. KEYBOARD CONTROLS
// ============================================================

function handleKeyboard(e) {

    const key =
        e.key.toLowerCase();


    if (
        !gameActive
    ) {

        return;

    }


    // LEFT

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


    // RIGHT

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


    // JUMP

    if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
    ) {

        jump();

    }


    // SLIDE

    if (
        key === "arrowdown" ||
        key === "s"
    ) {

        slide();

    }


    // FOOTBALL

    if (
        key === "f"
    ) {

        kickFootball();

    }


    // CAR

    if (
        key === "c"
    ) {

        enterCar();

    }
}


// ============================================================
// 30. JUMP
// ============================================================

function jump() {

    if (
        !gameActive ||
        isJumping
    ) return;


    isJumping = true;

    yVelocity =
        jumpForce;
}


// ============================================================
// 31. SLIDE
// ============================================================

function slide() {

    if (!gameActive)
        return;


    isSliding = true;


    setTimeout(
        function() {

            isSliding = false;

        },
        500
    );
}


// ============================================================
// 32. TOUCH CONTROLS
// ============================================================

function setupTouchControls() {

    window.addEventListener(
        "touchstart",
        function(e) {

            if (
                e.target.closest(
                    "button"
                )
            ) return;


            const touch =
                e.changedTouches[0];

            touchStartX =
                touch.clientX;

            touchStartY =
                touch.clientY;

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
                e.target.closest(
                    "button"
                )
            ) return;


            const touch =
                e.changedTouches[0];


            const dx =
                touch.clientX -
                touchStartX;

            const dy =
                touch.clientY -
                touchStartY;


            const absX =
                Math.abs(dx);

            const absY =
                Math.abs(dy);


            if (
                absX < 30 &&
                absY < 30
            ) {

                jump();

                return;

            }


            if (absX > absY) {

                if (dx > 0) {

                    currentLane =
                        Math.min(
                            1,
                            currentLane + 1
                        );

                } else {

                    currentLane =
                        Math.max(
                            -1,
                            currentLane - 1
                        );

                }

            } else {

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
// 33. HUD
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
// 34. CLEAR OBJECTS
// ============================================================

function clearObjects() {

    obstacles.forEach(
        obj => scene.remove(obj)
    );

    obstacles = [];


    coins.forEach(
        coin => scene.remove(coin)
    );

    coins = [];


    if (spawnTimer) {

        clearTimeout(
            spawnTimer
        );

        spawnTimer = null;

    }
}


// ============================================================
// 35. RESIZE
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
// 36. ANIMATION
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
            (now - lastFrameTime) /
            1000
        );


    lastFrameTime =
        now;


    if (gameActive) {

        updatePlayer(delta);

        updatePolice();

        updateObjects();

        updateCar();

    }


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// 37. CAR UPDATE
// ============================================================

function updateCar() {

    if (
        !car ||
        !isDriving
    ) return;


    car.position.x +=
        (
            currentLane * laneWidth -
            car.position.x
        ) * 0.18;


    car.position.y = 0;


    car.rotation.z =
        (
            currentLane * 0.08
        );

}


// ============================================================
// 38. START
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}
`
