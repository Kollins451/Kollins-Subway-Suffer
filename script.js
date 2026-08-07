// ============================================
// KOLLINS SUBWAY SUFFER - GAME ENGINE
// PART 1/3
// ============================================

let scene, camera, renderer;
let player, chaser;

let currentLane = 0;
const laneWidth = 3.3;

let obstacles = [];
let coins = [];
let sceneryItems = [];

let score = 0;
let sessionCoins = 0;

let gameActive = false;

let speed = 0.28;
const maxSpeed = 0.85;

let isJumping = false;
let isSliding = false;

let yVelocity = 0;
const gravity = 0.016;
const jumpForce = 0.38;

let isHoverboardActive = false;
let isMagnetActive = false;
let isJetpackActive = false;

let chaserDistance = 6;

let spawnTimeoutRef = null;


// ============================================
// INITIALIZE GAME
// ============================================

function init(){

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0xa3e2f7);

    scene.fog = new THREE.FogExp2(
        0xa3e2f7,
        0.009
    );


    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );


    camera.position.set(
        0,
        5.5,
        7.5
    );


    camera.lookAt(
        0,
        2,
        -4
    );



    renderer = new THREE.WebGLRenderer({
        antialias:true
    });


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    document.body.appendChild(
        renderer.domElement
    );



    let light = new THREE.AmbientLight(
        0xffffff,
        0.8
    );

    scene.add(light);



    let sun = new THREE.DirectionalLight(
        0xffffff,
        0.8
    );


    sun.position.set(
        10,
        20,
        10
    );


    scene.add(sun);



    createWorld();

    createPlayer();

    createChaser();



    window.addEventListener(
        "keydown",
        handleKeyboardControls
    );


    window.addEventListener(
        "resize",
        onWindowResize
    );



    document
    .getElementById("play-btn")
    .addEventListener(
        "click",
        startGame
    );


    document
    .getElementById("retry-btn")
    .addEventListener(
        "click",
        resetGame
    );


    animate();

}



// ============================================
// CREATE SUBWAY WORLD
// ============================================

function createWorld(){

    let ground = new THREE.Mesh(

        new THREE.PlaneGeometry(
            16,
            3000
        ),

        new THREE.MeshStandardMaterial({
            color:0x333333
        })

    );


    ground.rotation.x =
        -Math.PI/2;


    ground.position.z =
        -1000;


    scene.add(ground);



    for(
        let i=-1;
        i<=1;
        i++
    ){

        let rail =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                0.15,
                3000
            ),

            new THREE.MeshStandardMaterial({
                color:0x888888
            })

        );


        rail.position.set(
            i * laneWidth,
            0.1,
            -1000
        );


        scene.add(rail);

    }



    for(
        let z=0;
        z>-1000;
        z-=40
    ){

        createWall(z);

    }

}




function createWall(z){


    let wall =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            1.5,
            8,
            10
        ),

        new THREE.MeshStandardMaterial({
            color:0x765341
        })

    );


    wall.position.set(
        -11,
        4,
        z
    );


    scene.add(wall);


    let wall2 =
    wall.clone();


    wall2.position.x =
        11;


    scene.add(wall2);

}



// ============================================
// CREATE PLAYER
// ============================================

function createPlayer(){

    player =
    new THREE.Group();



    let body =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            0.9,
            1.2,
            0.7
        ),

        new THREE.MeshStandardMaterial({
            color:0xff5722
        })

    );


    body.position.y =
        1;


    player.add(body);



    let head =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            0.6,
            0.5,
            0.6
        ),

        new THREE.MeshStandardMaterial({
            color:0xffcc80
        })

    );


    head.position.y =
        1.8;


    player.add(head);



    player.position.z =
        0;


    scene.add(player);

}



// ============================================
// CREATE CHASER
// ============================================

function createChaser(){


    chaser =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            1,
            2,
            1
        ),

        new THREE.MeshStandardMaterial({
            color:0x0033aa
        })

    );


    chaser.position.set(
        0,
        1,
        chaserDistance
    );


    scene.add(chaser);

}
// ============================================
// BUTTON + GAME START FIX
// ============================================

function startGame(){

    const menu = document.getElementById("menu-screen");

    if(menu){
        menu.classList.add("hidden");
    }

    gameActive = true;

    score = 0;
    sessionCoins = 0;

    const scoreDisplay = document.getElementById("score-val");
    const coinDisplay = document.getElementById("coin-val");

    if(scoreDisplay){
        scoreDisplay.innerText = score;
    }

    if(coinDisplay){
        coinDisplay.innerText = sessionCoins;
    }

    // Start spawning items if function exists
    if(typeof spawnProceduralItemsLoop === "function"){
        spawnProceduralItemsLoop();
    }

}



function resetGame(){

    const gameOver =
    document.getElementById("gameover-screen");

    if(gameOver){
        gameOver.classList.add("hidden");
    }

    startGame();

}



// ============================================
// CONNECT BUTTONS AFTER PAGE LOAD
// ============================================

window.addEventListener("DOMContentLoaded",()=>{


    const playButton =
    document.getElementById("play-btn");


    const retryButton =
    document.getElementById("retry-btn");



    if(playButton){

        playButton.addEventListener(
            "click",
            startGame
        );

    }



    if(retryButton){

        retryButton.addEventListener(
            "click",
            resetGame
        );

    }



    if(typeof init === "function"){

        init();

    }


});
