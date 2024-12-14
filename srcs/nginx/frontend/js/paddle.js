import * as THREE from 'three';
// import { PADDLE_DIMENSION_Z } from './game'; // circular dependency
const PADDLE_DIMENSION_Z = 1; // solution (circular dependencie)
// TODO: Create a file having all the game settings to avoid similar problems in the future.

export class Paddle {
    #scene;
    #mesh;
    #speed;
    #posX;
    #posY;
    #posZ;
    #dimensionX;
    #dimensionY;
    #dimensionZ;
    #color;

    constructor({scene, speed, posX, posY, posZ, dimensionX, dimensionY, dimensionZ, color}) {
        this.#scene = scene;
        this.#speed = speed;
        this.#posX = posX;
        this.#posY = posY;
        this.#posZ = posZ;
        this.#dimensionX = dimensionX;
        this.#dimensionY = dimensionY;
        this.#dimensionZ = dimensionZ;
        this.#color = color;
        this.initMesh();
    }

    initMesh() {
        const paddleGeometry = new THREE.BoxGeometry(this.#dimensionX, this.#dimensionY, this.#dimensionZ);
        const paddleMaterial = new THREE.MeshStandardMaterial( { color: this.#color } );
        this.#mesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.#mesh.position.set(this.#posX, this.#posY, this.#posZ);
        this.#scene.add(this.#mesh);
    }

    moveUp() {
        this.#mesh.position.z -= this.#speed;
    }

    moveDown() {
        this.#mesh.position.z += this.#speed;
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

    getUpperEdgeZPos() {
        return this.#mesh.position.z - (PADDLE_DIMENSION_Z / 2);
    }

    getLowerEdgeZPos() {
        return this.#mesh.position.z + (PADDLE_DIMENSION_Z / 2);
    }

    setPosZ(z) {
        this.#mesh.position.z = z;
    }
}