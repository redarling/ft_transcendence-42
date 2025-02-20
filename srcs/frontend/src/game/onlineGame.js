import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { handleMatchOver } from '../online_gaming/renderPages.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { Score } from './score.js';
import { Countdown } from './Countdown.js'; 
import showToast from "../utils/toast.js";

export const FIELD_DIMENSION_Z = 6;

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
const BALL_VELOCITY = 0.12;
const BALL_SOUND_EFFECT_PATH = './src/assets/sound/ball_hit.wav';
const BALL_TEXTURE_PATH = './src/assets/3d-models/game/ball_texture.jpg'
const BALL_VELOCITY_MULTIPLIER = 1.3;

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
    #scene;
    #camera;
    #renderer;
    #controls;
    #ball;
    #paddleLeft;
    #paddleRight;
    #score;
    #countdown;
    #matchOver;
    #socket;
    #playerId;
    #withCountdown;
    #interpolationTargets;

    constructor(socket, playerId, withCountdown = true) {
        this.#socket = socket;
        this.#playerId = playerId;
        this.#withCountdown = withCountdown;
        this.#matchOver = false;
        this.#interpolationTargets = { ball: null, paddleLeft: null, paddleRight: null };
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
            this.#countdown = null;
    }

    initScene() {
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color('skyblue');
        this.#camera = new THREE.PerspectiveCamera(CAMERA_FOV, ASPECT_RATIO, MIN_RENDERED_DISTANCE, MAX_RENDERED_DISTANCE);
        this.#camera.position.z = CAMERA_POSZ;
        this.#camera.position.y = CAMERA_POSY;
        this.#renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: "high-performance" // As it's gaming we want to maximize CPU usage for better FPS
        });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderer.setPixelRatio(window.devicePixelRatio * 0.75);
        const mainDiv = document.getElementById("main");
        mainDiv.appendChild(this.#renderer.domElement);
        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        const ambientLight = new THREE.HemisphereLight(LIGHT_COLOR, AMBIANT_LIGHT_INTENSITY);
        this.#scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        directionalLight.position.set(LIGHT_POSX, LIGHT_POSY, LIGHT_POSZ);
        this.#scene.add(directionalLight);
        const loader = new GLTFLoader();
        loader.load(STADIUM_MODEL_PATH, (gltf) => {
            const model = gltf.scene;
            model.scale.set(STADIUM_SCALE, STADIUM_SCALE, STADIUM_SCALE);
            this.#scene.add(model);
        });
    }

    refreshPaddlePos(bindUp, bindDown)
    {
        const now = performance.now();
    
        if (this.lastActionSentTime === undefined || now - this.lastActionSentTime >= 5)
        {
            if (keyPressed.has(bindUp))
            {
                this.sendPlayerAction("up");
            }
            else if (keyPressed.has(bindDown))
            {
                this.sendPlayerAction("down");
            }
            this.lastActionSentTime = now;
        }
    }

    sendPlayerAction(direction)
    {
        this.#socket.send(JSON.stringify({
            event: "player_action",
            direction: direction
        }));
    }
    
    handleServerMessage(message)
    {
        if (message.event === "game_state")
        {
            const { player1, player2, ball } = message;
    
            if (player1 && player1.position !== undefined)
            {
                this.#interpolationTargets.paddleLeft = player1.position;
                if (this.#paddleLeft.getPosZ() !== player1.position)
                    this.#paddleLeft.setPosZ(player1.position);
                if (this.#score.getScoreLeft() !== player1.score)
                    this.#score.scoreLeft();
            }

            if (player2 && player2.position !== undefined)
            {
                this.#interpolationTargets.paddleRight = player2.position;
                if (this.#paddleRight.getPosZ() !== player2.position)
                    this.#paddleRight.setPosZ(player2.position);
                if (this.#score.getScoreRight() !== player2.score)
                    this.#score.scoreRight();
            }
    
            if (ball && ball.position && ball.direction)
            {
                this.#interpolationTargets.ball = {
                    position: ball.position,
                    direction: ball.direction
                };
            }
        }
        else if (message.event === "match_over")
        {
            this.clear();
            this.#matchOver = true;
            handleMatchOver(message.winner, message.player1_score, message.player2_score, this.#playerId);
        }
        else if (message.event == "disconnection")
        {
            if (!this.#matchOver)
                showToast("Player disconnected. Match will be finished in 20 seconds if the player doesn't return.", 'error');
        }
    }

    updateInterpolation(deltaTime) {
        const lerp = (start, end, t) => start + (end - start) * t;

        const t = Math.min(deltaTime / INTERVAL, 1);

        if (this.#interpolationTargets.ball)
        {
            const target = this.#interpolationTargets.ball.position;

            this.#ball.setPosition(
                lerp(this.#ball.getPosX(), target[0], t),
                lerp(this.#ball.getPosY(), target[1], t),
                lerp(this.#ball.getPosZ(), target[2], t)
            );
        }

        if (this.#interpolationTargets.paddleLeft !== null) {
            const targetZ = this.#interpolationTargets.paddleLeft;
            this.#paddleLeft.setPosZ(lerp(this.#paddleLeft.getPosZ(), targetZ, t));
        }

        if (this.#interpolationTargets.paddleRight !== null) {
            const targetZ = this.#interpolationTargets.paddleRight;
            this.#paddleRight.setPosZ(lerp(this.#paddleRight.getPosZ(), targetZ, t));
        }
    }


    loop()
    {
        let lastTime = performance.now();
        let accumulator = 0;
    
        const renderScene = () => {
            this.#renderer.render(this.#scene, this.#camera);
        };
    
        const animate = (time) => {
            const deltaTime = time - lastTime;
            lastTime = time;
    
            accumulator += deltaTime;
    
            while (accumulator >= INTERVAL)
            {
                this.updateInterpolation(accumulator);
                this.refreshPaddlePos(BIND_UP, BIND_DOWN);
                accumulator -= INTERVAL;
            }
    
            renderScene();
    
            requestAnimationFrame(animate);
        };
    
        requestAnimationFrame(animate);
    }

    clear()
    {
        this.#renderer.setAnimationLoop(null);
        this.#ball.dispose();
        this.#renderer.clear();

        const nicknamesDiv = document.getElementById('nicknames');
        if (nicknamesDiv)
            nicknamesDiv.remove();

        const canvas = this.#renderer.domElement;
        if (canvas)
            canvas.parentNode.removeChild(canvas);
    }
}
