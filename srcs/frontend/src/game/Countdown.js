import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class Countdown {
    #scene;
    #fontLoader;
    #loadedFont;
    #mesh;
    #fontPath;
    #fontSize;
    #fontDepth;
    #color;
    #timeRemaining;

    constructor({ scene, fontPath, fontSize, fontDepth, color }) {
        this.#scene = scene;
        this.#fontPath = fontPath;
        this.#fontSize = fontSize;
        this.#fontDepth = fontDepth;
        this.#color = color;

        this.#mesh = { mesh: null };
        this.#timeRemaining = 4;

        this.init();
    }

    init() {
        this.#fontLoader = new FontLoader();
        this.#fontLoader.load(this.#fontPath, (loadedFont) => {
            this.#loadedFont = loadedFont;
            this.loadText(this.#timeRemaining.toString(), this.#mesh, { x: 0, y: 0, z: 0 });

            this.startCountdown();
        });
    }

    loadText(textStr, meshObj, position) {
        if (meshObj.mesh) {
            this.#scene.remove(meshObj.mesh);
            meshObj.mesh.geometry.dispose();
            meshObj.mesh.material.forEach(material => material.dispose());
        }

        const geometry = new TextGeometry(textStr, {
            font: this.#loadedFont,
            size: this.#fontSize,
            depth: this.#fontDepth
        });

        meshObj.mesh = new THREE.Mesh(geometry, [
            new THREE.MeshPhongMaterial({ color: this.#color }),
            new THREE.MeshPhongMaterial({ color: this.#color })
        ]);

        meshObj.mesh.position.set(position.x, position.y, position.z);
        this.#scene.add(meshObj.mesh);
    }

    startCountdown() {
        const interval = setInterval(() => {
            if (this.#timeRemaining > 1) {
                this.#timeRemaining--;
                this.loadText(this.#timeRemaining.toString(), this.#mesh, { x: 0, y: 0, z: 0 });
            } else {
                clearInterval(interval);
                this.loadText('GO!', this.#mesh, { x: 0, y: 0, z: 0 });
                setTimeout(() => {
                    this.#scene.remove(this.#mesh.mesh);
                }, 500);
            }
        }, 1000);
    }
}
