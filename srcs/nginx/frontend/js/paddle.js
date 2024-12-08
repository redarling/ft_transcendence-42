import * as THREE from 'three';

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

    setPosZ(z) {
        this.#mesh.position.z = z;
    }
}