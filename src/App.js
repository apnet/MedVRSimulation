import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let pickHelper;

let hoverObjectsList = ['Close', 'btn-1', 'btn-2', 'btn-3', 'btn-4', 'Back', 'Next', 'Ok'];  
let lastChooseObj = [undefined, undefined, undefined, undefined, undefined];
let rightChoose = ['btn-2', 'btn-1', 'btn-2', 'btn-2','','','','','btn-1']

let objectsParams = {
	modelPath: './assets/models/',
	body: {
		fileName: 'physician',
		objName: 'Body',
		position: new THREE.Vector3(-2.6, 0.0, -1.0),
		glowPosition: new THREE.Vector3(-2.94, 0.0, -4.93),
		rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
		scale: 	  new THREE.Vector3(0.08, 0.08, 0.08),
		glowScale: 	  new THREE.Vector3(0.087, 0.082, 0.01),
	},	
	interactiveObjectList: [
		{
			id: 4,
			fileName: 'gown',
			objName: 'Robe',
			position: new THREE.Vector3(-5.5, 0.0, -1.5),
			glowPosition: new THREE.Vector3(-5.78, -0.1, -5.32),
			scale: 	  new THREE.Vector3(0.08, 0.08, 0.08),
			glowScale: 	  new THREE.Vector3(0.087, 0.082, 0.01),
		},
		{
			id: 5,
			fileName: 'mask',
			objName: 'Mask',
			position: new THREE.Vector3(-1.2, -2.0, -1.7),
			glowPosition: new THREE.Vector3(-1.52, -2.08, -5.32),
			scale: 	  new THREE.Vector3(0.08, 0.08, 0.08),
			glowScale: 	  new THREE.Vector3(0.087, 0.082, 0.01),
		},
		{
			id: 6,
			fileName: 'eye protection',
			objName: 'Glasses',
			position: new THREE.Vector3(-0.8, -2.15, -1.0),
			glowPosition: new THREE.Vector3(-1.14, -2.24, -4.61),
			scale: 	  new THREE.Vector3(0.08, 0.08, 0.08),
			glowScale: 	  new THREE.Vector3(0.087, 0.082, 0.01),
		},
		{
			id: 7,
			fileName: 'gloves',
			objName: 'Gloves',
			position: new THREE.Vector3(-4.0, 1.6, -1.9),
			glowPosition: new THREE.Vector3(-4.34, 1.54, -5.84),
			scale: 	  new THREE.Vector3(0.08, 0.08, 0.08),
			glowScale: 	  new THREE.Vector3(0.087, 0.082, 0.01),
		},
	],	
	availableObjectIndex: -6, 
	//-6,-5,-4,-3 - intro
	//-2 - intro video
	//-1 - intro
	//0-4 - window
	//5-8 - put on
	//9 - window
	isPopupShown: false,
};

class App {
	init() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x505050 );
		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.set( 0, 0, 0 );
		scene.add(camera)

		scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );
		const light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 1, 1, 1 ).normalize();
		scene.add( light );

		//room
		let roomObj = new THREE.Object3D();
		let fbxLoader = new FBXLoader();
		fbxLoader.setPath(objectsParams.modelPath);
		fbxLoader.load(
			'VR_Room_Test_01.fbx',
			(object) => {
				object.name = 'Room';
				roomObj.add(object)
			}
		)
		roomObj.scale.set(0.08, 0.08, 0.08);
		roomObj.position.set(-4.0, 0, 1.2); 
		roomObj.name = 'Room';
		scene.add(roomObj);
				
		//patient
		addObject(	objectsParams.body.fileName, 
					objectsParams.body.position,
					objectsParams.body.glowPosition,
					objectsParams.body.scale,
					objectsParams.body.glowScale,
					objectsParams.body.objName
				);
		
		//interactive elements
		objectsParams.interactiveObjectList.forEach(element => {
			addObject(	element.fileName, 
						element.position,
						element.glowPosition,
						element.scale,
						element.glowScale,
						element.objName
			);
		});

		//window with btns
		createWindow();
		createCorrectIncorrectPopup();
		createIntroPopup();

		//render
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		//renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.outputEncoding = THREE.sRGBEncoding;
		renderer.xr.enabled = true;
		document.body.appendChild( renderer.domElement );
		document.body.appendChild( VRButton.createButton( renderer ) );

		// controllers
		function onSelectStart() {
			this.userData.isSelecting = true;
		}

		function onSelectEnd() {
			this.userData.isSelecting = false;
		}

		controller1 = renderer.xr.getController( 0 );
		controller1.addEventListener( 'selectstart', onSelectStart );
		controller1.addEventListener( 'selectend', onSelectEnd );
		controller1.addEventListener( 'connected', function ( event ) {
			this.add( buildController( event.data ) );
		} );
		controller1.addEventListener( 'disconnected', function () {
			this.remove( this.children[ 0 ] );
		} );
		scene.add( controller1 );

		controller2 = renderer.xr.getController( 1 );
		controller2.addEventListener( 'selectstart', onSelectStart );
		controller2.addEventListener( 'selectend', onSelectEnd );
		controller2.addEventListener( 'connected', function ( event ) {
			this.add( buildController( event.data ) );
		} );
		controller2.addEventListener( 'disconnected', function () {
			this.remove( this.children[ 0 ] );
		} );
		scene.add( controller2 );

		// The XRControllerModelFactory will automatically fetch controller models
		// that match what the user is holding as closely as possible. The models
		// should be attached to the object returned from getControllerGrip in
		// order to match the orientation of the held device.

		const controllerModelFactory = new XRControllerModelFactory();

		controllerGrip1 = renderer.xr.getControllerGrip( 0 );
		controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
		scene.add( controllerGrip1 );

		controllerGrip2 = renderer.xr.getControllerGrip( 1 );
		controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
		scene.add( controllerGrip2 );

		window.addEventListener( 'resize', onWindowResize );

		pickHelper = new ControllerPickHelper(scene);

		animate();
	}
}

class ControllerPickHelper extends THREE.EventDispatcher {
    constructor(scene) {
      super();
      this.raycaster = new THREE.Raycaster();
      this.objectToColorMap = new Map();
      this.controllerToObjectMap = new Map();
      this.tempMatrix = new THREE.Matrix4();

      const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      ]);

      this.controllers = [];

	  //--- startClick ----
      const selectListener = (event) => {
        const controller = event.target;
        const selectedObject = this.controllerToObjectMap.get(event.target);
        if (selectedObject) {
          this.dispatchEvent({type: event.type, controller, selectedObject});
        }
		//console.log('click', event)
		if (event.type != 'selectstart')
			return;

		this.tempMatrix.identity().extractRotation(controller.matrixWorld);
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

		//find intersects
        const intersections = this.raycaster.intersectObjects(scene.children, true);
		//console.log(intersections)
		intersections.forEach(intersect => {
			if (intersect != undefined && intersect.object.type == 'Mesh') { 
				//close popup
				if (intersect.object.name == 'Close'){
					showCloseWindow(false);
				}
				if (intersect.object.name == 'Ok'){
					restartSimulation();
				}
				if (intersect.object.name == 'Next' && objectsParams.availableObjectIndex < 0){
					refreshIntroContent(true);
					objectsParams.availableObjectIndex++;
				}
				if (intersect.object.name == 'Back' && objectsParams.availableObjectIndex < 0 && objectsParams.availableObjectIndex > -6){
					refreshIntroContent(false);
					objectsParams.availableObjectIndex--;
				}
				if (intersect.object.parent != undefined){
					//is click on body					
					if (intersect.object.parent.name == objectsParams.body.objName && 
						((objectsParams.availableObjectIndex >= 0 && objectsParams.availableObjectIndex < 4) || objectsParams.availableObjectIndex == 8) &&
						!objectsParams.isPopupShown){
							//show popup
							showCloseWindow();							
						}
					//moveobjects
					objectsParams.interactiveObjectList.forEach(el => {
						let name = el.objName;
						let elementId = getObjectId(name);
						if (intersect.object.parent.name == name){
							if (elementId == objectsParams.availableObjectIndex){
								scene.getObjectByName(name).position.copy(objectsParams.body.position);
								scene.getObjectByName(name + "Glow").visible = false;
								objectsParams.availableObjectIndex++;
								showCorrectIncorrectPopup(true);
								if (objectsParams.availableObjectIndex == 8) scene.getObjectByName("BodyGlow").visible = true;
							}
							else if (elementId > objectsParams.availableObjectIndex) showCorrectIncorrectPopup(false);
						}
					});
					//win btn click
					if (objectsParams.isPopupShown && intersect.object.name.includes('btn')){
						let isCorrect = intersect.object.name == rightChoose[objectsParams.availableObjectIndex];
						showCorrectIncorrectPopup(isCorrect);
						objectsParams.availableObjectIndex++;
						refreshBtnContent();
					}
				}
			}
		});
      };
	  //--- end of start click

	  //------- endClick -------------
      const endListener = () => {
        
      };
	  //------- end of endClick -------------

      for (let i = 0; i < 2; ++i) {
        const controller = renderer.xr.getController(i);
        //controller.addEventListener('select', selectListener);
        controller.addEventListener('selectstart', selectListener);
        controller.addEventListener('selectend', endListener);
        scene.add(controller);

        const line = new THREE.Line(pointerGeometry);
        line.scale.z = 20;
        controller.add(line);
        this.controllers.push({controller, line});
      }
    }
	//reset
    reset() {
      // restore the colors
      this.objectToColorMap.forEach((color, object) => {
        object.material.emissive.setHex(color);
      });
      this.objectToColorMap.clear();
      this.controllerToObjectMap.clear();
    }
	//update
    update(scene) {
      this.reset();
	  let isChoose = [false, false, false, false, false];
	  let index = 0;

      for (const {controller, line} of this.controllers) {
        this.tempMatrix.identity().extractRotation(controller.matrixWorld);
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

        const intersections = this.raycaster.intersectObjects(scene.children);
		line.scale.z = 20;
		
		//hover
		intersections.forEach(intersect => {
			if (intersect != undefined && intersect.object.type == 'Mesh') {		
				hoverObjectsList.forEach(el => {
					if (intersect.object.name == el){
						lastChooseObj.forEach((element) => {
							if (element != undefined){
								element.material.color.setHex(0xffffff);
								element = undefined;
							}
						});
						lastChooseObj[index] = intersect.object;
						isChoose[index] = true;
						isChoose.map((i) => { if (i != index) return false})
						line.scale.z = intersect.distance;
						intersect.object.material.color.setHex(0xcccccc);
					}
				});
			}
		});
		index++;
      }

	  for (index = 0; index < 5; index++)
		if (!isChoose[index] && lastChooseObj[index] != undefined){
			lastChooseObj[index].material.color.setHex(0xffffff);
			lastChooseObj[index] = undefined;
		}
    }
  }

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function buildController( data, name ) {
	let geometry, material;
	switch ( data.targetRayMode ) {
		case 'tracked-pointer':

			geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
			geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

			material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

			return new THREE.Line( geometry, material );

		case 'gaze':

			geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
			material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
			return new THREE.Mesh( geometry, material );
	}
}

function animate() {	
	renderer.setAnimationLoop( render );
}

function render() {
	pickHelper.update(scene);
	renderer.render( scene, camera );
}

function getObjectId(objName){
	let elementId = -1;
	objectsParams.interactiveObjectList.forEach(element => {
		if (element.objName == objName)
			elementId = element.id;
	});
	return elementId;
}

function addObject(fileName, position, glowPosition, scale, glowScale, objName, visible = true){
	/*
	let Obj = new THREE.Object3D();
	let mtlLoader = new MTLLoader();
	mtlLoader.setPath(objectsParams.modelPath);
	mtlLoader.load(fileName + '.mtl', function (materials) {
		materials.preload();
		let objLoader = new OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.setPath(objectsParams.modelPath);
		objLoader.load(fileName + '.obj', function (object) {
			object.name = objName;
			Obj.add(object);
			
		});
	});

	Obj.position.copy(position);
	Obj.scale.copy(scale);
	Obj.name = objName;
	Obj.visible = visible;
	*/
	let Obj = new THREE.Object3D();
	let fbxLoader = new FBXLoader();
	fbxLoader.setPath(objectsParams.modelPath);
	fbxLoader.load(
		fileName + '.fbx',
		(object) => {
			object.name = objName;
			Obj.add(object);
		},
	)
	Obj.position.copy(position);
	Obj.scale.copy(scale);
	Obj.name = objName;
	Obj.visible = visible;

	scene.add(Obj);

	let ObjGlow = new THREE.Object3D();
	fbxLoader = new FBXLoader();
	fbxLoader.setPath(objectsParams.modelPath);
	fbxLoader.load(
		fileName + '.fbx',
		(object) => {
			//object.name = objName;
			ObjGlow.add(object);
		}
	)
	
	ObjGlow.position.copy(glowPosition);
	ObjGlow.scale.copy(glowScale);
	ObjGlow.name = objName + 'Glow';
	ObjGlow.visible = false;

	scene.add(ObjGlow);

	return Obj;
}

function createGlow() {
	//glowing obj
	var glowMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{ 
			"base":   { type: "f", value: 0.0 },
			"p":   { type: "f", value: 0.0 },
			glowColor: { type: "c", value: new THREE.Color(0x0000FF) },
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}   );

	scene.getObjectByName("BodyGlow").children[0].children.forEach(element => {
		element.material = glowMaterial;
	});
	scene.getObjectByName("BodyGlow").visible = true;
	objectsParams.interactiveObjectList.forEach(element => {
		let name = element.objName + 'Glow';
		scene.getObjectByName(name).children[0].children.forEach(element => {
			element.material = glowMaterial;
		});
		//scene.getObjectByName(name).visible = true;
	});
}

function showSuccessPopup(){
	let popupGroup = new THREE.Group();
	popupGroup.name = "successPopup";
	let textureLoader = new THREE.TextureLoader();
	const infoGeometry = new THREE.BoxGeometry(25, 10, 0.01);
	const infoMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/successPopup.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let info = new THREE.Mesh(infoGeometry, infoMaterial);
	info.rotation.set(0, 0, 0.0);
	info.position.set(0.0, 2.5, -2.6);
	info.scale.set(0.08, 0.08, 0.08);
	info.name = 'bg';
	popupGroup.add(info)
	//info btns
	const btnOKGeometry = new THREE.BoxGeometry(6, 1.6, 0.05);
	const btnOkMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/ok.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let btnOk = new THREE.Mesh(btnOKGeometry, btnOkMaterial);
	btnOk.rotation.set(0, 0, 0.0); 	
	btnOk.position.set(0.0, 2.25, -2.6);
	btnOk.scale.set(0.08, 0.08, 0.08); 
	btnOk.name = 'Ok'; 
	popupGroup.add(btnOk); 
	
	scene.add(popupGroup); 
}

function createIntroPopup(){
	let popupGroup = new THREE.Group();
	popupGroup.name = "introGroup";
	let textureLoader = new THREE.TextureLoader();

	const infoGeometry = new THREE.BoxGeometry(60, 32, 0.01);
	const infoMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/introPopup-6.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let info = new THREE.Mesh(infoGeometry, infoMaterial);
	info.position.set(0.0, 2.16, -2.6);
	info.scale.set(0.08, 0.08, 0.08);
	info.name = 'introHero';
	info.visible = true;
	popupGroup.add(info);

	//btns
	//info btns
	const btnBackGeometry = new THREE.BoxGeometry(6, 2.7, 0.05);
	const btnNextGeometry = new THREE.BoxGeometry(6, 2.7, 0.05);
	const btnBackMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/Back.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	const btnNextMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/Next.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let btnNext = new THREE.Mesh(btnNextGeometry, btnNextMaterial);
	let btnBack = new THREE.Mesh( btnBackGeometry, btnBackMaterial);
	btnNext.rotation.set(0, 0, 0.0); 			btnBack.rotation.set(0, 0, 0.0);
	btnNext.position.set(2.0, 1.07, -2.6);		btnBack.position.set(1.45, 1.07, -2.6);
	btnNext.scale.set(0.08, 0.08, 0.08); 		btnBack.scale.set(0.08, 0.08, 0.08);
	btnNext.name = 'Next'; 						btnBack.name = 'Back';
												btnBack.visible = false;
	popupGroup.add(btnNext); 					popupGroup.add(btnBack);

	scene.add(popupGroup);
}

function createCorrectIncorrectPopup(){
	let popupGroup = new THREE.Group();
	popupGroup.name = "correctGroup";
	let textureLoader = new THREE.TextureLoader();

	const infoGeometry = new THREE.BoxGeometry(20, 5, 0.01);
	const infoMaterial1 = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/incorrectPopup.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	const infoMaterial2 = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/correctPopup.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let info = new THREE.Mesh(infoGeometry, infoMaterial1);
	info.position.set(0.0, 0.9, -2.6);
	info.scale.set(0.08, 0.08, 0.08);
	info.name = 'incorrect';
	info.visible = false;
	popupGroup.add(info);

	info = new THREE.Mesh(infoGeometry, infoMaterial2);
	info.position.set(0.0, 0.9, -2.6);
	info.scale.set(0.08, 0.08, 0.08);
	info.name = 'correct';
	info.visible = false;
	popupGroup.add(info);
	popupGroup.position.y = 1.9;
	
	scene.add(popupGroup);
}

function createWindow(){
	let window = new THREE.Group();
	window.name = 'window';
	let textureLoader = new THREE.TextureLoader();
	//container
	const infoGeometry = new THREE.BoxGeometry(25, 20, 0.01);
	const infoMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff	} );
	let info = new THREE.Mesh(infoGeometry, infoMaterial);
	info.position.set(0.0, 0.7, -2.6);
	info.scale.set(0.08, 0.08, 0.08);
	info.name = 'bg';
	window.add(info);
	//title
	const titleGeometry = new THREE.BoxGeometry(24, 2.5, 0.05);
	let titleMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/title.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let title = new THREE.Mesh(titleGeometry, titleMaterial);
	title.position.set(0, 1.34, -2.5);
	title.scale.set(0.08, 0.08, 0.08); 	
	title.name = 'title'; 	
	window.add(title);
	//close
	const btnCloseGeometry = new THREE.BoxGeometry(2, 2, 0.05);
	const btnCloseMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/close.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let btnClose = new THREE.Mesh( btnCloseGeometry, btnCloseMaterial);
	btnClose.position.set(0.85, 1.34, -2.49);
	btnClose.scale.set(0.05, 0.05, 0.05);
	btnClose.name = 'Close';
	window.add(btnClose);
	//btn 1
	const btnGeometry = new THREE.BoxGeometry(22, 2.5, 0.05);
	let btnMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/step1/1.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	let btn = new THREE.Mesh(btnGeometry, btnMaterial);
	btn.position.set(0, 1.05, -2.5);
	btn.scale.set(0.08, 0.08, 0.08); 	
	btn.name = 'btn-1'; 	
	window.add(btn);
	//btn 2
	btnMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/step1/2.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	btn = new THREE.Mesh(btnGeometry, btnMaterial);
	btn.position.set(0, 0.8, -2.5);
	btn.scale.set(0.08, 0.08, 0.08); 	
	btn.name = 'btn-2'; 	
	window.add(btn);
	//btn 3
	btnMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/step1/3.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	btn = new THREE.Mesh(btnGeometry, btnMaterial);
	btn.position.set(0, 0.54, -2.5);
	btn.scale.set(0.08, 0.08, 0.08); 	
	btn.name = 'btn-3'; 	
	window.add(btn);
	//btn 4
	btnMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/step1/4.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	btn = new THREE.Mesh(btnGeometry, btnMaterial);
	btn.position.set(0, 0.21, -2.5);
	btn.scale.set(0.08, 0.14, 0.08); 	
	btn.name = 'btn-4'; 	
	window.add(btn);
	window.visible = false;
	window.position.y = 1.9;

	scene.add(window);
}
function showCloseWindow(isShow = true){
	scene.getObjectByName('window').visible = isShow;
	objectsParams.isPopupShown = isShow;
}
function showCorrectIncorrectPopup(isCorrect){
	scene.getObjectByName('window').visible = false;

	let name = isCorrect ? 'correct' : 'incorrect';
	scene.getObjectByName(name).visible = true;
	setTimeout(() => {
		scene.getObjectByName(name).visible = false;
		objectsParams.isPopupShown = false;
	}, 2000);
}

function refreshBtnContent(){
	let textureLoader = new THREE.TextureLoader();
	let stepN = objectsParams.availableObjectIndex + 1;

	if (stepN == 2){
		scene.getObjectByName('bg').scale.y = 0.062;
		scene.getObjectByName('btn-4').scale.y = 0.08;
		scene.getObjectByName('btn-4').position.y = 0.29;
	}
	if (objectsParams.availableObjectIndex == 4){
		//go to step 9
		stepN = 9;
		scene.getObjectByName('btn-4').visible = false;
		scene.getObjectByName('bg').scale.y = 0.052;
		scene.getObjectByName('bg').position.y = 0.86;
		objectsParams.interactiveObjectList.forEach(element => {
			let name = element.objName + 'Glow';
			scene.getObjectByName(name).visible = true;
		});
		scene.getObjectByName('BodyGlow').visible = false;
	}

	if (objectsParams.availableObjectIndex == 9){
		setTimeout(() => {
			showSuccessPopup();
		}, 3000);
	}

	let iMax = stepN < 9 ? 5 : 4;

	for (let i = 1; i < iMax; i++) {
		let map = textureLoader.load(`./assets/img/step${stepN}/${i}.png`, function (texture) {
			texture.minFilter = THREE.LinearFilter;
		});
		scene.getObjectByName(`btn-${i}`).material.map = map;
		scene.getObjectByName(`btn-${i}`).material.needsUpdate = true;			
	}
}

function refreshIntroContent(isForward){
	let textureLoader = new THREE.TextureLoader();
	let deltaStep = isForward ? 1 : -1;
	let step = objectsParams.availableObjectIndex + deltaStep;

	scene.getObjectByName('Back').visible = step > -6 ? true : false;
	
	if (step != -2 && step < 0){
		let map = textureLoader.load(`./assets/img/introPopup${step}.png`, function (texture) {
			texture.minFilter = THREE.LinearFilter;
		});
		scene.getObjectByName(`introHero`).material.map = map;
		scene.getObjectByName(`introHero`).material.needsUpdate = true;
	}

	if (step == -1 || step == -3){
		const video = document.getElementById('video');
		video.pause();
	}

	if (step == -2){//video
		//scene.getObjectByName('Back').visible = false;
		//scene.getObjectByName('Next').visible = false;

		const video = document.getElementById('video');
		let videoTexture = new THREE.VideoTexture( video );		
		videoTexture.flipY = true;

		scene.getObjectByName(`introHero`).material.map = videoTexture;
		video.play();
	}

	scene.getObjectByName(`introHero`).scale.x = step == -1 ? 0.06 : 0.08;
	scene.getObjectByName(`Next`).position.x = step == -1 ? 1.45 : 2.0;
	scene.getObjectByName(`Back`).position.x = step == -1 ? 0.9 : 1.45;

	if (step == 0){
		scene.getObjectByName(`introGroup`).visible = false;
		setTimeout(() => {
			createGlow();
		}, 1000);
	}
}

function restartSimulation(){
	let textureLoader = new THREE.TextureLoader();

	objectsParams.availableObjectIndex = 0;
	scene.getObjectByName('btn-4').visible = true;
	scene.getObjectByName('btn-4').scale.y = 0.14;
	scene.getObjectByName('btn-4').position.y = 0.21;
	scene.getObjectByName('bg').scale.y = 0.08;
	scene.getObjectByName('bg').position.y = 0.7;
	objectsParams.interactiveObjectList.forEach(element => {
		scene.getObjectByName(element.objName).position.copy(element.position);
	});

	for (let i = 1; i < 5; i++) {
		let map = textureLoader.load(`./assets/img/step1/${i}.png`, function (texture) {
			texture.minFilter = THREE.LinearFilter;
		});
		scene.getObjectByName(`btn-${i}`).material.map = map;
		scene.getObjectByName(`btn-${i}`).material.needsUpdate = true;			
	}

	scene.remove(scene.getObjectByName('successPopup'));
}

export default App;