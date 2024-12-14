import * as THREE from 'three';

export class Ball {
    #scene;
    #radius;
    #mesh; // it stores the actual position
    #directionX;
    #directionZ;
    #velocityX;
    #velocityZ;
    #soundEffect;
    #timesHit;
    #initialPosX;
    #initialPosY;
    #initialPosZ;
    #initialVelocityX;
    #initialVelocityZ;
    #kickOffTimeOut;
    #kickOffFlag;
    #velocityMultiplier;

    constructor({scene, radius, posX, posY, posZ, velocity, soundEffectPath, texturePath, kickOffTimeOut, velocityMultiplier}) {
        this.#scene = scene;
        this.#radius = radius;
        this.#directionX = 1; // To change if we want someone to serve
        this.#directionZ = 1;
        this.#velocityX = velocity;
        this.#velocityZ = velocity;
        this.#soundEffect = new Audio(soundEffectPath);
        this.#timesHit = 0;
        this.#initialPosX = posX;
        this.#initialPosY = posY;
        this.#initialPosZ = posZ;
        this.#initialVelocityX = velocity;
        this.#initialVelocityZ = velocity;
        this.initMesh(posX, posY, posZ, texturePath);
        this.#kickOffTimeOut = kickOffTimeOut;
        this.#velocityMultiplier = velocityMultiplier;
        this.#kickOffFlag = false;
    }

    initMesh(posX, posY, posZ, texturePath) {
        const textureLoader = new THREE.TextureLoader();
        const ballTexture = textureLoader.load(texturePath);
        const ballGeometry = new THREE.SphereGeometry(this.#radius, 16, 8);
        const ballMaterial = new THREE.MeshStandardMaterial( { map: ballTexture } );
        this.#mesh = new THREE.Mesh(ballGeometry, ballMaterial);
        this.#scene.add(this.#mesh);
        this.#mesh.position.set(posX, posY, posZ);
    }

    move() {
        if (!this.#kickOffFlag) {
            this.#mesh.position.x += this.#velocityX * this.#directionX;
            this.#mesh.position.z += this.#velocityZ * this.#directionZ;
        }
    }

    reset() {
        this.#mesh.position.x = this.#initialPosX;
        this.#mesh.position.y = this.#initialPosY;
        this.#mesh.position.z = this.#initialPosZ;
        this.#velocityX = this.#initialVelocityX;
        this.#velocityZ = this.#initialVelocityZ;
        this.#timesHit = 0;
        this.#kickOffFlag = true;
        setTimeout(() => {
            this.#kickOffFlag = false;
        }, this.#kickOffTimeOut);
    }
    
    switchDirectionZ() {
        this.#directionZ *= -1;
    }

    switchDirectionX() {
        this.#directionX *= -1;
    }

    handlePaddleHit(hitLeftPaddle) {
        // A trick to fix this bug: https://i.sstatic.net/88U9H.gif
        // To resolve it, we simply check if the ball's direction matches the paddle it hits.
        // It's impossible for the ball to be moving left and hit the right paddle.
        if (hitLeftPaddle && this.#directionX === -1 || !hitLeftPaddle && this.#directionX === 1) {
            this.#directionX *= -1;
            this.#timesHit += 1;

            if (this.#timesHit % 3 === 0) {
                this.#velocityX *= this.#velocityMultiplier;
                this.#velocityZ *= this.#velocityMultiplier;
            }

            if (this.#soundEffect) {
                this.#soundEffect.play();
            }
        }
    }

    getPosX() {
        return this.#mesh.position.x;
    }

    getPosY() {
        return this.#mesh.position.y;
    }

    getPosZ() {
        return this.#mesh.position.z;
    }

    getDirectionX() {
        return this.#directionX;
    }

    getDirectionZ() {
        return this.#directionZ;
    }

    getVelocityX() {
        return this.#velocityX;
    }

    getVelocityZ() {
        return this.#velocityZ;
    }
}