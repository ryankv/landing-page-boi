import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import equirectangular from './textures/kairon-4.png'

const params = {
    envMap: 'PNG',
    roughness: 0.0,
    metalness: 0.8,
    exposure: 1.0,
    debug: false,
};

let camera, scene, renderer, controls;
let torusMesh, planeMesh;
let pngCubeRenderTarget, exrCubeRenderTarget;
let pngBackground, exrBackground;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0, 120 );

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff, 0);

    //

    let geometry = new THREE.TorusKnotGeometry( 18, 8, 150, 20 );
    let material = new THREE.MeshStandardMaterial( {
        metalness: params.roughness,
        roughness: params.metalness,
        envMapIntensity: 1.0
    } );

    torusMesh = new THREE.Mesh( geometry, material );
    torusMesh.scale.set(0.7,0.7,0.7);  
    scene.add( torusMesh );

    geometry = new THREE.PlaneGeometry( 200, 200 );
    material = new THREE.MeshBasicMaterial();

    planeMesh = new THREE.Mesh( geometry, material );
    planeMesh.position.y = - 50;
    planeMesh.rotation.x = - Math.PI * 0.5;
    scene.add( planeMesh );

    THREE.DefaultLoadingManager.onLoad = function ( ) {

        pmremGenerator.dispose();

    };

    new THREE.TextureLoader().load( equirectangular, function ( texture ) {

        texture.encoding = THREE.sRGBEncoding;

        pngCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );

        pngBackground = pngCubeRenderTarget.texture;

        texture.dispose();

    });

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;

    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 50;
    controls.maxDistance = 300;

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    document.body.appendChild( renderer.domElement );
    renderer.setSize( width, height );

}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {

    torusMesh.material.roughness = params.roughness;
    torusMesh.material.metalness = params.metalness;

    let newEnvMap = torusMesh.material.envMap;
    let background = scene.background;

    newEnvMap = pngCubeRenderTarget ? pngCubeRenderTarget.texture : null;
    background = pngBackground;

    if ( newEnvMap !== torusMesh.material.envMap ) {

        torusMesh.material.envMap = newEnvMap;
        torusMesh.material.needsUpdate = true;

        planeMesh.material.map = newEnvMap;
        planeMesh.material.needsUpdate = true;

    }

    torusMesh.rotation.y += 0.005;
    planeMesh.visible = params.debug;

    scene.background = background;
    renderer.toneMappingExposure = params.exposure;

    renderer.render( scene, camera );

}
