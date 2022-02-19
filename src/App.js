import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import ThreeMeshUI from "three-mesh-ui";
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';
import { Vector3 } from 'three';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let pickHelper;
let PPE_DATA;

let IntroObjects = { 
	"IntroContainerName": "introGroup",
	"titleTextObj": null,
	"contentTextObj": null,
	"mediaContainerObjName": "introHero",
	"prevBtnObjName": "prevBtn",
	"nextBtnObjName": "nextBtn",
};
let QuizzObjects = { 
	"QuizzContainerName": "quizz-window",
	"titleTextObj": null,
	"btnTextObj": [null, null, null, null],
	"correctHighlightedObjName": null,
	"correctQuizzBtnName": null
};
let correctIncorrectObjects = {
	"containerName": "correctGroup",
	"titleTextObj": null,
	"contentTextObj": null
}
let infoObjectsMediumText = {
	"containerName": "infoGroupMediumText",
	"titleTextObj": null,
	"contentTextObj": null
};
let infoObjectsMediumTextImg = {
	"containerName": "infoGroupMediumTextImg",
	"titleTextObj": null,
	"contentTextObj": null,
	"imgContainerObjName": "imageInfoMd",
};
let infoObjectsSmall = {
	"containerName": "infoGroupSmall",
	"titleTextObj": null,
	"contentTextObj": null,
};
let successObjects = {
	"containerName": "successPopup",
	"titleTextObj": null,
	"contentTextObj": null
}
let putOnObjects = {
	correctObjectName : '',
	interactiveObject : []
}

let simulationStep = 0;
let hoverObjectsList = [];  
let stepSimType = "";

let objectsParams = {
	modelPath: './assets/models/',
	room: {
		fileName: 'VR_Room_Test_01.fbx',
		objName: 'Room',
		position: new THREE.Vector3(-3.2, -1.5, 0.33),
		rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
		scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
	},	
	body: {
		fileName: 'physician',
		objName: 'Body',
		position: new THREE.Vector3(-2.4, -1.5, -1.3),
		glowPosition: new THREE.Vector3(-2.63, -1.7, -4.29),
		rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),		
		scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
		glowScale: 	  new THREE.Vector3(0.07, 0.07, 0.01),
	},	
	interactiveObjectList: [
		{
			id: 4,
			fileName: 'gown',
			objName: 'Robe',
			position: new THREE.Vector3(-5.0, -1.5, -1.9),
			glowPosition: new THREE.Vector3(-5.21, -1.64, -4.86),
			droppedPosition: new THREE.Vector3(0.65, 1.48, -0.66),
			rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
			droppedRotation: new THREE.Vector3(-1.35, 0, 1.74),
			scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
			glowScale: 	  new THREE.Vector3(0.07, 0.067, 0.01),
		},
		{
			id: 5,
			fileName: 'mask',
			objName: 'Mask',
			position: new THREE.Vector3(-0.9, -3.1, -1.6),
			glowPosition: new THREE.Vector3(-1.13, -3.2, -4.44),
			rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
			scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
			glowScale: 	  new THREE.Vector3(0.07, 0.067, 0.01),
		},
		{
			id: 6,
			fileName: 'eye protection',
			objName: 'Glasses',
			position: new THREE.Vector3(-0.4, -3.27, -1.6),
			glowPosition: new THREE.Vector3(-0.64, -3.38, -4.41),
			rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
			scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
			glowScale: 	  new THREE.Vector3(0.07, 0.067, 0.01),
		},
		{
			id: 7,
			fileName: 'gloves',
			objName: 'Gloves',
			position: new THREE.Vector3(-3.6, -0.28, -2.13),
			glowPosition: new THREE.Vector3(-3.59, -0.4, -5.18),
			droppedPosition: new THREE.Vector3(-3.6, 0.95, -0.33),
			rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
			droppedRotation: new THREE.Vector3(-1.1, 0, 0),
			scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
			glowScale: 	  new THREE.Vector3(0.065, 0.07, 0.01),
		},
		{
			id: 7,
			fileName: 'gloves',
			objName: 'Gloves2',
			position: new THREE.Vector3(-3.6, -0.28, -2.13),
			glowPosition: new THREE.Vector3(-3.59, -0.4, -4.6),
			droppedPosition: new THREE.Vector3(-4.35, 1.32, -0.62),
			rotation: new THREE.Vector3(Math.PI * 0.0, Math.PI * 0.0, Math.PI * 0.0),
			scale: 	  new THREE.Vector3(0.065, 0.065, 0.065),
			glowScale: 	  new THREE.Vector3(0.06, 0.062, 0.01),
		},
	],
	decals: [
		{
			objName: 'gown',
			decalName: 'decal-gown-1',
			position: new Vector3(0.57, 1.285, -4.6),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'gown',
			decalName: 'decal-gown-2',
			position: new Vector3(0.9, 0.92, -4.6),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'gown',
			decalName: 'decal-gown-3',
			position: new Vector3(0.57, 0.43, -4.58),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'gown',
			decalName: 'decal-gown-4',
			position: new Vector3(0.89, -0.23, -4.61),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'Glove_on_hands',
			decalName: 'decal-gloves',
			position: new Vector3(1.27, 0.36, -4.96),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'N95_mask',
			decalName: 'decal-mask',
			position: new Vector3(0.735, 1.75, -4.61),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.2, 0.2)	
		},
		{
			objName: 'eye_protection',
			decalName: 'decal-eye',
			position: new Vector3(0.664, 1.92, -4.635),
			orientation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.1, 0.1, 0.1)	
		},
	],	
};

class App {
	async start(){
		await fetch('./build/ppe.json', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
		})
			.then(async (response) => {
				if (response.ok){
					PPE_DATA = await response.json();
					console.log('PPE_DATA', PPE_DATA)
					this.init();
				}
			})
	}
	init() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x505050 );
		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.set( 0, 1, 0 );
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
			objectsParams.room.fileName,
			(object) => {
				object.name = objectsParams.room.objName;
				roomObj.add(object)
			}
		)
		roomObj.scale.copy(objectsParams.room.scale);
		roomObj.position.copy(objectsParams.room.position); 
		roomObj.name = objectsParams.room.objName;
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
		setTimeout(() => {
			createGlow();
			//addPolutionDecals();
		}, 12000);
		//window with btns
		createQuizzWindow();
		createCorrectIncorrectPopup();
		createIntroPopup();
		createSuccessPopup();
		createInfoSmall();
		createInfoMediumText();
		createInfoMediumTextImg();

		//render
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		//renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.outputEncoding = THREE.sRGBEncoding;
		renderer.xr.enabled = true;
		document.body.appendChild( renderer.domElement );
		document.body.appendChild( VRButton.createButton( renderer ) );

		window.addEventListener( 'resize', onWindowResize );

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

		const controllerModelFactory = new XRControllerModelFactory();

		controllerGrip1 = renderer.xr.getControllerGrip( 0 );
		controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
		scene.add( controllerGrip1 );

		controllerGrip2 = renderer.xr.getControllerGrip( 1 );
		controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
		scene.add( controllerGrip2 );	

		pickHelper = new ControllerPickHelper(scene);

		showCurrentSimulationStep();
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
		console.log(intersections)
		const isQuizzVisible = scene.getObjectByName(QuizzObjects.QuizzContainerName).visible;
		const isCorrectPopupVisible = scene.getObjectByName(correctIncorrectObjects.containerName).visible;
		intersections.forEach(intersect => {
			if (intersect != undefined && intersect.object.type == 'Mesh') { 
				if (stepSimType.includes('intro')){console.log(stepSimType)
					if (intersect.object.name == "MeshUI-Frame"){
						if (intersect.object.parent.children[1]?.name === 'nextBtn'){
							simulationStep++;
							showCurrentSimulationStep();
						}						
						if (intersect.object.parent.children[1]?.name === 'prevBtn'){
							simulationStep--;
							showCurrentSimulationStep();
						}
					}
				}
				if (stepSimType.includes('info')){
					if (intersect.object.name == "MeshUI-Frame"){
						let objName = intersect.object.parent.children[1]?.name;
						if (
							(objName === 'okBtnInfoMediumTextImg' && stepSimType === 'info-md-text-img') ||
							(objName === 'okBtnInfoMediumText' && stepSimType === 'info-md-text') ||
							(objName === 'okBtnInfoSmall' && stepSimType === 'info-sm')
						){
							simulationStep++;
							showCurrentSimulationStep();
						}	
					}
				}
				if (stepSimType === 'quizz'){
					if (intersect.object.parent.name === QuizzObjects.correctHighlightedObjName &&
						!isQuizzVisible && !isCorrectPopupVisible){
						scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = true;
					}
					if (intersect.object.name == "MeshUI-Frame" && isQuizzVisible)
						if (intersect.object.parent.children[1]?.name.includes('quizz-btn')){
							scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = false;
							if (intersect.object.parent.children[1].name === QuizzObjects.correctQuizzBtnName){
								simulationStep++;
								showCurrentSimulationStep();
							}
							else {
								correctIncorrectObjects.contentTextObj.set({content: 'Incorrect.\nPlease try again.'});
								scene.getObjectByName(correctIncorrectObjects.containerName).visible = true;
								setTimeout(() => {
									scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
									showCurrentSimulationStep();
								}, 2000);
							}
						}
				}
				if (stepSimType === 'put-on'){
					if (intersect.object.parent.name === putOnObjects.correctObjectName){
						scene.getObjectByName(putOnObjects.correctObjectName).position.copy(objectsParams.body.position);
						scene.getObjectByName(putOnObjects.correctObjectName + "Glow").visible = false;
						simulationStep++;
						showCurrentSimulationStep();
					} else
						putOnObjects.interactiveObject.forEach((element) => {
							if (intersect.object.parent.name === element){
								correctIncorrectObjects.contentTextObj.set({content: 'Incorrect.\nPlease try again.'});
								scene.getObjectByName(correctIncorrectObjects.containerName).visible = true;
								setTimeout(() => {
									scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
								}, 2000);
							}
						});
				}
				if (stepSimType === 'sim-end'){
					if (intersect.object.name == "MeshUI-Frame")
						if(intersect.object.parent.children[1].name === 'successOk'){
							simulationStep = 0;
							showCurrentSimulationStep();
							objectsParams.interactiveObjectList.forEach((obj) => {
								scene.getObjectByName(obj.objName).position.copy(obj.position);
							})
						}
					
				}
				/*
				//close popup
				if (intersect.object.name == 'Close'){
					showCloseWindow(false);
				}
				if (intersect.object.name == 'Ok'){
					restartSimulation();
				}
				*/
			}
		});
      };
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
	//update - for hover
    update(scene) {
      this.reset();

	  hoverObjectsList.forEach(el => {
		  if (el.state === 'selected'){
			scene.getObjectByName(el.name).parent.setState('normal');
			el.state = "normal";
		  }
	  });

      for (const {controller, line} of this.controllers) {
        this.tempMatrix.identity().extractRotation(controller.matrixWorld);
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

        const intersections = this.raycaster.intersectObjects(scene.children, true);
		line.scale.z = 20;
		//hover
		intersections.forEach(intersect => {
			if (intersect != undefined) {
				hoverObjectsList.forEach(el => {
					if (intersect.object.name == "MeshUI-Frame"){
						if (intersect.object.parent.children[1]?.name == el.name){
							scene.getObjectByName(el.name).parent.setState('selected');
							el.state = "selected";
						}
					}
				});
			}
		});
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
	ThreeMeshUI.update();
	pickHelper.update(scene);
	renderer.render( scene, camera );
}

function addObject(fileName, position, glowPosition, scale, glowScale, objName, visible = true){
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

function addPolutionDecals(){
	//create decal
	const decalMaterial = new THREE.MeshPhongMaterial({
		color: new THREE.Color(0xffffff),
		flatShading: false,
		shininess: 30,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: - 4,
		wireframe: false
	});

	const loader = new THREE.TextureLoader();
	const decalTexture = loader.load('./assets/img/polution.png', function (texture) {
		texture.minFilter = THREE.NearestFilter;
	});

	const decalTextureMaterial = new THREE.MeshPhongMaterial({
		map: decalTexture,
		flatShading: false,
		shininess: 30,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: - 4,
		wireframe: false
	});
	
	objectsParams.decals.forEach(item => {
		const decalGeometry = new DecalGeometry(
			scene.getObjectByName(item.objName), 
			item.position, 				
			item.orientation, 	
			item.scale	
		);
		const decalMesh = new THREE.Mesh(decalGeometry, decalTextureMaterial);
		decalMesh.name = item.decalName;
		//decalMesh.visible = false;
		scene.add(decalMesh);
	})
}

function createGlow() {
	//glowing obj
	/*
	var glowMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff, transparent: true, opacity: 0.2
	});
	*/

	var glowMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{ 
			"base":   { type: "f", value: 0.0 },
			"p":   { type: "f", value: 0.0 },
			glowColor: { type: "c", value: new THREE.Color(0x0000FF) },
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader:   `uniform vec3 viewVector;
						uniform float base;
						uniform float p;
						varying float intensity;
						void main() 
						{
							vec3 vNormal = normalize( normalMatrix * normal );
							vec3 vNormel = normalize( normalMatrix * viewVector );
							intensity = pow( base - dot(vNormal, vNormel), p );
							
							gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
						}`,
		fragmentShader: `uniform vec3 glowColor;
						varying float intensity;
						void main() 
						{
							vec3 glow = glowColor * intensity;
							gl_FragColor = vec4( glow, 1.0 );
						}`,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}   );

	scene.getObjectByName("BodyGlow").children[0].children.forEach(element => {
		element.material = glowMaterial;
	});
	
	objectsParams.interactiveObjectList.forEach(element => {
		let name = element.objName + 'Glow';
		scene.getObjectByName(name).children[0].children.forEach(element => {
			element.material = glowMaterial;
		});
	});
}

function doGlowObjectsInvisible(){
	scene.getObjectByName("BodyGlow").visible = false;
	objectsParams.interactiveObjectList.forEach(element => {
		let name = element.objName + 'Glow';
		scene.getObjectByName(name).visible = false;
	})
}

function removeDecalsFromScene(){
	objectsParams.decals.forEach(item => {
		scene.remove(scene.getObjectByName(item.decalName));
	})
}

function createSuccessPopup(){
	let popupGroup = new THREE.Group();
	popupGroup.name = successObjects.containerName;

	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 2.6,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};
	
	const container = new ThreeMeshUI.Block({
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 1.0,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	successObjects.titleTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(successObjects.titleTextObj);
	successObjects.contentTextObj = new ThreeMeshUI.Text({
		content: "Congratulations, you have completed the VR PPE Demo. Click OK to restart.",
		fontColor: params.darkColor,
	  	fontSize: params.titleFontSize,
	});
	contentBlock.add(successObjects.contentTextObj);

	const btnBlock = new ThreeMeshUI.Block({
		height: 0.2,
		width: 1.2,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
		borderRadius: 0.03,
		margin: 0.6
	}); 
	const btnText = new ThreeMeshUI.Text({
		content: "Ok",
		fontColor: params.lightColor,
		fontSize: params.textFontSize,
	}); 
	btnText.name = `successOk`; 
	btnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	btnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	btnBlock.add(btnText);
	hoverObjectsList.push({
		name: `successOk`,
		state: 'normal'
	})
	contentBlock.add(btnBlock);

	popupGroup.add(container)
	popupGroup.position.set(0.0, 2.6, -4.5);
	popupGroup.visible = false;

	scene.add(popupGroup); 
}

function createIntroPopup(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 5.0,
		titleFontSize: 0.125,
		textFontSize: 0.125,
	}
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};

	let popupGroup = new THREE.Group();
	popupGroup.name = IntroObjects.IntroContainerName;

	const textureLoader = new THREE.TextureLoader();  
	const infoGeometry = new THREE.BoxGeometry(60, 32, 0.01);
	const infoMaterial = new THREE.MeshBasicMaterial( { 
		transparent: true,
		map: textureLoader.load('./assets/img/introPopup-6.png', function (texture) {
			texture.minFilter = THREE.LinearFilter;
		}),
	} );
	
	let info = new THREE.Mesh(infoGeometry, infoMaterial);
	info.position.set(0.0, 0.04, 0.01);
	info.scale.set(0.0832, 0.095, 0.08);
	info.name = IntroObjects.mediaContainerObjName;
	info.visible = false;
	popupGroup.add(info);

	const container = new ThreeMeshUI.Block({
		//height: 3.0,
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	  });  
	const contentBlock = new ThreeMeshUI.Block({
		height: 3.0,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	  });  
	container.add(titleBlock, contentBlock);
	IntroObjects.titleTextObj = new ThreeMeshUI.Text({
		content: "",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	IntroObjects.contentTextObj = new ThreeMeshUI.Text({
		content: "",
		fontColor: params.darkColor,
	  	fontSize: params.textFontSize,
	});
	titleBlock.add(IntroObjects.titleTextObj);
	contentBlock.add(IntroObjects.contentTextObj);
	//btns
	const btnsContainer = new ThreeMeshUI.Block({
		height: 0.4,
		width: params.width,
		justifyContent: 'end',
		alignContent: 'center',
		contentDirection: 'row',
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});

	const prevBtnBlock = new ThreeMeshUI.Block({
		height: 0.25,
		width: 0.6,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
	}); 
	const PrevText = new ThreeMeshUI.Text({
		content: "Back",
		fontColor: params.lightColor,
	  	fontSize: params.textFontSize,
	}); 
	PrevText.name = "prevBtn"; 
	prevBtnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	prevBtnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	prevBtnBlock.add(PrevText);
	hoverObjectsList.push({
		name: "prevBtn",
		state: 'normal'
	})

	const nextBtnBlock = new ThreeMeshUI.Block({
		height: 0.25,
		width: 0.6,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
		margin: 0.1
	});  
	const NextText = new ThreeMeshUI.Text({
		content: "Next",
		fontColor: params.lightColor,
	  	fontSize: params.textFontSize,
	});
	NextText.name = "nextBtn"; 
	nextBtnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	nextBtnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	nextBtnBlock.add(NextText);
	hoverObjectsList.push({
		name: "nextBtn",
		state: 'normal'
	})
	
	btnsContainer.add(prevBtnBlock, nextBtnBlock);
	container.add(btnsContainer);

	popupGroup.position.set(0.0, 2.16, -4.5);
	popupGroup.add(container);
	popupGroup.visible = false;
	scene.add(popupGroup);
}

function createInfoSmall(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 3.5,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}; 
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};
	
	let popupGroup = new THREE.Group();
	popupGroup.name = infoObjectsSmall.containerName;

	const container = new ThreeMeshUI.Block({
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 0.7,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	infoObjectsSmall.titleTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(infoObjectsSmall.titleTextObj);
	infoObjectsSmall.contentTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.darkColor,
	  	fontSize: params.titleFontSize,
	});
	contentBlock.add(infoObjectsSmall.contentTextObj);

	//btns
	const btnContainer = new ThreeMeshUI.Block({
		height: 0.4,
		width: params.width,
		justifyContent: 'center',
		alignContent: 'center',
		contentDirection: 'row',
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});

	const btnBlock = new ThreeMeshUI.Block({
		height: 0.25,
		width: 0.6,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
	}); 
	const btnText = new ThreeMeshUI.Text({
		content: "OK",
		fontColor: params.lightColor,
	  	fontSize: params.textFontSize,
	}); 
	btnText.name = "okBtnInfoSmall"; 
	btnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	btnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	btnBlock.add(btnText);
	btnContainer.add(btnBlock);
	hoverObjectsList.push({
		name: "okBtnInfoSmall",
		state: 'normal'
	})

	container.add(btnContainer);

	popupGroup.add(container)
	popupGroup.position.set(0.0, 2.6, -4.5);
	popupGroup.visible = false;
	
	scene.add(popupGroup);
}

function createInfoMediumText(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 4.0,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}; 
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};
	
	let popupGroup = new THREE.Group();
	popupGroup.name = infoObjectsMediumText.containerName;

	const container = new ThreeMeshUI.Block({
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 2.5,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	infoObjectsMediumText.titleTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(infoObjectsMediumText.titleTextObj);
	infoObjectsMediumText.contentTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.darkColor,
	  	fontSize: params.titleFontSize,
	});
	contentBlock.add(infoObjectsMediumText.contentTextObj);

	//btns
	const btnContainer = new ThreeMeshUI.Block({
		height: 0.4,
		width: params.width,
		justifyContent: 'center',
		alignContent: 'center',
		contentDirection: 'row',
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});

	const btnBlock = new ThreeMeshUI.Block({
		height: 0.25,
		width: 0.6,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
	}); 
	const btnText = new ThreeMeshUI.Text({
		content: "OK",
		fontColor: params.lightColor,
	  	fontSize: params.textFontSize,
	}); 
	btnText.name = "okBtnInfoMediumText"; 
	btnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	btnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	btnBlock.add(btnText);
	btnContainer.add(btnBlock);
	hoverObjectsList.push({
		name: "okBtnInfoMediumText",
		state: 'normal'
	})

	container.add(btnContainer);

	popupGroup.add(container)
	popupGroup.position.set(0.0, 2.0, -4.5);
	popupGroup.visible = false;
	
	scene.add(popupGroup);
}

function createInfoMediumTextImg(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 5.0,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}; 
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};
	
	let popupGroup = new THREE.Group();
	popupGroup.name = infoObjectsMediumTextImg.containerName;

	const container = new ThreeMeshUI.Block({
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 1.5,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	infoObjectsMediumTextImg.titleTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(infoObjectsMediumTextImg.titleTextObj);
	infoObjectsMediumTextImg.contentTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.darkColor,
	  	fontSize: params.titleFontSize,
	});
	contentBlock.add(infoObjectsMediumTextImg.contentTextObj);

	infoObjectsMediumTextImg.imgContainerObjName = new ThreeMeshUI.Block({
		height: 1.5,
		width: 1.5,
		alignContent: "center",
		justifyContent: "start",
		padding: 0.1
	});
	container.add(infoObjectsMediumTextImg.imgContainerObjName);

	//btns
	const btnContainer = new ThreeMeshUI.Block({
		height: 0.4,
		width: params.width,
		justifyContent: 'center',
		alignContent: 'center',
		contentDirection: 'row',
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});

	const btnBlock = new ThreeMeshUI.Block({
		height: 0.25,
		width: 0.6,
		alignContent: "center",
		justifyContent: "center",
		backgroundColor: params.darkColor,
	}); 
	const btnText = new ThreeMeshUI.Text({
		content: "OK",
		fontColor: params.lightColor,
	  	fontSize: params.textFontSize,
	}); 
	btnText.name = "okBtnInfoMediumTextImg"; 
	btnBlock.setupState({
		state: "selected",
		attributes: selectedAttributes
	});
	btnBlock.setupState({
		state: "normal",
		attributes: normalAttributes
	});
	btnBlock.add(btnText);
	btnContainer.add(btnBlock);
	hoverObjectsList.push({
		name: "okBtnInfoMediumTextImg",
		state: 'normal'
	})

	container.add(btnContainer);

	popupGroup.add(container)
	popupGroup.position.set(0.0, 2.0, -4.5);
	popupGroup.visible = false;
	
	scene.add(popupGroup);
}

function createCorrectIncorrectPopup(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 3.0,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}
	
	let popupGroup = new THREE.Group();
	popupGroup.name = correctIncorrectObjects.containerName;

	const container = new ThreeMeshUI.Block({
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 0.5,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	correctIncorrectObjects.titleTextObj = new ThreeMeshUI.Text({
		content: "Info",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(correctIncorrectObjects.titleTextObj);
	correctIncorrectObjects.contentTextObj = new ThreeMeshUI.Text({
		content: "Correct/Incorrect",
		fontColor: params.darkColor,
	  	fontSize: params.titleFontSize,
	});
	contentBlock.add(correctIncorrectObjects.contentTextObj);

	popupGroup.add(container)
	popupGroup.position.set(0.0, 2.6, -4.5);
	popupGroup.visible = false;
	
	scene.add(popupGroup);
}

function createQuizzWindow(){
	const params = {
		fontFamily: "./assets/Roboto-msdf.json",
	  	fontTexture: "./assets/Roboto-msdf.png",
		darkColor: new THREE.Color(0x3e3e3e),
		lightColor: new THREE.Color(0xe2e2e2),
		width: 3.0,
		titleFontSize: 0.125,
		textFontSize: 0.1,
	}
	const selectedAttributes = {
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};
	const normalAttributes = {
		backgroundColor: params.darkColor,
		fontColor: params.lightColor
	};

	let popupGroup = new THREE.Group();
	popupGroup.name = QuizzObjects.QuizzContainerName;

	const container = new ThreeMeshUI.Block({
		//height: 3.0,
		width: params.width,
		fontFamily: params.fontFamily,
	  	fontTexture: params.fontTexture,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});
	const titleBlock = new ThreeMeshUI.Block({
		height: 0.28,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.darkColor,
	});  
	const contentBlock = new ThreeMeshUI.Block({
		height: 2.5,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	});  
	container.add(titleBlock, contentBlock);
	QuizzObjects.titleTextObj = new ThreeMeshUI.Text({
		content: "",
		fontColor: params.lightColor,
	  	fontSize: params.titleFontSize,
	});
	titleBlock.add(QuizzObjects.titleTextObj);

	['1','2','3','4'].forEach((i) => {
		const btnBlock = new ThreeMeshUI.Block({
			height: 0.4,
			width: 2.7,
			alignContent: "center",
			justifyContent: "center",
			backgroundColor: params.darkColor,
			borderRadius: 0.03,
			margin: 0.05
		}); 
		QuizzObjects.btnTextObj[i-1] = new ThreeMeshUI.Text({
			content: "",
			fontColor: params.lightColor,
			fontSize: params.textFontSize,
		}); 
		QuizzObjects.btnTextObj[i-1].name = `quizz-btn-${i}`; 
		btnBlock.setupState({
			state: "selected",
			attributes: selectedAttributes
		});
		btnBlock.setupState({
			state: "normal",
			attributes: normalAttributes
		});
		btnBlock.add(QuizzObjects.btnTextObj[i-1]);
		hoverObjectsList.push({
			name: `quizz-btn-${i}`,
			state: 'normal'
		})
		contentBlock.add(btnBlock);
	})

	popupGroup.add(container);
	popupGroup.position.set(0.0, 2.16, -4.5);
	popupGroup.false = true;
	scene.add(popupGroup);
}

function showCurrentSimulationStep(){
	scene.getObjectByName(IntroObjects.IntroContainerName).visible = false;
	scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = false;
	scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
	scene.getObjectByName(successObjects.containerName).visible = false;
	scene.getObjectByName(infoObjectsMediumTextImg.containerName).visible = false;
	scene.getObjectByName(infoObjectsMediumText.containerName).visible = false;
	scene.getObjectByName(infoObjectsSmall.containerName).visible = false;
	doGlowObjectsInvisible(); 
	document.getElementById('video').pause();

	stepSimType = PPE_DATA.vrSim.sim[simulationStep].type;
	
	if (PPE_DATA.vrSim.sim[simulationStep].type.includes('intro')){
		//intro container
		scene.getObjectByName(IntroObjects.IntroContainerName).visible = true;
		//title
		IntroObjects.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//btns
		scene.getObjectByName(IntroObjects.prevBtnObjName).parent.visible = PPE_DATA.vrSim.sim[simulationStep].prevBtnVisibility;
		scene.getObjectByName(IntroObjects.nextBtnObjName).parent.visible = PPE_DATA.vrSim.sim[simulationStep].nextBtnVisibility;
		//media mesh
		document.getElementById('video').pause();
		scene.getObjectByName(IntroObjects.mediaContainerObjName).material.map = null;
		scene.getObjectByName(IntroObjects.mediaContainerObjName).visible = false;
		//content text
		IntroObjects.contentTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].content});
		
		if (PPE_DATA.vrSim.sim[simulationStep].type === "intro-img"){
			const loader = new THREE.TextureLoader();  
			let map = loader.load(PPE_DATA.vrSim.sim[simulationStep].img, function (texture) {
				texture.minFilter = THREE.LinearFilter;
			});
			scene.getObjectByName(IntroObjects.mediaContainerObjName).visible = true;
			scene.getObjectByName(IntroObjects.mediaContainerObjName).material.map = map;
			scene.getObjectByName(IntroObjects.mediaContainerObjName).material.needsUpdate = true;
		}
		if (PPE_DATA.vrSim.sim[simulationStep].type === "intro-video"){
			scene.getObjectByName(IntroObjects.mediaContainerObjName).visible = true;
			const video = document.getElementById('video');
			let videoTexture = new THREE.VideoTexture( video );		
			videoTexture.flipY = true;

			scene.getObjectByName(IntroObjects.mediaContainerObjName).material.map = videoTexture;
			video.play();
			video.currentTime = PPE_DATA.vrSim.sim[simulationStep].time;
		}
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'info-md-text-img'){
		//intro container
		scene.getObjectByName(infoObjectsMediumTextImg.containerName).visible = true;
		//title
		infoObjectsMediumTextImg.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//content text
		infoObjectsMediumTextImg.contentTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].content});
		//img
		const loader = new THREE.TextureLoader();  
		loader.load(PPE_DATA.vrSim.sim[simulationStep].img, function (texture) {
			//texture.minFilter = THREE.LinearFilter;
			infoObjectsMediumTextImg.imgContainerObjName.set({ backgroundTexture: texture });
		});
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'info-md-text'){
		//intro container
		scene.getObjectByName(infoObjectsMediumText.containerName).visible = true;
		//title
		infoObjectsMediumText.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//content text
		infoObjectsMediumText.contentTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].content});
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'info-sm'){
		//intro container
		scene.getObjectByName(infoObjectsSmall.containerName).visible = true;
		//title
		infoObjectsSmall.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//content text
		infoObjectsSmall.contentTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].content});
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'quizz'){
		PPE_DATA.vrSim.sim[simulationStep].highlightedObjectNames.forEach(element => {
			scene.getObjectByName(element + 'Glow').visible = true;
		}); 
		//title
		QuizzObjects.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//btns
		QuizzObjects.btnTextObj[0].set({content: PPE_DATA.vrSim.sim[simulationStep].btnText1});
		QuizzObjects.btnTextObj[1].set({content: PPE_DATA.vrSim.sim[simulationStep].btnText2});
		QuizzObjects.btnTextObj[2].set({content: PPE_DATA.vrSim.sim[simulationStep].btnText3});
		QuizzObjects.btnTextObj[3].set({content: PPE_DATA.vrSim.sim[simulationStep].btnText4});
		//correct`s
		QuizzObjects.correctHighlightedObjName = PPE_DATA.vrSim.sim[simulationStep].correctObjectName;
		QuizzObjects.correctQuizzBtnName = PPE_DATA.vrSim.sim[simulationStep].correctAnswer;
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'put-on'){
		PPE_DATA.vrSim.sim[simulationStep].glowObjectsName.forEach(element => {
			scene.getObjectByName(element + "Glow").visible = true;
		})
		putOnObjects.correctObjectName = PPE_DATA.vrSim.sim[simulationStep].correctOnjectName;
		putOnObjects.interactiveObject = PPE_DATA.vrSim.sim[simulationStep].interactiveObjectsName;
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'sim-end'){
		removeDecalsFromScene();
		//title
		successObjects.titleTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].title});
		//content
		successObjects.contentTextObj.set({content: PPE_DATA.vrSim.sim[simulationStep].content});
		setTimeout(() => {
			scene.getObjectByName(successObjects.containerName).visible = true;
		}, 2000);
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'take-off'){
		const objName = PPE_DATA.vrSim.sim[simulationStep].objectName;
		const objProperties = objectsParams.interactiveObjectList.filter(i => i.objName == objName)[0];
		scene.getObjectByName(objName).position.copy(objProperties.droppedPosition);
		scene.getObjectByName(objName).rotation.setFromVector3(objProperties.droppedRotation);
		simulationStep++;
		showCurrentSimulationStep();
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'throw-away'){
		const objName = PPE_DATA.vrSim.sim[simulationStep].objectName;
		objectsParams.interactiveObjectList.filter(i => i.objName == objName)[0];
		scene.getObjectByName(objName).visible = false;
		simulationStep++;
		showCurrentSimulationStep();
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'init-med-objects'){
		objectsParams.interactiveObjectList.forEach((e) => {
			scene.getObjectByName(e.objName).visible = true;
			scene.getObjectByName(e.objName).position.copy(e.position);
			scene.getObjectByName(e.objName).rotation.setFromVector3(e.rotation);
		});
		simulationStep++;
		showCurrentSimulationStep();
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'change-room'){
		console.log('Room changed');
		simulationStep++;
		showCurrentSimulationStep();
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'create-polution-decals'){
		addPolutionDecals();
		simulationStep++;
		showCurrentSimulationStep();
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'polution-decals'){
		objectsParams.decals.forEach(i => {
			scene.getObjectByName(i.decalName).visible = 
				PPE_DATA.vrSim.sim[simulationStep].visibleDecals.some(el => el == i.decalName);
		})
		simulationStep++;
		showCurrentSimulationStep();
	}
	/*
	scene.getObjectByName(element).children[0].children.forEach(element => {
				if (element.material && element.material.emissive)
					element.material.emissive.b = 0.1;
			});
	*/
}

export default App;