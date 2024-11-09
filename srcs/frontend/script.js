// CANVAS
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;
const CANVAS_STYLE = "red";

// PADDLE
const PADDLE_WIDTH = 10;
const PADDLE_MARGIN = 3;
const PADDLE_HEIGHT_RATIO = 0.3;
const PADDLE_LEFT_BIND_UP = 'a';
const PADDLE_LEFT_BIND_DOWN = 'q';
const PADDLE_RIGHT_BIND_UP = 'p';
const PADDLE_RIGHT_BIND_DOWN = 'm';

// BALL
const BALL_RADIUS = 20;
const BALL_START_X = CANVAS_WIDTH / 2;
const BALL_START_Y = CANVAS_HEIGHT / 2;
const BALL_VELOCITY_X = 10;
const BALL_VELOCITY_Y = 10;

let leftWon = false;

class Ball {
    constructor(x, y, radius, velocity_x, velocity_y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.radius = radius;
        this.velocityX = velocity_x;
        this.velocityY = velocity_y;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }

    checkGoalWallCollision() {
        if (this.x - this.radius < 0) {
            scoreRightValue += 1;
            this.reset();
            return true;
        } else if (this.x + this.radius > canvas.width) {
            scoreLeftValue += 1;
            this.reset();
            return true;
        }
        return false;
    }

    checkPaddleCollision(paddle) {
        if (
            this.x - this.radius < paddle.x + paddle.width &&
            this.x + this.radius > paddle.x &&
            this.y + this.radius > paddle.y &&
            this.y - this.radius < paddle.y + paddle.height
        ) {
            this.velocityX *= -1;
        }
    }

    render(paddleLeft, paddleRight) {
        if (this.checkGoalWallCollision()) {
            scoreRightValue += (this.x - this.radius < 0) ? 1 : 0;
            scoreLeftValue += (this.x + this.radius > canvas.width) ? 1 : 0;
            this.velocityX *= -1;
            return;
        }

        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
            this.velocityY *= -1;
        }

        this.checkPaddleCollision(paddleLeft);
        this.checkPaddleCollision(paddleRight);

        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

class Paddle {
    constructor(x, y, width, height, bindUp, bindDown) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bindUp = bindUp;
        this.bindDown = bindDown;
        this.velocity = 8;
    }
    render() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fill();
        if (keyPressed[this.bindUp]) {
            if (this.y > 0) {
                this.y -= this.velocity;
            }
        } else if (keyPressed[this.bindDown]) {
            if (this.y + this.height < canvas.height) {
                this.y += this.velocity;
            }
        }
    }
}

function refreshScore() {
    scoreLeftElement.innerHTML = scoreLeftValue.toString();
    scoreRightElement.innerHTML = scoreRightValue.toString();
}

//===----------------------------------------------------------------------===//

function render(paddleLeft, paddleRight, ball) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    paddleLeft.render();
    paddleRight.render();
    ball.render(paddleLeft, paddleRight);
    refreshScore();
    requestAnimationFrame(() => render(paddleLeft, paddleRight, ball));
}

//===----------------------------------------------------------------------===//

let keyPressed = [];

window.addEventListener('keydown', function(e) {
    keyPressed[e.key] = true;
});

window.addEventListener('keyup', function(e) {
    keyPressed[e.key] = false;
});

//===----------------------------------------------------------------------===//

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
context.fillStyle = CANVAS_STYLE;

//===----------------------------------------------------------------------===//

const paddleLeftHeight = canvas.height * PADDLE_HEIGHT_RATIO;
const paddleLeftX = PADDLE_MARGIN;
const paddleLeftY = (canvas.height / 2) - (paddleLeftHeight / 2);
let paddleLeft = new Paddle(
    paddleLeftX,
    paddleLeftY,
    PADDLE_WIDTH,
    paddleLeftHeight,
    PADDLE_LEFT_BIND_UP,
    PADDLE_LEFT_BIND_DOWN
);

const paddleRightHeight = canvas.height * PADDLE_HEIGHT_RATIO;
const paddleRightX = (canvas.width) - PADDLE_MARGIN - PADDLE_WIDTH;
const paddleRightY = (canvas.height / 2) - (paddleRightHeight / 2);
let paddleRight = new Paddle(
    paddleRightX,
    paddleRightY,
    PADDLE_WIDTH,
    paddleRightHeight,
    PADDLE_RIGHT_BIND_UP,
    PADDLE_RIGHT_BIND_DOWN
);

let ball = new Ball(BALL_START_X, BALL_START_Y, BALL_RADIUS, BALL_VELOCITY_X, BALL_VELOCITY_Y);

let scoreLeftValue = 0;
let scoreRightValue = 0;

let scoreLeftElement = document.getElementById("scoreLeft");
let scoreRightElement = document.getElementById("scoreRight");

render(paddleLeft, paddleRight, ball);

//===----------------------------------------------------------------------===//