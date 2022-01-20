import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import ThreeMeshUI from "three-mesh-ui";

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
let putOnObjects = {
	correctObjectName : '',
	interactiveObject : []
}

let simulationStep = 0;
let hoverObjectsList = [];  
let stepSimType = "";

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
		setTimeout(() => {
			createGlow();
		}, 7000);
		//window with btns
		createQuizzWindow();
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
		//console.log(intersections)
		const isQuizzVisible = scene.getObjectByName(QuizzObjects.QuizzContainerName).visible;
		intersections.forEach(intersect => {
			if (intersect != undefined && intersect.object.type == 'Mesh') { 
				if (stepSimType.includes('intro')){
					if (intersect.object.parent.name === 'nextBtn'){
						simulationStep ++;
						showCurrentSimulationStep();
					}						
					if (intersect.object.parent.name === 'prevBtn'){
						simulationStep --;
						showCurrentSimulationStep();
					}
				}
				if (stepSimType === 'quizz'){
					if (intersect.object.parent.name === QuizzObjects.correctHighlightedObjName &&
						!isQuizzVisible){
						scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = true;
					}
					if (intersect.object.parent.name.includes('quizz-btn') && isQuizzVisible){
						if (intersect.object.parent.name === QuizzObjects.correctQuizzBtnName)
							correctIncorrectObjects.contentTextObj.set({content: 'Correct'});
						else correctIncorrectObjects.contentTextObj.set({content: 'Incorrect'});
						scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = false;
						scene.getObjectByName(correctIncorrectObjects.containerName).visible = true;
						setTimeout(() => {
							scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
							simulationStep++;
							showCurrentSimulationStep();
						}, 2000);
					}
				}
				if (stepSimType === 'put-on'){
					if (intersect.object.parent.name == putOnObjects.correctObjectName){
						scene.getObjectByName(putOnObjects.correctObjectName).position.copy(objectsParams.body.position);
						scene.getObjectByName(putOnObjects.correctObjectName + "Glow").visible = false;
						correctIncorrectObjects.contentTextObj.set({content: 'Correct'});
						scene.getObjectByName(correctIncorrectObjects.containerName).visible = true;
						setTimeout(() => {
							scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
							simulationStep++;
							showCurrentSimulationStep();
						}, 2000);
					}
					putOnObjects.interactiveObject.forEach(() => {
						correctIncorrectObjects.contentTextObj.set({content: 'Incorrect'});
						scene.getObjectByName(correctIncorrectObjects.containerName).visible = true;
						setTimeout(() => {
							scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
						}, 2000);
					});
				}
				/*
				//close popup
				if (intersect.object.name == 'Close'){
					showCloseWindow(false);
				}
				if (intersect.object.name == 'Ok'){
					restartSimulation();
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
					if (intersect.object.parent.name == el.name){
						scene.getObjectByName(el.name).parent.setState('selected');
						el.state = "selected";
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

function getObjectId(objName){
	let elementId = -1;
	objectsParams.interactiveObjectList.forEach(element => {
		if (element.objName == objName)
			elementId = element.id;
	});
	return elementId;
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
	IntroObjects.contentContainerObj = new ThreeMeshUI.Block({
		height: 3.0,
		width: params.width,
		alignContent: "left",
		justifyContent: "start",
		padding: 0.1,
		backgroundColor: params.lightColor,
		backgroundOpacity: 1,
	  });  
	container.add(titleBlock, IntroObjects.contentContainerObj);
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
	IntroObjects.contentContainerObj.add(IntroObjects.contentTextObj);
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

	popupGroup.position.set(0.0, 2.16, -2.6);
	popupGroup.add(container);
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
	popupGroup.position.set(0.0, 2.6, -2.6);
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
	popupGroup.position.set(0.0, 2.16, -2.6);
	popupGroup.false = true;
	scene.add(popupGroup);
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

function showCurrentSimulationStep(){
	scene.getObjectByName(IntroObjects.IntroContainerName).visible = false;
	scene.getObjectByName(QuizzObjects.QuizzContainerName).visible = false;
	scene.getObjectByName(correctIncorrectObjects.containerName).visible = false;
	doGlowObjectsInvisible();

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
		}
	}
	if (PPE_DATA.vrSim.sim[simulationStep].type === 'quizz'){
		PPE_DATA.vrSim.sim[simulationStep].highlightedObjectNames.forEach(element => {
			scene.getObjectByName(element + 'Glow').visible = true;
		}); console.log('simulationStep=', simulationStep)
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
}

export default App;