import { FIELD_DIMENSION_Z } from "./game.js";
import { BALL_RADIUS } from "./game.js";

const eventPressP = createKeyboardEvent('p', 'keydown');
const eventReleaseP = createKeyboardEvent('p', 'keyup');
const eventPressM = createKeyboardEvent('m', 'keydown');
const eventReleaseM = createKeyboardEvent('m', 'keyup');

function createKeyboardEvent(key, eventType) {
    return new KeyboardEvent(eventType, {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: key.charCodeAt(0),
        bubbles: true,
        cancelable: true
    });
}

export class AI {
    #paddle;
    #ball;
    #difficulty; // 1 = easy, 2 = medium, 3 = hard
    #lastStateRefresh;

    constructor(paddle, ball, difficulty) {
        this.#paddle = paddle;
        this.#ball = ball;
        this.#difficulty = difficulty;
        this.#lastStateRefresh = 0;
    }

    async #predictBallTrajectory() {
        // Snapshot of the game state
        let ballPosX = this.#ball.getPosX();
        let ballPosZ = this.#ball.getPosZ();
        let ballDirectionX = this.#ball.getDirectionX();
        let ballDirectionZ = this.#ball.getDirectionZ();
        const ballVelocityX = this.#ball.getVelocityX();
        const ballVelocityZ = this.#ball.getVelocityZ();
        const agentPaddlePosX = this.#paddle.getPosX();
    
        // Calculate time to reach the paddle
        const timeToPaddle = (agentPaddlePosX - ballPosX) / (ballDirectionX * ballVelocityX);
    
        // Calculate new Z position considering reflections
        let newBallPosZ = ballPosZ + ballDirectionZ * ballVelocityZ * timeToPaddle;
    
        // Wall bounces
        const fieldHalfWidth = FIELD_DIMENSION_Z / 2;
        while (newBallPosZ + BALL_RADIUS >= fieldHalfWidth || newBallPosZ - BALL_RADIUS <= -fieldHalfWidth) {
            if (newBallPosZ + BALL_RADIUS >= fieldHalfWidth) {
                newBallPosZ = 2 * fieldHalfWidth - newBallPosZ - 2 * BALL_RADIUS;
            } else if (newBallPosZ - BALL_RADIUS <= -fieldHalfWidth) {
                newBallPosZ = -2 * fieldHalfWidth - newBallPosZ + 2 * BALL_RADIUS;
            }
            ballDirectionZ = -ballDirectionZ;
        }
    
        return newBallPosZ;
    }

    #addNoiseToPrediction(nextZPos) {
        let noiseLevel = 0;
        console.log(`${this.#difficulty}`);
        switch (this.#difficulty) {
            case 1:
                noiseLevel = 0.7;
                break;
            case 2:
                noiseLevel = 0.4;
                break;
            case 3:
                noiseLevel = 0;
                break;
            default:
                noiseLevel = 0;
        }
         // Generate noise from -noiseLevel to noiseLevel
        let noise = (Math.random() - 0.5) * 2 * noiseLevel;
        return nextZPos + noise;
    }

    // drawTrajectory(points) {
    //     if (this.#trajectoryLine) {
    //         this.#scene.remove(this.#trajectoryLine);
    //     }

    //     const geometry = new THREE.BufferGeometry().setFromPoints(points);
    //     const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    //     this.#trajectoryLine = new THREE.Line(geometry, material);

    //     this.#scene.add(this.#trajectoryLine);
    // }

    async moveToTargetedPos(nextZPos) {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const timeout = 2000; // Maximum time to move the paddle (in ms)
        const startTime = Date.now();
    
        if (nextZPos < this.#paddle.getPosZ()) {
            document.dispatchEvent(eventPressP);
            while (nextZPos < this.#paddle.getPosZ()) {
                if (Date.now() - startTime > timeout) break;
                await delay(10);
            }
            document.dispatchEvent(eventReleaseP);
        } else if (nextZPos > this.#paddle.getPosZ()) {
            document.dispatchEvent(eventPressM);
            while (nextZPos > this.#paddle.getPosZ()) {
                if (Date.now() - startTime > timeout) break;
                await delay(10);
            }
            document.dispatchEvent(eventReleaseM);
        }
    }
    
    async makeDecision() {
        if (!this.#lastStateRefresh || Date.now() - this.#lastStateRefresh >= 1000) {
            this.#lastStateRefresh = Date.now();
            let nextZPos = await this.#predictBallTrajectory();
            nextZPos = this.#addNoiseToPrediction(nextZPos);
            await this.moveToTargetedPos(nextZPos);
        }
    }
}