import { html, LitElement } from 'lit';
import { selectQuestMissions, selectCurrentMission } from '../selectors/quest.selectors';
import { store } from '../store';
import { connect } from 'pwa-helpers/connect-mixin';
import {
  Vector2,
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  DirectionalLight,
  AmbientLight,
  Raycaster,
  Color,
  VectorKeyframeTrack,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  OrthographicCamera,
  Vector4,
  SpotLight,
  Vector3,
  Quaternion
} from 'three';

import { OrbitControls } from '../threejs-utilities/OrbitControls'
import { FpsCtrl } from '../threejs-utilities/frame-control';
import mapService from '../services/map.service';
import message_service from '../services/message.service';

import {
  Grid,
  prepareMap
} from '../threejs-utilities/mapgrid'

import './my-avatar.component';
import './mission-details.component';

let styles = html`
  <style>
  #hexmap {
    display:block;
    background-color: white;
    width: 100%;
    height: 30vh;
    min-height: 300px;
    margin: 3.5rem auto 0;
    overflow: hidden;
  }

  #missionInfo {
    position: fixed;
    left: 0;
    top: 0;
    min-width: 100px;
    text-align: center;
    padding: 5px 12px;
    font-family: monospace;
    background: #f7f7f7;
    display: none;
    opacity: 0;
    border: 1px solid black;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
    transition: opacity 0.25s linear;
    border-radius: 3px;
    z-index: 5;
  }

  #missionDetails {
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    min-width: 100px;
    text-align: center;
    padding: 5px 12px;
    font-family: monospace;
    background: #f7f7f7;
    display: none;
    opacity: 0;
    border: 1px solid black;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
    transition: opacity 0.25s linear;
    border-radius: 3px;
    z-index: 5;
  }
  </style>
`;

const displayConstants = {
  minHeight: 300, // minimum map height
  mapHeightRelative: 30/100,
  padding: 15,
  popupShowWait: 100,
  popupHideWait: 250
}

class HexMap extends connect(store)(LitElement) {
  render() {
    return html`
      ${styles}
      <canvas id='hexmap'></canvas>
      <div id="missionInfo"></div>
      <div id="missionDetails">
        <e-mission-details></e-mission-details>
      </div>
    `;
  }

  constructor() {
    super();
    this.showingPopup = undefined;
    this.showTimeout=undefined;
  }

  click() {
    if (this.grid.highlighted) {
      const selected = this.grid.highlighted;
      this.grid.clearHighlight();
      this.grid.selected = selected;
      const tile = this.grid.selected.gridPoint.tile;
      const region = this.grid.map.findRegion(tile);
      if (tile._mission) {
        mapService.setMapMission(tile._mission);
        message_service.getAllMessagesDuringQuest(tile._mission.heroUserPrincipleName, tile._mission.questId);

        this.displayMissionDetails(tile);
      } else {
        mapService.setMapMission(null);
      }
      if (!region.selected) {
        this.grid.map.deselectRegion();
        region.selected = true;
        this.moveCameraToRegion(region);
      }
    } else {
      mapService.setMapMission(null);
      this.displayMissionDetails(null);
      this.grid.clearSelection();
    }
  }

  displayMissionDetails(tile) {
    if (!tile) {
      setTimeout(() => this.missionInfoDetailsDiv.style.display = 'none', displayConstants.popupShowWait);
      return;
    }

    if (!tile._name)
      this.missionInfoDetailsDiv.innerText = 'Keep learning to unlock the details of this area. Press Esc to zoom out.';
    setTimeout(() => {
      this.missionInfoDetailsDiv.style.display = 'block';
      this.missionInfoDetailsDiv.style.opacity = 0.7;
    }, displayConstants.popupHideWait);
  }

  /**
   * Check whether there have been changes to canvas size
   * @returns true if resized, false otherwise
   */
  resizeRendererToDisplaySize() {
    // pixel ratio can change when the broswer screen is moved between devices
    const pixelRatio = window.devicePixelRatio;
    const cWidth = this.canvas.clientWidth * pixelRatio | 0;
    const cHeight = this.canvas.clientHeight * pixelRatio | 0;
    let currentSize = new Vector2();
    this.renderer.getSize(currentSize);
    const needResize =  currentSize.height!==cHeight || currentSize.width!==cWidth ;
    if (needResize) {
      this.canvasAspect = cWidth/cHeight;
      this.renderer.setSize(cWidth, cHeight, false);
      this.resizeMissionDetailsDisplay();
    }
    return needResize;
  }

  mouseMove(event) {
    const mouse = new Vector2();
    // number of pixels on the device per 'html' pixel
    const pixelRatio = window.devicePixelRatio;
    // x and y coordinates of the mouse (in html pixels), converted to device pixels
    const point = { x: event.offsetX * pixelRatio, y: event.offsetY * pixelRatio };
    if (point.x > 0 && point.y > 0) {
      // convert x and y coordinates in device range (0 to width, 0 to height) to a vector (-1 to 1, -1 to 1)
      mouse.x = (point.x / this.canvas.width) * 2 - 1;
      mouse.y = -(point.y / this.canvas.height) * 2 + 1;
      this.raycaster.setFromCamera(mouse, this.camera);
      const absPoint = { x: event.x, y: event.y };
      const tile = this.grid.doHighlight(this.raycaster.intersectObjects(this.grid.hexes));
      this.displayMissionInfo(absPoint, tile);
    }
  }

  /**
   * Main render function. This will be called in a loop for each frame
   * TODO: separate render from update
   */
  renderScene(frameInfo) {
    const { camera, minimapCamera } = this.cameras;
    // This is update logic
    if (camera.isMoving || camera.animationMixer) {
      if (camera.animationMixer) {
        if (camera.animationAction.paused || !camera.animationAction.enabled) {
          camera.animationAction = null;
          camera.animationMixer = null;
          camera.isMoving = false;
          // when we are done movingthe camera, update orbit target
          this.controls.target.copy(this.camera.position);
          this.controls.target.add(this.targetDiff);
          this.controls.update();
        } else {
          camera.animationMixer.update(frameInfo.delta);
        }
      }
    }

    // this is render logic
    if (this.resizeRendererToDisplaySize()) {
      camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      camera.updateProjectionMatrix();

      minimapCamera.aspect = 1;
      minimapCamera.updateProjectionMatrix();
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    const currentViewport = new Vector4();
    this.renderer.getViewport(currentViewport);

    const size = Math.max(Math.min(1000, currentViewport.width, currentViewport.height)/2 - 2 * displayConstants.padding,0);

    this.renderer.setViewport(displayConstants.padding, displayConstants.padding, size, size);
    this.renderer.setScissor(displayConstants.padding, displayConstants.padding, size, size);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, minimapCamera);

    this.renderer.setViewport(currentViewport);
    this.renderer.setScissor(currentViewport);
    this.renderer.setScissorTest(false);
  }

  displayMissionInfo(point, tile) {
    if (screen.width < 460)
      return;

    if (!tile && !this.showingPopup) {
      return;
    }

    if (!tile && this.showingPopup) {
      if(this.showTimeout){
        clearTimeout(this.showTimeout);
        this.showTimeout=undefined;
      }
      this.showTimeout = setTimeout(() => {
        this.missionInfoDiv.style.display = 'none';
        this.showingPopup=undefined;
      }, displayConstants.popupHideWait);
      return;
    }

    if (tile._name) {
      this.missionInfoDiv.innerText = `${tile._name}`;

      if (tile._mission.dateCompleted)
        this.missionInfoDiv.style.background = '#a0c020';
      else
        this.missionInfoDiv.style.background = '#f7f7f7';
    } else {
      this.missionInfoDiv.style.background = '#f7f7f7';
      this.missionInfoDiv.innerText = 'Keep learning to unlock the details of this area. Press Esc to zoom out.';
    }

    if(this.showingPopup){
      // already showing a popup
      if(this.getDistanceBetween(this.showingPopup, point)>20){
        this.placePopup(point);
      }
    } else {
      if(this.showTimeout){
        clearTimeout(this.showTimeout);
        this.showTimeout=undefined;
      }
      this.showTimeout = setTimeout(() => {
        this.missionInfoDiv.style.display = 'block';
        this.missionInfoDiv.style.opacity = 0.8;
        this.placePopup(point);
        this.showingPopup=point;
      }, displayConstants.popupShowWait);
    }
  }

  placePopup(point){
    const tooltipWidth = this.missionInfoDiv.offsetWidth;
    const tooltipHeight = this.missionInfoDiv.offsetHeight;
    this.missionInfoDiv.style.left = `${point.x - tooltipWidth / 2}px`;
    this.missionInfoDiv.style.top = `${point.y - tooltipHeight - 40}px`;
  }

  getDistanceBetween(pointA,  pointB){
    return Math.sqrt( (pointA.x-pointB.x)**2 + (pointA.y-pointB.y)**2 ) ;
  }

  calculateOptimalCanvasSize(canvas){
    let { width, height, top, right } = canvas.getBoundingClientRect();
    if(height<displayConstants.minHeight){
      height = displayConstants.minHeight;
    }
    width++;
    height++;
    return {
      width, height, top, right, aspect: width/height
    }
  }

  /**
   * Prepare the canvas by setting the details after layout completes
   * @param {HMTLCanvas} canvas
   */
  prepareCanvas(canvas) {
    const { width, height, top, right, aspect } = this.calculateOptimalCanvasSize(canvas);
    canvas.width = width;
    canvas.height = height;
    canvas.top = top;
    canvas.right = right;
    this.canvasAspect=aspect;
    return canvas;
  }

  /**
   * Prepare cameras for perspective and minimap view
   */
  prepareCameras() {
    if(!this.cameras ||!this.cameras.length){
    const fov = 70;
    const aspect = this.canvasAspect; // the canvas default
    const near = 0.1;
    const far = 100;

    const camera = new PerspectiveCamera(fov, aspect, near, far);
    camera.up.set(0, 1, 0);
    this.grid.setProjectionLayer(camera);

    const minimapCamera = new OrthographicCamera(5, -5, -5, 5, 4.5, 5.5);
    minimapCamera.position.set(0, 5, 0);
    minimapCamera.up.set(0, 0, 1);
    minimapCamera.lookAt(0, 0, 0);
    this.grid.setMinimapLayer(minimapCamera);

    this.scene.add(camera);
    this.scene.add(minimapCamera);

    return { camera, minimapCamera };
    }
  }

  prepareCameraControls(){
    var controls = new OrbitControls( this.camera, this.renderer.domElement );
    return controls;
  }


  /**
   * Prepare lightsource for main scene
   */
  prepareDirectionalLightSource() {
    const color = 0xffffff;
    const intensity = 0.6;
    const light = new DirectionalLight(color, intensity);
    light.position.set(0, 2, 4);
    return light;
  }

  /**
   * Zoom camera  out to pre-defined posision
   */
  zoomOut() {
      this.moveCamera(this.startingPosition);
  }

  /**
   * Move perspective camera to specified position
   * @param {camera-position} cameraPositionTo
   */
  moveCamera(cameraPositionTo) {
    const keyFrames = new VectorKeyframeTrack(".position", [0, 2.5], [
      this.camera.position.x, this.camera.position.y, this.camera.position.z,
      cameraPositionTo.x, this.camera.position.y, cameraPositionTo.z
    ]);
    const clip = new AnimationClip('CameraMovement', 3, [keyFrames]);
    const mixer = new AnimationMixer(this.camera);
    const clipAction = mixer.clipAction(clip);
    clipAction.setLoop(LoopOnce);
    clipAction.clampWhenFinished = true;
    clipAction.play();

    this.camera.animationAction = clipAction;
    this.camera.animationMixer = mixer;
    this.camera.isMoving = true;
  }

  /**
   * Move camera to focus on the bottom of the specified region
   * @param {Region} region
   */
  moveCameraToRegion(region) {
    const {x:oldX, y:oldY, z:oldZ} = this.camera.position;
    const lowestTile = region.findLowestTile();
    const cameraPositionTo = this.grid.findCameraPositionForTile(lowestTile);

    if (cameraPositionTo.z !== oldZ || cameraPositionTo.x !== oldX) {
      this.moveCamera(cameraPositionTo);
    }
  }

  /**
   * Prepare the scene object
   */
  prepareScene() {
    const scene = new Scene();
    scene.background = new Color(0xffffff);
    return scene;
  }

  /**
   * Prepare the renderer object
   */
  prepareRenderer() {
    const renderer = new WebGLRenderer({ canvas: this.canvas, antialias:true });
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    return renderer;
  }

  /**
   * Build and render the grid,map,scene onto the canvas at first load
   */
   renderMap(canvas,missionInfoDiv,missionInfoDetailsDiv) {
        this.missionInfoDiv=missionInfoDiv;
        this.missionInfoDetailsDiv=missionInfoDetailsDiv;
        this.canvas = this.prepareCanvas(canvas);
        this.renderer = this.prepareRenderer();
        this.scene = this.prepareScene();

        this.resizeRendererToDisplaySize();

        this.grid = new Grid(this.canvas, prepareMap(this.missions, this.currMission), false);

        this.cameras = this.prepareCameras();

        this.scene.add(this.grid.plane);
        this.scene.add(this.grid.frontPlane);
        this.scene.add(this.grid.backPlane);
        this.scene.add(this.grid.leftPlane);
        this.scene.add(this.grid.rightPlane);
        this.scene.add(this.grid.minimapPlane);

        const light = this.prepareDirectionalLightSource();
        this.grid.setProjectionLayer(light);
        this.scene.add(light);

        const ambient = new AmbientLight(0xdddddd, 0.3);
        this.grid.setAllLayers(ambient);
        this.scene.add(ambient);

        this.minimapSpotlight = new SpotLight(0xffffff, 0.9);
        this.minimapSpotlight.position.set(0, 0, 0);
        this.minimapSpotlight.angle = Math.PI / 3.4;
        this.grid.setMinimapLayer(this.minimapSpotlight);
        this.minimapSpotlight.target.position.set(0, 0, -1);
        this.camera.add(this.minimapSpotlight);
        this.camera.add(this.minimapSpotlight.target);

        this.raycaster = new Raycaster();
        this.canvas.onmousemove = this.mouseMove.bind(this);
        this.canvas.onclick = this.click.bind(this);

        document.addEventListener('keydown', (event) => {
          const { key } = event;
          if (key === "Escape") {
            this.zoomOut();
          }
        });

        this.frameControl = new FpsCtrl(30, this.renderScene.bind(this)).start();
        this.coneLocation = this.grid.drawLocation();

        this.startingPosition = new Vector3(-0.695, 1.326,4.845);
        this.startingTarget = new Vector3(-0.8, -0.5,  2.5);
        this.targetDiff = new Vector3().copy(this.startingTarget);
        this.targetDiff.sub(this.startingPosition);

        this.controls = this.prepareCameraControls();
        this.controls.target.copy(this.startingTarget);
        this.camera.position.copy(this.startingPosition);
        this.camera.updateProjectionMatrix();

        this.controls.update();
        this.controls.saveState();
  }

  resizeMissionDetailsDisplay(){
    const pixelRatio = window.devicePixelRatio;
    const currentViewport = new Vector4();
    this.renderer.getViewport(currentViewport);
    //viewport is scaled by pixel ratio
    const width = Math.min(1000, currentViewport.width, currentViewport.height)/pixelRatio/2 - 2 * displayConstants.padding;
    const height = currentViewport.height/pixelRatio - 2*displayConstants.padding;

    this.missionInfoDetailsDiv.style.width=`${width}px`;
    this.missionInfoDetailsDiv.style.height=`${height}px`;

    const { x, top, right} = this.canvas.getBoundingClientRect();
    const left = right - width - displayConstants.padding;
    this.missionInfoDetailsDiv.style.top = `${top + displayConstants.padding}px`;
    this.missionInfoDetailsDiv.style.left = `${left}px`;

  }

  get camera() {
    return this.cameras.camera;
  }

  get minimapCamera() {
    return this.cameras.minimapCamera;
  }

  static get properties() {
    return {
      missions: Array,
      mapMission: Object,
      currMission: Object,
      hero: Object
    };
  }

  firstUpdated() {
    mapService.setMapMission(null);
    this.throttleActive = false;
  }

  waitForMap() {
    if (!this.mutationObserver) {
      this.mutationObserver = new MutationObserver((changes, observer) => {
        const {ready, canvas, missionInfoDiv,missionInfoDetailsDiv} = this.getMapComponents();
        if (ready) {
          observer.disconnect();
          this.renderMap(canvas,missionInfoDiv,missionInfoDetailsDiv);
        }
      });
      this.mutationObserver.observe(this.shadowRoot, {
        childList: true,
        subtree: true
      });

    }
  }

  getMapComponents(){
    const canvas = this.shadowRoot.querySelector("canvas");
    const missionInfoDiv = this.shadowRoot.querySelector("#missionInfo");
    const missionInfoDetailsDiv = this.shadowRoot.querySelector("#missionDetails");
    return { ready: canvas && missionInfoDiv && missionInfoDetailsDiv,
      canvas,
      missionInfoDiv,
      missionInfoDetailsDiv };
  }

  mapRendered(){
    return this.canvas!==undefined;
  }

  stateChanged(state) {
    //TODO: once old quests are added to the map, the missions and guide for these quests will have to be retrieved and assigned to tiles
    this.missions = selectQuestMissions(state);
    this.currMission = selectCurrentMission(state);

    // check that all data required for rendering the map is available (and that the map has not already been initialized)
    if (this.missions && this.missions.length && this.currMission && !this.mapRendered()) {
      const {ready, canvas, missionInfoDiv,missionInfoDetailsDiv} = this.getMapComponents();
      if (ready) {
        // All data loaded, canvas already available in the shadowRoot
        this.renderMap(canvas,missionInfoDiv,missionInfoDetailsDiv);
      } else{
        // All data loaded but canvas is not yet available in the shadow root
        this.waitForMap();
      }
    }
  }

  disconnectedCallback(){
    if(this.frameControl){
      this.frameControl.stop();
    } else {
      // This should never happen, so let's warn when it does
      console.warn("This hex-map has no frame control!!")
    }
    super.disconnectedCallback();
  }
}

window.customElements.define('e-hex-map', HexMap);