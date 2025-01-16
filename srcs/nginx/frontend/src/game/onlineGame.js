import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { handleMatchOver, disconnectionMessage } from '../online_gaming/renderPages.js';

export const FIELD_DIMENSION_Z = 6;

import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { Score } from './score.js';
import { Countdown } from './Countdown.js'; 

const ASPECT_RATIO = window.innerWidth / window.innerHeight;
const CAMERA_FOV = 75;
const CAMERA_POSZ = 5;
const CAMERA_POSY = 5;
const MIN_RENDERED_DISTANCE = 0.1;
const MAX_RENDERED_DISTANCE = 1000;
const FPS = 60;
const INTERVAL = 1000 / FPS;

const STADIUM_MODEL_PATH = './src/assets/3d-models/game/scene.glb';
const STADIUM_SCALE = 0.5;

const LIGHT_COLOR = 0xffffff;
const LIGHT_POSX = 3;
const LIGHT_POSY = 10;
const LIGHT_POSZ = -3;
const AMBIANT_LIGHT_INTENSITY = 0.5;
const DIRECTIONAL_LIGHT_INTENSITY = 1;

const KICK_OFF_LENGTH = 1000; // 2 seconds in ms
export const BALL_RADIUS = FIELD_DIMENSION_Z / 30;
const BALL_INITIAL_X = 0;
const BALL_INITIAL_Y = 0.22;
const BALL_INITIAL_Z = 0;
const BALL_VELOCITY = 0.06;
const BALL_SOUND_EFFECT_PATH = './src/assets/sound/ball_hit.wav';
const BALL_TEXTURE_PATH = './src/assets/3d-models/game/ball_texture.jpg'
const BALL_VELOCITY_MULTIPLIER = 1.3; // to adjust

const PADDLE_COLOR = 0xffffff;
const PADDLE_SPEED = 0.12;
export const PADDLE_DIMENSION_X = 0.2;
export const PADDLE_DIMENSION_Y = 0.2;
export const PADDLE_DIMENSION_Z = 1;
const PADDLE_LEFT_POSX = -4.8;
const PADDLE_LEFT_POSY = 0.2;
const PADDLE_LEFT_POSZ = 0;
const PADDLE_RIGHT_POSX = 4.8;
const PADDLE_RIGHT_POSY = 0.2;
const PADDLE_RIGHT_POSZ = 0;
const BIND_UP = 'q';
const BIND_DOWN = 'a';

const SCORE_LEFT_POS = {x: -1.5, y: 1, z: -3};
const SCORE_RIGHT_POS = {x: 0.5, y: 1, z: -3};
const SCORE_FONT_SIZE = 1;
const SCORE_FONT_DEPTH = 0.2;
const SCORE_FONT_COLOR = 0xffffff;

const keyPressed = new Set();
window.addEventListener('keydown', (e) => keyPressed.add(e.key));
window.addEventListener('keyup', (e) => keyPressed.delete(e.key));

export class Game {
    // ThreeJS Scene
    #scene;
    #camera;
    #renderer;
    #controls;
    // -------------
    #ball;
    #paddleLeft;
    #paddleRight;
    #score;
    #countdown;
    // -------------
    #socket;
    #playerId;
    #withCountdown;

    constructor(socket, playerId, withCountdown = true) {
        this.#socket = socket;
        this.#playerId = playerId;
        this.#withCountdown = withCountdown;
        this.#socket.onmessage = (event) => this.handleServerMessage(JSON.parse(event.data));
        this.initScene();

        this.#paddleLeft = new Paddle({
            scene: this.#scene,
            speed: PADDLE_SPEED,
            posX: PADDLE_LEFT_POSX,
            posY: PADDLE_LEFT_POSY,
            posZ: PADDLE_LEFT_POSZ,
            dimensionX: PADDLE_DIMENSION_X,
            dimensionY: PADDLE_DIMENSION_Y,
            dimensionZ: PADDLE_DIMENSION_Z,
            color: PADDLE_COLOR
        });

        this.#paddleRight = new Paddle({
            scene: this.#scene,
            speed: PADDLE_SPEED,
            posX: PADDLE_RIGHT_POSX,
            posY: PADDLE_RIGHT_POSY,
            posZ: PADDLE_RIGHT_POSZ,
            dimensionX: PADDLE_DIMENSION_X,
            dimensionY: PADDLE_DIMENSION_Y,
            dimensionZ: PADDLE_DIMENSION_Z,
            color: PADDLE_COLOR
        });

        this.#ball = new Ball({
            scene: this.#scene,
            radius: BALL_RADIUS,
            posX: BALL_INITIAL_X,
            posY: BALL_INITIAL_Y,
            posZ: BALL_INITIAL_Z,
            velocity: BALL_VELOCITY,
            soundEffectPath: BALL_SOUND_EFFECT_PATH,
            texturePath: BALL_TEXTURE_PATH,
            kickOffTimeOut: KICK_OFF_LENGTH,
            velocityMultiplier: BALL_VELOCITY_MULTIPLIER
        });

        this.#score = new Score({
            scene: this.#scene,
            scoreLeftPos: SCORE_LEFT_POS,
            scoreRightPos: SCORE_RIGHT_POS,
            fontPath: './src/assets/fonts/Poppins ExtraBold_Regular.json',
            fontSize: SCORE_FONT_SIZE,
            fontDepth: SCORE_FONT_DEPTH,
            color: SCORE_FONT_COLOR
        });

        if (this.#withCountdown)
        {
            this.#countdown = new Countdown({
                scene: this.#scene,
                fontPath: './src/assets/fonts/Poppins ExtraBold_Regular.json',
                fontSize: SCORE_FONT_SIZE,
                fontDepth: SCORE_FONT_DEPTH,
                color: SCORE_FONT_COLOR
            });
        }
        else
            this.#countdown = null; // No countdown
    }

    initScene() {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color('skyblue');
        this.#camera = new THREE.PerspectiveCamera(CAMERA_FOV, ASPECT_RATIO, MIN_RENDERED_DISTANCE, MAX_RENDERED_DISTANCE);
        this.#camera.position.z = CAMERA_POSZ;
        this.#camera.position.y = CAMERA_POSY;
        this.#renderer = new THREE.WebGLRenderer();
        this.#renderer.setSize(window.innerWidth, window.innerHeight); // resolution of the rendered objects in the scene

        const mainDiv = document.getElementById("main");
        mainDiv.appendChild(this.#renderer.domElement); // add the canvas to the DOM

        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement); // functionality to move around with the mouse

        // Lighting
        const ambientLight = new THREE.AmbientLight(LIGHT_COLOR, AMBIANT_LIGHT_INTENSITY);
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        directionalLight.position.set(LIGHT_POSX, LIGHT_POSY, LIGHT_POSZ);
        this.#scene.add(directionalLight);

        // Stadium 3D model loading
        const loader = new GLTFLoader();
        loader.load(STADIUM_MODEL_PATH, (gltf) => {
            const model = gltf.scene;
            model.scale.set(STADIUM_SCALE, STADIUM_SCALE, STADIUM_SCALE);
            this.#scene.add(model);
        });
    }

    refreshPaddlePos(bindUp, bindDown)
    {
        if (keyPressed.has(bindUp))
                this.sendPlayerAction("up");
        
        else if (keyPressed.has(bindDown))
                this.sendPlayerAction("down");
    }

    sendPlayerAction(direction)
    {
        this.#socket.send(JSON.stringify({
            event: "player_action",
            playerId: this.#playerId, // add protection
            direction: direction
        }));
    }
    
    handleServerMessage(message) {
        if (message.event === "game_state")
        {
            const { player1, player2, ball } = message;

            if (this.#paddleLeft.getPosZ() !== player1.position)
                this.#paddleLeft.setPosZ(player1.position);
    
            if (this.#paddleRight.getPosZ() !== player2.position)
                this.#paddleRight.setPosZ(player2.position);

            this.#ball.setPosition(ball.position[0], ball.position[1]);
            this.#ball.setDirection(ball.direction[0], ball.direction[1]);
            
            this.checkCollision();

            if (this.#score.getScoreLeft() !== player1.score)
                this.#score.scoreLeft();
    
            if (this.#score.getScoreRight() !== player2.score)
                this.#score.scoreRight();
        }
        else if (message.event === "match_over")
        {
            this.clear();
            handleMatchOver(message.winner, message.player1_score, message.player2_score, this.#playerId);
        }
        else if (message.event == "disconnection")
        {
            disconnectionMessage();
        }
    }

    checkCollision()
    {
        if ((this.#ball.getPosX() - BALL_RADIUS) <= (this.#paddleLeft.getPosX() + (PADDLE_DIMENSION_X / 2)) && 
            (this.#ball.getPosZ()) >= (this.#paddleLeft.getPosZ() - (PADDLE_DIMENSION_Z / 2)) &&
            (this.#ball.getPosZ()) <= (this.#paddleLeft.getPosZ() + (PADDLE_DIMENSION_Z / 2)))
                this.#ball.playSoundEffect();

        if ((this.#ball.getPosX() + BALL_RADIUS) >= (this.#paddleRight.getPosX() - (PADDLE_DIMENSION_X / 2)) && 
            (this.#ball.getPosZ()) >= (this.#paddleRight.getPosZ() - (PADDLE_DIMENSION_Z / 2)) &&
            (this.#ball.getPosZ()) <= (this.#paddleRight.getPosZ() + (PADDLE_DIMENSION_Z / 2)))
                this.#ball.playSoundEffect();
    }

    clear()
    {
        this.#renderer.setAnimationLoop(null); // stop animation loop
        this.#ball.dispose(); // dispose the resources (ball hit sound)
        this.#renderer.clear();

        const nicknamesDiv = document.getElementById('nicknames');
        if (nicknamesDiv) {
            nicknamesDiv.remove();
        }

        // Remove the canvas from the DOM
        const canvas = this.#renderer.domElement;
        canvas.parentNode.removeChild(canvas);
    }

    loop()
    {
        let     lastTime = 0;
        const   animate = (time) => {
            const delta = time - lastTime;

            if (delta > INTERVAL)
            {
                lastTime = time - (delta % INTERVAL);

                this.#renderer.render(this.#scene, this.#camera);
                this.#controls.update();
                this.refreshPaddlePos(BIND_UP, BIND_DOWN);
            }
            this.#renderer.setAnimationLoop(animate);
        };
        this.#renderer.setAnimationLoop(animate);
    }
}


