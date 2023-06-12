import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from './pointerlock.js';
import textures from './payloads/textureinfo.js';
import gltfObjs from './payloads/modelsinfo.js';
import spotLigthtInfo from './payloads/lightinfo.js';
"use strict";

THREE.Cache.enabled = true;
let controls = {};
let player = {
    height: .65,
    turnSpeed: .03,
    speed: .12,
    jumpHeight: .16,
    gravity: .005,
    velocity: 0,
    playerJumps: false
};
let isDragging = false;
let preventKeyFlag = true;
let paintingObject = {};
let pedeObject = {};
let lightObject = {};
let scaleFactor;
let scaleFactorArr = [];
let mergeArr = [];
let infoArr = [];
let loadingCount = 0;

const loadingBoxGroup = new THREE.Group(); 
const objGroup = new THREE.Group();
// const pedeGroup = new THREE.Group();
const paintingGroup = new THREE.Group();
const spotLightGroup = new THREE.Group();
const wallGroup = new THREE.Group();

const overlay = document.createElement("div");
    overlay.setAttribute('class', 'xyz-loading')
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.height = "calc(var(--vh, 1vh) * 100)";
    overlay.style.zIndex = 10000; 
    overlay.style.background = "rgba(255, 255, 255, 0.9)";
    overlay.style.pointerEvents = "none";
    overlay.style.transition = 'all 1.5s linear';
    overlay.style.display = 'block'
    overlay.style.opacity = '1'
    
    let timer1 = setTimeout(() => {
        overlay.style.opacity = '0'
        clearTimeout(timer1)

    }, 1500);
    let timer2 = setTimeout(()=>{
        overlay.style.display = 'none'
        clearTimeout(timer2)

    }, 2500)
const topDiv = document.getElementById('xyz-gallery-gui');

const blankPage = document.createElement('div');
    blankPage.setAttribute('class', 'xyz-none-landscape');

let warn = document.createElement('h3');
    warn.innerHTML = `Looks good in portrait mode!`;

blankPage.insertAdjacentElement('beforeend', warn);

const backDrop = document.createElement('div');
    backDrop.setAttribute('class', 'xyz-drop');

document.body.appendChild( overlay );
document.body.appendChild( backDrop );
document.body.insertAdjacentElement('afterbegin', blankPage );

/** ====================================== basic elements ============================================ */
const forBind = {
    topNav : [ 'pause', 'close'],
    menuTitle : 'Sanctum',
    menuOne : ['Immersive Experience', 'from screenxyz'],
    menuTwo : ['> Instructions <', 'Touch Arrow-Icon or W/A/S/D<br />to Walk Around', 'Click or Touch to Look Around']
}
const topNav = document.createElement('div');
        topNav.setAttribute('class', 'xyz-top-nav');
        forBind.topNav.forEach((e)=>{
            const div = document.createElement('div');
                div.setAttribute('class', 'xyz-top-nav-box');
            const span = document.createElement('span');
                span.setAttribute('class', 'material-icons-outlined');
                span.innerHTML = e;
            div.insertAdjacentElement('beforeend', span);
            topNav.insertAdjacentElement('beforeend', div);
        });

topDiv.insertAdjacentElement('beforeend', topNav);

const menuTop = document.createElement('div');
        menuTop.setAttribute('id', 'xyz-gallery-menu');
const menuContainer = document.createElement('div');
        menuContainer.setAttribute('id', 'xyz-content-container');
const menuContent = document.createElement('div');
        menuContent.setAttribute('id', 'xyz-gallery-content');

    const menuTitle = `<div class="xyz-gallery-title"><h1 class="xyz-main">${forBind.menuTitle}</h1></div>`;
    menuContent.insertAdjacentHTML('beforeend', menuTitle);

    const menuOne = `<div><p>${forBind.menuOne[0]}</p><p>${forBind.menuOne[1]}</p></div>`;
    menuContent.insertAdjacentHTML('beforeend', menuOne);

    const menuTwoDiv = document.createElement('div');
        forBind.menuTwo.forEach((e)=>{
            const p = document.createElement('p');
                p.setAttribute('class', 'xyz-instructions');
                p.innerHTML = e;
            menuTwoDiv.insertAdjacentElement('beforeend', p);
        });
    menuContent.insertAdjacentElement('beforeend', menuTwoDiv);

    const menuBttn = `<div id="xyz-play-button"><p>..LOADING..</p></div>`;
    menuContent.insertAdjacentHTML('beforeend', menuBttn);

menuContainer.insertAdjacentElement('beforeend', menuContent);
menuTop.insertAdjacentElement('beforeend', menuContainer);
topDiv.insertAdjacentElement('beforeend', menuTop);

const keysDiv = document.createElement('div');
        keysDiv.setAttribute('class', 'xyz-keys');
const keyInsert = `<div class="xyz-up arr" data-arrow="ArrowUp"><span class="material-icons-outlined" data-arrow="ArrowUp">arrow_upward</span></div><br />
<div class="xyz-left arr" data-arrow="ArrowLeft"><span class="material-icons-outlined" data-arrow="ArrowLeft">arrow_back</span></div>  
<div class="xyz-down arr" data-arrow="ArrowDown"><span class="material-icons-outlined" data-arrow="ArrowDown">arrow_downward</span></div>
<div class="xyz-right arr" data-arrow="ArrowRight"><span class="material-icons-outlined" data-arrow="ArrowRight">arrow_forward</span></div>
<br /><div class="xyz-space arr" data-arrow="space"></div>`;
keysDiv.insertAdjacentHTML('beforeend', keyInsert);
topDiv.insertAdjacentElement('beforeend', keysDiv);

const workInfoDiv = `<div class="xyz-work-info" style="display: none;"><div class="small-txt"><h3></h3><span class="material-icons-outlined info-full">open_in_full</span><p></p><p></p><p></p></div><div class="big-txt" style="display:none"><h3></h3><span class="material-icons-outlined info-close">close_fullscreen</span><p></p><p></p><p></p><p></p></div></div>`;
topDiv.insertAdjacentHTML('beforeend', workInfoDiv);

const canvasHtml = `<div class="xyz-canvas"></div>`;
topDiv.insertAdjacentHTML('beforeend', canvasHtml);

const xyzCanvas = document.querySelector('.xyz-canvas');

/** ====================================== scene camera renderer ============================================ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000 
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Scene:Setup
scene.background = new THREE.Color('gray');

// Camera:Setup
camera.position.set(0, player.height, 45); // -5
camera.lookAt(new THREE.Vector3(0, player.height, 0));
scene.add(camera);

const previousPosition = camera.position.clone(); // Initialize previousPosition

// Renderer:Setup
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
// append renderer to canvas!
xyzCanvas.appendChild( renderer.domElement );

const controller = new PointerLockControls( camera, document.body );

/** ====== Generate a resize event if the device doesn't do it ====== */  
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener("orientationchange", () => window.dispatchEvent(new Event("resize")), false);

window.addEventListener('resize', () => setScreenSize());
if(window.innerWidth <= window.innerHeight) {
    setScreenSize();//portrait
} else {
    setScreenSize();//landscape
};

/** =========================================== create painting ================================================== */
// create painting function
function createPainting(imageURL, width, height, position, lr) {
    const textureLoader = new THREE.TextureLoader(); 
    const paintingTexture = textureLoader.load(imageURL); 
    const paintingMaterial = new THREE.MeshBasicMaterial({
        map: paintingTexture,
        depthWrite: false,
    });
    const paintingGeometry = new THREE.PlaneGeometry(width, height); 
    const painting = new THREE.Mesh(paintingGeometry, paintingMaterial); 
    painting.position.set(position.x, position.y, position.z); 
    if(lr === 'left'){
        painting.rotation.y = Math.PI / 2; // 90 degrees. 
    }else if(lr === "right"){
        painting.rotation.y = -Math.PI / 2; // 90 degrees.
    }else if(lr === "back"){
        painting.rotation.y = Math.PI; //180 degrees
    }else{
        painting.rotation.y = 0;
    }
    painting.customProperty = 'paintingss';
    painting.receiveShadow = true;
    painting.castShadow = true;
    return painting; // this function returns the paintings
};
// paintings.forEach(async(e, i)=>{
//     paintingObject['painting'+ i] = createPainting(e.poster, e.w, e.h, e.position, e.lr)
// });
// // scene add paintings
// for(const painting of Object.values(paintingObject)){
//     paintingGroup.add(painting)
// }
// paintings.forEach((e,i)=>{
//     paintingGroup.children[i].userData = {...e.userData};
// })
// scene.add(paintingGroup);

/** ================================================ loader ======================================================== */
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/examples/jsm/libs/draco/' );
loader.setDRACOLoader( dracoLoader );

function modelLoader(model, position){
    return new Promise((resolve, reject) => {
    loader.load(
        model.obj, 
        (gltf)=>{
            let box = new THREE.Box3().setFromObject( gltf.scene );
            let size = box.getSize( new THREE.Vector3() );
                scaleFactor = 10 / Math.max(size.x, size.y, size.z);
            gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

            objGroup.add(gltf.scene);

            gltf.scene.traverse(function(object){
                if ( object.isMesh ) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                } else {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            })
            gltf.scene.castShadow = true;
            gltf.scene.receiveShadow = true;
            gltf.scene.name = model.userdata.info.title;
            gltf.scene.userData = model.userdata;
            gltf.scene.number = model._id;
            gltf.scene.scaleFactor = scaleFactor;
            gltf.scene.children[0].customProperty = 'obj';
            gltf.scene.position.set(position.x, position.y, position.z);
            objGroup.customProperty = 'objsGroup';
            scene.add(objGroup); 
    
            resolve(gltf.scene); // Resolve the promise when the model has loaded

        }, ( xhr ) => {
            let loadCounter = ( xhr.loaded / xhr.total * 100 );
            if(loadCounter === 10){
                loadingBoxGroup.add(loadingBox(position));
                scene.add(loadingBoxGroup);
            } 
            else if(loadCounter === 100){
                scene.remove(loadingBoxGroup);
            } 
        },  
        function ( error ) {
            console.error( error );
            reject(error);
        });
    
        function loadingBox(position){
            const boxGeometry1 = new THREE.BoxGeometry(1, 1, 1);
            const boxMaterial1 = new THREE.MeshBasicMaterial({ color: "white", wireframe: false });
            const box1 = new THREE.Mesh(boxGeometry1, boxMaterial1);
            box1.scale.set(0.25,0.25,0.25);
            box1.position.set(position.x, position.y, position.z);
            box1.name = "loadingBox"
            return box1;
        }    
    })
};
function modelDispose(target){
    if (target !== null) scene.remove(target);
        if (target.geometry !== undefined && target.geometry !== null) target.geometry.dispose();
        if (target.material !== undefined && target.material !== null) target.material.dispose();
        if (target.material.map !== undefined && target.material.map !== null) target.material.map.dispose();
}

gltfObjs.forEach((e, i)=>{
    modelLoader(e, e.position)
        .then((v)=>{
            infoArr.push(v.userData);
            mergeArr.push(v.position); 
            scaleFactorArr.push(v.scaleFactor);

            if(v.name === 'object03') {
                v.rotation.y = -Math.PI / 2;
                v.scale.set(4,4,4);
            }
            loadingCount += 1;
        })
});


for(let i=0; i<spotLigthtInfo.length; i++){
    const e = spotLigthtInfo[i];
    lightObject['spot'+ i] = createSpotlight(e.position, e.l, objGroup.children[i], gltfObjs[i].position, e.shadow);
}

for(const spot of Object.values(lightObject)){
    spotLightGroup.add(spot);
    scene.add(spot.target)
}
scene.add(spotLightGroup);


/** ====================================== pedestal ==================================================== */
function createPedestal(position, scaleFactor, pHeight) {
    const boxMaterial = new THREE.MeshLambertMaterial({ color : 0xcfcfcf });
    const boxGeometry = new THREE.BoxGeometry(scaleFactor, pHeight, scaleFactor);
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial); 
    boxMesh.position.set(position.x, position.y -2, position.z);
    boxMesh.name = 'pedestal';
    boxMesh.customProperty = 'pedestal';
    boxMesh.receiveShadow = true;
    boxMesh.castShadow = true;
    return boxMesh; 
}
// gltfObjs.forEach((e,i)=>{
//     pedeObject['pede'+ i] = createPedestal(e.position, scaleFactorArr[i], 4)
// })
// // scene add paintings
// for(const pede of Object.values(pedeObject)){
//     pedeGroup.add(pede)
// }
// scene.add(pedeGroup);

/**============================================ lights ========================================================*/
const ambLight = new THREE.AmbientLight(0xfffff0, 0.1);
scene.add(ambLight);

const light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
scene.add(light);

// Spotlights can be used to simulate ceiling-mounted lights or track lights that focus on specific areas or artworks.
function createSpotlight(position, intensity, targetPosition, emer, shadow) {
    const spotlight = new THREE.SpotLight(0xffffff, intensity);
    spotlight.position.set(position.x, position.y, position.z);
    targetPosition ? spotlight.target.position.copy(targetPosition.position) : spotlight.target.position.copy(emer); 
    // spotlight.target.position.copy(emer); 
    shadow ? spotlight.castShadow = true : spotlight.castShadow = false;
    spotlight.angle = Math.PI / 3; 
    spotlight.penumbra = 1; 
    spotlight.decay = 1.5; 
    spotlight.distance = 40; 
    spotlight.shadow.mapSize.width = 1024; 
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 0.3;
    spotlight.shadow.camera.far = 500;
    return spotlight; // this function returns the spotlight
};

// const getWallTargets = scene.getObjectsByProperty('customProperty', 'paintingss');
// const getPedeTargets = scene.getObjectsByProperty('customProperty', 'pedestal'); // get name???

/** ============================================= wall, floor, ceiling ================================================= */
function loadTexture(url){
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader(); // create a texture loader
        loader.load(
            url,
            (texture) => {
                resolve(texture);
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    })
};

// Texture of the floor
loadTexture(textures[0].src)
    .then((texture) => {
        const planeGeometry = new THREE.PlaneGeometry(85, 110);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1); //??????????????????

        const material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const floorPlane = new THREE.Mesh(planeGeometry, material);
        floorPlane.receiveShadow = true;
        floorPlane.rotation.x = Math.PI / 2;
        floorPlane.position.y = -Math.PI;
        scene.add(floorPlane);

        loadingCount += 1;
    })
    .catch((error) => console.log(error));

// Create wall material 
loadTexture(textures[1].src)
    .then((resTex)=>{
        resTex.wrapS = THREE.RepeatWrapping;
        resTex.wrapT = THREE.RepeatWrapping;
        resTex.repeat.set(2, 2); //??????????????????
        return resTex;
    })
    .then((wallTexture)=>{
        // Front Wall
        const frontWall = new THREE.Mesh( 
        new THREE.BoxGeometry(60, 30, 0.001), 
        new THREE.MeshLambertMaterial({ map: wallTexture })
        );

        frontWall.position.z = -50; // push the wall forward in the Z axis

        // Left Wall
        const leftWall = new THREE.Mesh( 
        new THREE.BoxGeometry(100, 30, 0.001), 
        new THREE.MeshLambertMaterial({ map: wallTexture }) 
        );

        leftWall.rotation.y = Math.PI / 2; 
        leftWall.position.x = -30; 

        // Right Wall
        const rightWall = new THREE.Mesh( 
        new THREE.BoxGeometry(100, 30, 0.001), 
        new THREE.MeshLambertMaterial({ map: wallTexture })
        );

        rightWall.position.x = 30;
        rightWall.rotation.y = Math.PI / 2; 

        // Back Wall
        const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(60, 30, 0.001),
        new THREE.MeshLambertMaterial({ map: wallTexture })
        );
        backWall.position.z = 50;

        wallGroup.add(frontWall, backWall, leftWall, rightWall); 
        // Enable shadows on objects
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        leftWall.castShadow = true; 
        leftWall.receiveShadow = true;
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        
        loadingCount += 1;
    })
    .catch((err)=> console.log(err));

scene.add(wallGroup); 

// Create the ceiling
loadTexture(textures[2].src)// load the image/texture
    .then((ceilingTexture)=>{
        ceilingTexture.wrapS = THREE.RepeatWrapping;
        ceilingTexture.wrapT = THREE.RepeatWrapping;
        ceilingTexture.repeat.set(5, 5);
        const ceilingGeometry = new THREE.PlaneGeometry(100, 110);
        const ceilingMaterial = new THREE.MeshBasicMaterial({ map: ceilingTexture });
        const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceilingPlane.receiveShadow = true;

        ceilingPlane.rotation.x = Math.PI / 2; // 90 degrees
        ceilingPlane.position.y = 15;

        scene.add(ceilingPlane);

        loadingCount += 1;
    })
    .catch((err)=> console.log(err));

/** =============================================== collision detect ===================================================== */
// Loop through each wall and create the bounding box for each wall
async function loopForCollision(){
    for (let i = 0; i < wallGroup.children.length; i++) {
        wallGroup.children[i].BoundingBox = new THREE.Box3();
        wallGroup.children[i].BoundingBox.setFromObject(wallGroup.children[i]);
    }
    for (let i = 0; i < objGroup.children.length; i++) {
        objGroup.children[i].BoundingBox = new THREE.Box3();
        objGroup.children[i].BoundingBox.setFromObject(objGroup.children[i]);
    }
    // for (let i = 0; i < pedeGroup.children.length; i++){
    //     pedeGroup.children[i].BoundingBox = new THREE.Box3();
    //     pedeGroup.children[i].BoundingBox.setFromObject(pedeGroup.children[i]);
    // }
}
function checkCollision() {
    const playerBoundingBox = new THREE.Box3(); 
    const cameraWorldPosition = new THREE.Vector3(); 
    camera.getWorldPosition(cameraWorldPosition); 
    playerBoundingBox.setFromCenterAndSize(
        cameraWorldPosition,
        new THREE.Vector3(1.7, 1.7, 1.7)
    );
    // loop through each wall
    for(let i = 0; i < wallGroup.children.length; i++) {
        const wall = wallGroup.children[i]; // get the wall
            if(playerBoundingBox.intersectsBox(wall.BoundingBox)) {
                return true; 
            }
    }
    for(let i = 0; i < objGroup.children.length; i++) {
        const wall = objGroup.children[i]; // get the wall
            if(playerBoundingBox.intersectsBox(wall.BoundingBox)) {
                return true; 
            }
    }
    // for(let i = 0; i < pedeGroup.children.length; i++){
    //     const wall = pedeGroup.children[i]; 
    //         if(playerBoundingBox.intersectsBox(wall.BoundingBox)){
    //             return true;
    //         }
    // }
    return false; // if it doesn't, return false
}

/** =============================================== user interfaces ===================================================== */
const basicMenu = document.querySelector('#xyz-gallery-menu');
const playButton = document.getElementById('xyz-play-button'); // get the play button from the html
const topNavButton = document.querySelectorAll('.xyz-top-nav div');
const allKeyDiv = document.querySelector('.xyz-keys');
const arrowKeys = document.querySelectorAll('.arr');

if(basicMenu.style.display !== 'none'){
    allKeyDiv.style.pointerEvents = 'none';
    backDrop.classList.add('filtered');
}

playButton.addEventListener('click', ()=>{
    hideMenu();
}); 

topNavButton[0].addEventListener('click', ()=>{
    showMenu();
});
topNavButton[1].addEventListener('click', ()=>{
    window.location.reload();
});

// Hide menu
function hideMenu() {
    isDragging = true;
    preventKeyFlag = false;
    const menu = document.getElementById('xyz-gallery-menu');
    menu.style.display = 'none';
    allKeyDiv.style.pointerEvents = 'auto';
    backDrop.classList.remove('filtered');

}
// Show menu
function showMenu() {
    preventKeyFlag = true;
    const menu = document.getElementById('xyz-gallery-menu');
    menu.style.display = 'block';
    backDrop.classList.add('filtered');
}

// Controls:Listeners
document.addEventListener('keydown', ( e ) => {
    if(preventKeyFlag){
        e.preventDefault();
    }else if(['w','a','s','d','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)){
        controls[e.key] = true;
        switch(e.key){
            case 'w' : 
            case 'ArrowUp' :
                arrowKeys[0].classList.add('pressed');
                break;
            case 'a' :
            case 'ArrowLeft' :
                arrowKeys[1].classList.add('pressed');
                break;
            case 's' :
            case 'ArrowDown' :
                arrowKeys[2].classList.add('pressed');
                break;
            case 'd' :
            case 'ArrowRight' :
                arrowKeys[3].classList.add('pressed');
                break;
        }
    }else if(e.key === " "){
        controls['space'] = true;
        arrowKeys[4].classList.add('pressed');
    }
});
document.addEventListener('keyup', ( e ) => { 
    if(['w','a','s','d','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)){
        controls[e.key] = false;
        switch(e.key){
            case 'w' : 
            case 'ArrowUp' :
                arrowKeys[0].classList.remove('pressed');
                break;
            case 'a' :
            case 'ArrowLeft' :
                arrowKeys[1].classList.remove('pressed');
                break;
            case 's' :
            case 'ArrowDown' :
                arrowKeys[2].classList.remove('pressed');
                break;
            case 'd' :
            case 'ArrowRight' :
                arrowKeys[3].classList.remove('pressed');
                break;
        }
    }else if(e.key === " "){
        controls['space'] = false;
        arrowKeys[4].classList.remove('pressed');
    }
});
allKeyDiv.addEventListener('touchstart', (e)=>{
    e.preventDefault();
    if(!!e.target.dataset.arrow){
        controls[e.target.dataset.arrow] = true;
        switch(e.target.dataset.arrow){
            case 'ArrowUp' :
                arrowKeys[0].classList.add('pressed');
                break;
            case 'ArrowLeft' :
                arrowKeys[1].classList.add('pressed');
                break;
            case 'ArrowDown' :
                arrowKeys[2].classList.add('pressed');
                break;
            case 'ArrowRight' :
                arrowKeys[3].classList.add('pressed');
                break;
            case 'space' :
                arrowKeys[4].classList.add('pressed');
                break;
        }
    }
})
allKeyDiv.addEventListener('touchend', (e)=>{
    e.preventDefault();
    if(!!e.target.dataset.arrow){
        controls[e.target.dataset.arrow] = false;
        switch(e.target.dataset.arrow){
            case 'ArrowUp' :
                arrowKeys[0].classList.remove('pressed');
                break;
            case 'ArrowLeft' :
                arrowKeys[1].classList.remove('pressed');
                break;
            case 'ArrowDown' :
                arrowKeys[2].classList.remove('pressed');
                break;
            case 'ArrowRight' :
                arrowKeys[3].classList.remove('pressed');
                break;
            case 'space' :
                arrowKeys[4].classList.remove('pressed');
                break;
        }
    }
})
allKeyDiv.addEventListener('mousedown', (e)=>{
    e.preventDefault();
    if(!!e.target.dataset.arrow){
        controls[e.target.dataset.arrow] = true;
        switch(e.target.dataset.arrow){
            case 'ArrowUp' :
                arrowKeys[0].classList.add('pressed');
                break;
            case 'ArrowLeft' :
                arrowKeys[1].classList.add('pressed');
                break;
            case 'ArrowDown' :
                arrowKeys[2].classList.add('pressed');
                break;
            case 'ArrowRight' :
                arrowKeys[3].classList.add('pressed');
                break;
            case 'space' :
                arrowKeys[4].classList.add('pressed');
                break;
        }
    }
})
allKeyDiv.addEventListener('mouseup', (e)=>{
    e.preventDefault();
    if(!!e.target.dataset.arrow){
        controls[e.target.dataset.arrow] = false;
        switch(e.target.dataset.arrow){
            case 'ArrowUp' :
                arrowKeys[0].classList.remove('pressed');
                break;
            case 'ArrowLeft' :
                arrowKeys[1].classList.remove('pressed');
                break;
            case 'ArrowDown' :
                arrowKeys[2].classList.remove('pressed');
                break;
            case 'ArrowRight' :
                arrowKeys[3].classList.remove('pressed');
                break;
            case 'space' :
                arrowKeys[4].classList.remove('pressed');
                break;
        }
    }
})
document.querySelector('canvas').addEventListener('mousedown', (e)=>{
    isDragging = true;
    preventKeyFlag ? e.preventDefault : controller.lock();

});
document.addEventListener('mousemove', (e)=>{
    controller.onMouseMove(e)
});
document.addEventListener('mouseup', (e)=>{
    if(isDragging){
        isDragging = false;
        preventKeyFlag ? e.preventDefault : controller.unlock()
    }
});
document.addEventListener('touchstart', (e)=>{
    isDragging = true;
    controller.onTouchMove(e);
});
document.addEventListener('touchend', (e)=>{
    if(isDragging){
        isDragging = false;
        controller.onTouchEnd(e)
    }
});
// setTimeout(()=>{
//     paintingGroup.children.forEach((e,i)=>{
//         mergeArr.push(e.position);
//         infoArr.push(e.userData);
//     })
// }, 1000);

/** =============================================== functions ===================================================== */
function setScreenSize() {
    let vh = window.innerHeight * 0.01; 
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
};

function displayPaintingInfo(info) {
    const infoElement = document.querySelector('.xyz-work-info');
    const smallTxt = document.querySelector('.small-txt');

    // Update existing elements instead of replacing the whole innerHTML
    const title = smallTxt.querySelector('h3');
    const artist = smallTxt.querySelector('p:nth-child(3)'); // Adjust according to actual DOM structure
    const year = smallTxt.querySelector('p:nth-child(4)'); // Adjust according to actual DOM structure
    const mate = smallTxt.querySelector('p:nth-child(5)'); // Adjust according to actual DOM structure

    title.textContent = info.title;
    artist.textContent = 'artist : ' + info.artist;
    year.textContent = 'year : ' + info.year;
    mate.textContent = 'matter : ' + info.mate;

    infoElement.style.display = 'block';

    const fullbttn = document.querySelector('.info-full');
    fullbttn.addEventListener('click', ()=>{
        delCache();
        const bigTxt = document.querySelector('.big-txt');
        smallTxt.style.display = 'none';
        infoElement.classList.add('xyz-enlarge');

        const title = bigTxt.querySelector('h3');
        const artist = bigTxt.querySelector('p:nth-child(3)'); // Adjust according to actual DOM structure
        const year = bigTxt.querySelector('p:nth-child(4)'); // Adjust according to actual DOM structure
        const mate = bigTxt.querySelector('p:nth-child(5)'); // Adjust according to actual DOM structure
        const desc = bigTxt.querySelector('p:nth-child(6)'); // Adjust according to actual DOM structure

        title.textContent = info.title;
        artist.textContent = 'artist : ' + info.artist;
        year.textContent = 'year : ' + info.year;
        mate.textContent = 'matter : ' + info.mate + "\n\n";
        desc.textContent = "introduction : \n" + info.desc;

        bigTxt.style.display = 'block';

        const clsbttn = document.querySelector('.info-close');
        clsbttn.addEventListener('click', ()=>{
            delCache();
            infoElement.classList.remove('xyz-enlarge');
            bigTxt.style.display = 'none';
            smallTxt.style.display = 'block';
        })
    })
};

function hidePaintingInfo() {
    const infoElement = document.querySelector('.xyz-work-info');
    infoElement.style.display = 'none';
}

function delCache(){
    caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
            return caches.delete(key);
        }));
    });
}

function informDisplay() {
    const distanceThreshold = 17; // Set the distance threshold for displaying the painting information

    let shouldHide = true;

    mergeArr.forEach((e, i) => { // mergeArr have position inform
        let distance = camera.position.distanceTo(e);

        if(distance < distanceThreshold) {
            displayPaintingInfo(infoArr[i].info);
            shouldHide = false; // If we displayed info, we should not hide
        }
    });

    if(shouldHide) {
        hidePaintingInfo();
    }
};

function control() {
    // get the direction that the camera is pointing
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // we only need the x and z components for a horizontal movement
    const normalizedDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();

    if(controls.w || controls.ArrowUp){ // w
        camera.position.add(normalizedDirection.multiplyScalar(player.speed));
    }
    if(controls.s || controls.ArrowDown){ // s
        camera.position.add(normalizedDirection.multiplyScalar(-player.speed));
    }

    // for side movement, rotate the direction vector by 90 degrees around the y axis
    const sideDirection = normalizedDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

    if(controls.a || controls.ArrowLeft){ // a
        camera.position.add(sideDirection.multiplyScalar(player.speed));
    }
    if(controls.d || controls.ArrowRight){ // d
        camera.position.add(sideDirection.multiplyScalar(-player.speed));
    }
    if(controls.space) { // space
        if(player.jumps) return false;
        player.jumps = true;
        player.velocity = -player.jumpHeight;
    }
}
function octaAnimation(){
    if(objGroup.getObjectByName("object02")){
        const to = objGroup.getObjectByName("object02");
        to.rotation.y += 0.001; // slowly rotate the model
        to.position.y = -9 + Math.sin(Date.now() / 1000) * 1; // slowly move up and down
    }
}

function ixMovementUpdate() {
    player.velocity += player.gravity;
    camera.position.y -= player.velocity;
    
    if(camera.position.y < player.height) {
        camera.position.y = player.height;
        player.jumps = false;
    }
}
function update() {
    previousPosition.copy(camera.position); 
    control();
    ixMovementUpdate();
    octaAnimation();
}  
function render() {
    renderer.render(scene, camera);
} 
async function loop() {
    if(basicMenu.style.display !== 'none'){
        if(loadingCount >= 4) {
            playButton.textContent = 'EXPLORE';
            playButton.style.pointerEvents = 'auto';
        } else {
            playButton.textContent = '..LOADING..';
            playButton.style.pointerEvents = 'none';
        } 
    }
    await loopForCollision();
    if (checkCollision()) {
        camera.position.copy(previousPosition);
    } 
    informDisplay();
    requestAnimationFrame(loop);

    update();
    render();
}  
loop();





