import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class Score {
    #scene;
    #fontLoader;
    #loadedFont;
    #meshLeft;
    #meshRight;
    #scoreLeft;
    #scoreRight;
    #scoreLeftPos;
    #scoreRightPos;
    #fontPath;
    #fontSize;
    #fontDepth;
    #color;

    constructor({ scene, scoreLeftPos, scoreRightPos, fontPath, fontSize, fontDepth, color }) {
        this.#scene = scene;
        this.#meshLeft = {mesh: null};
        this.#meshRight = {mesh: null};
        this.#scoreLeft = 0;
        this.#scoreRight = 0;
        this.#scoreLeftPos = scoreLeftPos;
        this.#scoreRightPos = scoreRightPos;
        this.#fontPath = fontPath;
        this.#fontSize = fontSize;
        this.#fontDepth = fontDepth;
        this.#color = color;
        this.init();
    }

    init() {
        this.#fontLoader = new FontLoader();
        this.#fontLoader.load(this.#fontPath, (loadedFont) => {
            this.#loadedFont = loadedFont;
            this.loadText(this.#scoreLeft.toString(), this.#meshLeft, this.#scoreLeftPos);
            this.loadText(this.#scoreRight.toString(), this.#meshRight, this.#scoreRightPos);
        });
    }

     // Can be optimized by not recreating a mesh everytime?
    loadText(scoreStr, scoreMesh, scorePos) {

        if (scoreMesh.mesh) { // destroy the current score mesh so we can recreate it with the updated score
            this.#scene.remove(scoreMesh.mesh);
            scoreMesh.mesh.geometry.dispose();
            scoreMesh.mesh.material.forEach(material => material.dispose());
        }

        const scoreGeometry = new TextGeometry(scoreStr, {
            font: this.#loadedFont,
            size: this.#fontSize,
            depth: this.#fontDepth
        });

        scoreMesh.mesh = new THREE.Mesh(scoreGeometry, [
            new THREE.MeshPhongMaterial({ color: this.#color }),
            new THREE.MeshPhongMaterial({ color: this.#color })
        ]);

        scoreMesh.mesh.position.set(scorePos.x, scorePos.y, scorePos.z);
        this.#scene.add(scoreMesh.mesh);
    }

    scoreLeft() {
        this.#scoreLeft++;
        this.loadText(this.#scoreLeft.toString(), this.#meshLeft, this.#scoreLeftPos);
    }

    scoreRight() {
        this.#scoreRight++;
        this.loadText(this.#scoreRight.toString(), this.#meshRight, this.#scoreRightPos);
    }

    getScoreLeft() {
        return this.#scoreLeft;
    }

    getScoreRight() {
        return this.#scoreRight;
    }
}
