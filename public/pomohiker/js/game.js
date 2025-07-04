// import * as THREE from 'three';
import * as THREE from '../../../node_modules/three/build/three.module.js'; // relative URL

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    console.log('Game initialized with canvas:', this.canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(renderer.domElement);
  }
}
