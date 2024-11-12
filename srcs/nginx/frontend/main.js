import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let scoreFont;
let leftScoreMesh = {mesh: null};
let rightScoreMesh = {mesh: null};;
let scoreLeft = 0;
let scoreRight = 0;
let timesHit = 0;

let leftScorePos = {x: -1.5, y: 1, z: -3};
let rightScorePos = {x: 0.5, y: 1, z: -3};

const fontLoader = new FontLoader();
fontLoader.load('public/font/Poppins ExtraBold_Regular.json', function(loadedFont) {
    scoreFont = loadedFont;
    createScoreText('0', leftScoreMesh, leftScorePos);
    createScoreText('0', rightScoreMesh, rightScorePos);
});

function createScoreText(scoreText, scoreMeshObject, pos) {
    if (scoreMeshObject.mesh) {
        scene.remove(scoreMeshObject.mesh);
        scoreMeshObject.mesh.geometry.dispose();
        scoreMeshObject.mesh.material.forEach(material => material.dispose());
    }

    const scoreGeometry = new TextGeometry(scoreText, {
        font: scoreFont,
        size: 1,
        depth: 0.2,
    });

    scoreMeshObject.mesh = new THREE.Mesh(scoreGeometry, [
        new THREE.MeshPhongMaterial({ color: 0xffffff }),
        new THREE.MeshPhongMaterial({ color: 0xffffff })
    ]);

    scoreMeshObject.mesh.castShadow = true;
    scoreMeshObject.mesh.position.set(pos.x, pos.y, pos.z);
    scene.add(scoreMeshObject.mesh);
}

const CAMERA_FOV = 75;

const FIELD_DIMENSION_Z = 6;

const BALL_VELOCITY_STAGE = 0.01;
const INITIAL_BALL_VELOCITY_X = 0.03;
const INITIAL_BALL_VELOCITY_Z = 0.03;
let ball_velocity_x = INITIAL_BALL_VELOCITY_X;
let ball_velocity_z = INITIAL_BALL_VELOCITY_Z;
const BALL_INITIAL_X = 0;
const BALL_INITIAL_Y = 0.22;
const BALL_INITIAL_Z = 0;
const BALL_RADIUS = FIELD_DIMENSION_Z / 30;
let ball_direction_x = 1;
let ball_direction_z = 1;

const PADDLE_MOVE_SPEED = 0.06;
const PADDLE_DIMENSION_X = 0.2;
const PADDLE_DIMENSION_Y = 0.2;
const PADDLE_DIMENSION_Z = 1;

// -------------- BINDING -------------- //

const PADDLE_LEFT_BIND_UP = 'a';
const PADDLE_LEFT_BIND_DOWN = 'q';
const PADDLE_RIGHT_BIND_UP = 'p';
const PADDLE_RIGHT_BIND_DOWN = 'm';

let keyPressed = [];

window.addEventListener('keydown', function(e) {
    keyPressed[e.key] = true;
});

window.addEventListener('keyup', function(e) {
    keyPressed[e.key] = false;
});

// ------------------------------------- //

// render objects with a distance from the camera ranging from 0.1 to 1000 
const MIN_RENDERED_DISTANCE = 0.1;
const MAX_RENDERED_DISTANCE = 1000;

const ASPECT_RATIO = window.innerWidth / window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');
const camera = new THREE.PerspectiveCamera(CAMERA_FOV, ASPECT_RATIO, MIN_RENDERED_DISTANCE, MAX_RENDERED_DISTANCE);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // resolution of the rendered objects in the scene
document.body.appendChild(renderer.domElement); // add the canvas to the DOM

const controls = new OrbitControls(camera, renderer.domElement);

// -------------- HELPERS -------------- //
// const gridHelper = new THREE.GridHelper(200, 200); // Number of grids and diviser
// scene.add(gridHelper);
// ------------------------------------- //

const textureLoader = new THREE.TextureLoader();
const ballTexture = textureLoader.load('public/ball_texture.jpg');

const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 8);
const ballMaterial = new THREE.MeshStandardMaterial( { map: ballTexture } );
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);
ball.position.set(BALL_INITIAL_X, BALL_INITIAL_Y, BALL_INITIAL_Z);

const paddleGeometry = new THREE.BoxGeometry(PADDLE_DIMENSION_X, PADDLE_DIMENSION_Y, PADDLE_DIMENSION_Z);
const paddleMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
const paddleLeft = new THREE.Mesh(paddleGeometry, paddleMaterial);
const paddleRight = new THREE.Mesh(paddleGeometry, paddleMaterial);

paddleLeft.position.set(-4.8, 0.2, 0);
paddleRight.position.set(4.8, 0.2, 0);
scene.add(paddleLeft);
scene.add(paddleRight);

camera.position.z = 5;
camera.position.y = 5;

// LIGHT
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // White color, intensity 0.5
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ballHitSound = new Audio('public/ball_hit.wav');


const loader = new GLTFLoader();
loader.load('public/scene.glb', (gltf) => { // ??
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    scene.add(model);
});


function refreshPaddlePos(paddle, bindUp, bindDown) {
    if (keyPressed[bindUp]) {
        if (paddle.position.z - (PADDLE_DIMENSION_Z / 2) > -(FIELD_DIMENSION_Z / 2)) {
            paddle.position.z -= PADDLE_MOVE_SPEED;
        }
    } else if (keyPressed[bindDown]) {
        if (paddle.position.z + (PADDLE_DIMENSION_Z / 2) < FIELD_DIMENSION_Z / 2) {
            paddle.position.z += PADDLE_MOVE_SPEED;
        }
    }
}

function updateBallVelocity() {
    if (timesHit % 3 === 0) {
        ball_velocity_x += BALL_VELOCITY_STAGE;
        ball_velocity_z += BALL_VELOCITY_STAGE;
    }
}

function resetBall(ball) {
    ball.position.x = BALL_INITIAL_X;
    ball.position.z = BALL_INITIAL_Z;
    ball_velocity_x = INITIAL_BALL_VELOCITY_X;
    ball_velocity_z = INITIAL_BALL_VELOCITY_Z;
}

function refreshBallPos(ball) {
    ball.position.x += ball_velocity_x * ball_direction_x;
    ball.position.z += ball_velocity_z * ball_direction_z;

    if ((ball.position.z + BALL_RADIUS) >= FIELD_DIMENSION_Z / 2 ||
        (ball.position.z - BALL_RADIUS) <= -(FIELD_DIMENSION_Z / 2)) {
        ball_direction_z *= -1;
    }

    if ((ball.position.x - BALL_RADIUS) <= (paddleLeft.position.x + (PADDLE_DIMENSION_X / 2)) && 
        (ball.position.z) >= (paddleLeft.position.z - (PADDLE_DIMENSION_Z / 2)) &&
        (ball.position.z) <= (paddleLeft.position.z + (PADDLE_DIMENSION_Z / 2))) {
        timesHit += 1;
        updateBallVelocity();
        ballHitSound.play();
        ball_direction_x *= -1;
    }

    if ((ball.position.x + BALL_RADIUS) >= (paddleRight.position.x - (PADDLE_DIMENSION_X / 2)) && 
        (ball.position.z) >= (paddleRight.position.z - (PADDLE_DIMENSION_Z / 2)) &&
        (ball.position.z) <= (paddleRight.position.z + (PADDLE_DIMENSION_Z / 2))) {
        timesHit += 1;
        updateBallVelocity();
        ballHitSound.play();
        ball_direction_x *= -1;
    }

    if (ball.position.x < paddleLeft.position.x) {
        scoreRight += 1;
        timesHit = 0;
        createScoreText(scoreRight.toString(), rightScoreMesh, rightScorePos);
        resetBall(ball);
    }
    if (ball.position.x > paddleRight.position.x) {
        scoreLeft += 1;
        timesHit = 0;
        createScoreText(scoreLeft.toString(), leftScoreMesh, leftScorePos);
        resetBall(ball);
    }
}

function animate() { // main rendering loop
    renderer.render(scene, camera);
    controls.update();
    refreshPaddlePos(paddleLeft, PADDLE_LEFT_BIND_UP, PADDLE_LEFT_BIND_DOWN);
    refreshPaddlePos(paddleRight, PADDLE_RIGHT_BIND_UP, PADDLE_RIGHT_BIND_DOWN);
    refreshBallPos(ball);
}

renderer.setAnimationLoop(animate); // telling the renderer which function to use to render everything