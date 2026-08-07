// ============================================
// KOLLINS SUBWAY SUFFER - NEW GAME ENGINE
// PART 1/3
// ============================================

let scene;
let camera;
let renderer;

let player;
let chaser;

let gameActive = false;

let currentLane = 0;
const laneWidth = 3.3;

let score = 0;
let coinsCollected = 0;

let speed = 0.35;
const maxSpeed = 1;

let obstacles = [];
let coins = [];
let vehicles = [];

let isJumping = false;
let jumpPower = 0;
const gravity = 0.018;

let gameMode = "RUNNING";
// RUNNING
// CAR
// POLICE
// HELICOPTER
// AIRPLANE

let vehicleActive = false;


// ============================================
// INITIALIZE GAME
// ============================================

function init(){

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x87ceeb);


    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );


    camera.position.set(
        0,
        5,
        8
    );


    camera.lookAt(
        0,
        1,
        -10
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



    let light = new THREE.DirectionalLight(
        0xffffff,
        1
    );

    light.position.set(
        10,
        20,
        10
    );

    scene.add(light);


    scene.add(
        new THREE.AmbientLight(
            0xffffff,
            0.5
        )
    );



    createWorld();

    createRunner();

    createPolice();



    window.addEventListener(
        "resize",
        resizeGame
    );


    window.addEventListener(
        "keydown",
        controls
    );



    document
    .getElementById("play-btn")
    .addEventListener(
        "click",
        startGame
    );


    document
    .getElementById("retry-btn")
    ?.addEventListener(
        "click",
        startGame
    );


    animate();

}



// ============================================
// CREATE WORLD
// ============================================

function createWorld(){


    let ground = new THREE.Mesh(

        new THREE.PlaneGeometry(
            20,
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


    scene.add(
        ground
    );



    // railway lines

    for(
        let i=-1;
        i<=1;
        i++
    ){

        let rail =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.2,
                0.1,
                3000
            ),

            new THREE.MeshStandardMaterial({
                color:0xaaaaaa
            })

        );


        rail.position.set(
            i * laneWidth,
            0.05,
            -1000
        );


        scene.add(
            rail
        );

    }



    // buildings

    for(
        let z=0;
        z>-1000;
        z-=40
    ){

        createBuilding(z);

    }

}



function createBuilding(z){


    let building =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            3,
            8,
            8
        ),

        new THREE.MeshStandardMaterial({
            color:0x555555
        })

    );


    building.position.set(
        -12,
        4,
        z
    );


    scene.add(
        building
    );



    let building2 =
    building.clone();


    building2.position.x =
    12;


    scene.add(
        building2
    );

}



// ============================================
// CREATE RUNNER
// ============================================

function createRunner(){


    player = new THREE.Group();



    let body =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            1,
            1.4,
            0.8
        ),

        new THREE.MeshStandardMaterial({
            color:0xff5500
        })

    );


    body.position.y =
    1;


    player.add(body);



    let head =
    new THREE.Mesh(

        new THREE.SphereGeometry(
            0.45,
            16,
            16
        ),

        new THREE.MeshStandardMaterial({
            color:0xffcc99
        })

    );


    head.position.y =
    2;


    player.add(head);



    player.position.z =
    0;


    scene.add(
        player
    );

}



// ============================================
// CREATE POLICE CHASER
// ============================================

function createPolice(){


    chaser =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            1.2,
            2,
            1.5
        ),

        new THREE.MeshStandardMaterial({
            color:0x0000ff
        })

    );


    chaser.position.set(
        0,
        1,
        10
    );


    scene.add(
        chaser
    );

}
// ============================================
// KOLLINS SUBWAY SURFER GAME ENGINE
// PART 2/3
// GAMEPLAY SYSTEMS
// ============================================


// ============================================
// PLAYER MOVEMENT & ANIMATION
// ============================================

function updatePlayer(){

    if(!player) return;


    // Jump physics
    if(isJumping){

        player.position.y += yVelocity;

        yVelocity -= gravity;


        if(player.position.y <= 0){

            player.position.y = 0;

            isJumping = false;

            yVelocity = 0;

        }

    }



    // Lane movement smooth animation

    let targetX = currentLane * laneWidth;


    player.position.x +=
    (targetX - player.position.x) * 0.15;



    // Running animation

    if(gameActive){

        player.rotation.z =
        Math.sin(Date.now()*0.01)*0.05;

    }


}



// ============================================
// MOVING OBJECTS SYSTEM
// ============================================

function updateObjects(){


    // Obstacles

    obstacles.forEach((obj,index)=>{


        obj.position.z += speed;



        if(obj.position.z > 10){

            scene.remove(obj);

            obstacles.splice(index,1);

        }



        // Collision detection

        if(player && obj){

            let distance =
            player.position.distanceTo(
                obj.position
            );


            if(distance < 1.5){

                gameOver();

            }

        }


    });




    // Coins

    coins.forEach((coin,index)=>{


        coin.position.z += speed;


        coin.rotation.y += 0.1;



        if(
            player &&
            player.position.distanceTo(
                coin.position
            ) < 1.2
        ){

            score += 10;

            sessionCoins++;


            document.getElementById(
                "score-val"
            ).innerText = score;



            document.getElementById(
                "coin-val"
            ).innerText = sessionCoins;



            scene.remove(coin);

            coins.splice(index,1);


        }



        if(coin.position.z > 10){

            scene.remove(coin);

            coins.splice(index,1);

        }


    });



    // Increase speed

    if(speed < maxSpeed){

        speed += 0.00003;

    }


}




// ============================================
// SPAWN SYSTEM
// CARS - TRAINS - HELICOPTERS - PLANES
// ============================================

function spawnProceduralItemsLoop(){


    if(!gameActive)
    return;



    let lane =
    [-laneWidth,0,laneWidth]
    [
        Math.floor(
            Math.random()*3
        )
    ];



    let random =
    Math.random();



    // TRAIN

    if(random < 0.20){


        let train =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3,
                3,
                15
            ),

            new THREE.MeshStandardMaterial({
                color:0x555555
            })

        );


        train.position.set(
            lane,
            1.5,
            -150
        );


        scene.add(train);

        obstacles.push(train);



    }



    // POLICE CAR

    else if(random < 0.40){


        let car =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2,
                1,
                4
            ),

            new THREE.MeshStandardMaterial({
                color:0x111111
            })

        );


        car.position.set(
            lane,
            0.5,
            -150
        );


        scene.add(car);

        obstacles.push(car);


    }



    // HELICOPTER EVENT

    else if(random < 0.55){


        let helicopter =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2,
                0.5,
                4
            ),

            new THREE.MeshStandardMaterial({
                color:0x0066ff
            })

        );


        helicopter.position.set(
            lane,
            8,
            -150
        );


        scene.add(helicopter);

        obstacles.push(helicopter);


    }



    // AIRPLANE EVENT

    else if(random < 0.65){


        let plane =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3,
                0.5,
                8
            ),

            new THREE.MeshStandardMaterial({
                color:0xffffff
            })

        );


        plane.position.set(
            lane,
            12,
            -150
        );


        scene.add(plane);

        obstacles.push(plane);


    }



    // COINS

    else{


        createCoins(lane);


    }




    setTimeout(
        spawnProceduralItemsLoop,
        1000
    );


}





// ============================================
// COIN CREATOR
// ============================================

function createCoins(lane){


    for(
        let i=0;
        i<5;
        i++
    ){


        let coin =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.4,
                0.4,
                0.15,
                20
            ),

            new THREE.MeshStandardMaterial({
                color:0xffd700,
                metalness:1
            })

        );



        coin.rotation.x =
        Math.PI/2;



        coin.position.set(
            lane,
            1,
            -100-(i*5)
        );



        scene.add(coin);

        coins.push(coin);


    }


}




// ============================================
// GAME OVER
// ============================================

function gameOver(){


    gameActive=false;


    document
    .getElementById(
        "gameover-screen"
    )
    .classList.remove("hidden");


}
// ============================================
// KOLLINS SUBWAY SURFER GAME ENGINE
// PART 3/3
// CONTROLS + EFFECTS + FINAL CONNECTION
// ============================================


// ============================================
// KEYBOARD CONTROLS
// ============================================

function handleKeyboardControls(e){

    if(!gameActive) return;


    let key = e.key.toLowerCase();



    // Move left

    if(
        key === "arrowleft" ||
        key === "a"
    ){

        if(currentLane > -1){

            currentLane--;

        }

    }



    // Move right

    if(
        key === "arrowright" ||
        key === "d"
    ){

        if(currentLane < 1){

            currentLane++;

        }

    }



    // Jump

    if(
        key === "arrowup" ||
        key === "w" ||
        key === " "
    ){

        if(!isJumping){

            isJumping = true;

            yVelocity = jumpForce;

        }

    }



    // Slide

    if(
        key === "arrowdown" ||
        key === "s"
    ){

        isSliding = true;


        setTimeout(()=>{

            isSliding=false;

        },500);

    }


}





// ============================================
// TOUCH CONTROL FOR MOBILE
// ============================================

function setupTouchSwipeControls(){


    let startX=0;
    let startY=0;



    window.addEventListener(
        "touchstart",
        e=>{

            startX =
            e.touches[0].clientX;


            startY =
            e.touches[0].clientY;

        }
    );




    window.addEventListener(
        "touchend",
        e=>{


            if(!gameActive)
            return;



            let endX =
            e.changedTouches[0].clientX;


            let endY =
            e.changedTouches[0].clientY;



            let x =
            endX-startX;


            let y =
            endY-startY;




            if(x > 50){

                if(currentLane < 1)
                currentLane++;

            }


            if(x < -50){

                if(currentLane > -1)
                currentLane--;

            }



            if(y < -50){

                if(!isJumping){

                    isJumping=true;

                    yVelocity=jumpForce;

                }

            }



        }
    );


}





// ============================================
// HOVERBOARD SYSTEM
// ============================================

function activateHoverboard(){


    if(!player)
    return;


    isHoverboardActive=true;


    player.scale.y=1.2;



    setTimeout(()=>{


        isHoverboardActive=false;

        player.scale.y=1;



    },5000);


}





// ============================================
// FOOTBALL KICK FEATURE ⚽
// ============================================

function createFootball(){


    let ball =
    new THREE.Mesh(

        new THREE.SphereGeometry(
            0.35,
            20,
            20
        ),


        new THREE.MeshStandardMaterial({

            color:0xffffff

        })

    );



    ball.position.set(

        player.position.x,

        0.5,

        -2

    );



    scene.add(ball);



    let kick = setInterval(()=>{


        ball.position.z -= 1;



        ball.rotation.x +=0.3;



        if(ball.position.z < -100){

            clearInterval(kick);

            scene.remove(ball);

        }


    },30);



}





// Press F to kick football

window.addEventListener(
"keydown",
e=>{


    if(
        e.key.toLowerCase()=="f"
        &&
        gameActive
    ){

        createFootball();

    }


});





// ============================================
// RESIZE FIX
// ============================================

function onWindowResize(){


    if(!camera || !renderer)
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





// ============================================
// START BUTTON FINAL CONNECTION
// ============================================

window.addEventListener(
"DOMContentLoaded",
()=>{


    const play =
    document.getElementById(
        "play-btn"
    );


    const retry =
    document.getElementById(
        "retry-btn"
    );



    if(play){

        play.onclick =
        startGame;

    }



    if(retry){

        retry.onclick =
        resetGame;

    }



    init();


});





// ============================================
// RESET GAME
// ============================================

function resetGame(){


    document
    .getElementById(
        "gameover-screen"
    )
    .classList.add(
        "hidden"
    );


    score=0;

    sessionCoins=0;

    speed=0.28;


    startGame();


}
// ============================================
// FINAL BUTTON CONNECTION FIX
// ============================================

window.addEventListener("load", function(){

    const playBtn = document.getElementById("play-btn");
    const retryBtn = document.getElementById("retry-btn");


    if(playBtn){

        playBtn.onclick = function(){

            startGame();

        };

    }


    if(retryBtn){

        retryBtn.onclick = function(){

            resetGame();

        };

    }


    console.log("Subway Surfers buttons connected");

});
