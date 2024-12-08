const eventPressP = new KeyboardEvent('keydown', {
    key: 'p',
    code: 'KeyP',
    keyCode: 80,
    bubbles: true,
    cancelable: true
});

const eventReleaseP = new KeyboardEvent('keyup', {
    key: 'p',
    code: 'KeyP',
    keyCode: 80,
    bubbles: true,
    cancelable: true
});

const eventPressM = new KeyboardEvent('keydown', {
    key: 'm',
    code: 'KeyM',
    keyCode: 77,
    bubbles: true,
    cancelable: true
});

const eventReleaseM = new KeyboardEvent('keyup', {
    key: 'm',
    code: 'KeyM',
    keyCode: 77,
    bubbles: true,
    cancelable: true
});

import { FIELD_DIMENSION_Z } from "./game.js";
import { PADDLE_DIMENSION_Z } from "./game.js";

const QMAP_PATH = "../public/easy.json";

const TRAINING = false;
  
export class AI {
    constructor(paddle) {
        if (TRAINING === true) {
            this.Q = {};
        } else {
            this.loadQMapFromFile(QMAP_PATH); // TODO: Make 3 buttons to chose the difficulty of the bot (easy to do)
        }
        this.alpha = 0.4; // Increased learning rate
        this.gamma = 0.7; // Discount factor
        this.epsilon = 1; // Exploration rate
        this.epsilonDecay = 0.99; // Decay rate for epsilon
        this.minEpsilon = 0.01; // Minimum value for epsilon
        this.paddle = paddle;
        this.timesQTableUpdated = 0;
    }

    saveQMapToFile(filename) {
        const qMapJson = JSON.stringify(this.Q);
        const blob = new Blob([qMapJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadQMapFromFile(filePath) {
        try {
            const response = fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const qMapJson = response.json();
            this.Q = qMapJson;
        } catch (error) {
            console.error('Error loading Q-map:', error);
            this.Q = {}; // Initialize with an empty Q-table if loading fails
        }
    }

    decreaseExplorationRate() {
        this.epsilon = Math.max(this.epsilon * this.epsilonDecay, this.minEpsilon);
    }

    performAction(action) {
        if (action === 0) { // Move up
            if (this.paddle.getPosZ() - (PADDLE_DIMENSION_Z / 2) > -(FIELD_DIMENSION_Z / 2)) {
                document.dispatchEvent(eventPressP);
                setTimeout(() => {
                    document.dispatchEvent(eventReleaseP);
                }, 100);
            }
        } else if (action === 1) { // Move down
            if (this.paddle.getPosZ() + (PADDLE_DIMENSION_Z / 2) < FIELD_DIMENSION_Z / 2) {
                document.dispatchEvent(eventPressM);
                setTimeout(() => {
                    document.dispatchEvent(eventReleaseM);
                }, 100);
            }
        }
    }

    // Choose an action using epsilon-greedy policy
    chooseAction(state) {
        if (!this.Q[state]) { // the state has not been explored yet 
            this.Q[state] = [0, 0, 0];
        }

        this.decreaseExplorationRate();

        if (TRAINING === true) {
            if (Math.random() < this.epsilon) { // choosing to explore (random choice)
                return Math.floor(Math.random() * 2);
            }
        }
        return this.Q[state].indexOf(Math.max(...this.Q[state]));
    }

    // Update the Q-table
    updateQ(state, action, reward, nextState) {        
        if (!this.Q[nextState]) this.Q[nextState] = [0, 0, 0];
        
        const maxNextQ = Math.max(...this.Q[nextState]);
        const oldQ = this.Q[state][action];
        
        // Q-learning update rule
        this.Q[state][action] = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
        if (TRAINING === true) {
            this.timesQTableUpdated++;
            console.log(this.timesQTableUpdated);
            if (this.timesQTableUpdated === 100000) {
                this.saveQMapToFile("easy");
            }
        }
    }
}