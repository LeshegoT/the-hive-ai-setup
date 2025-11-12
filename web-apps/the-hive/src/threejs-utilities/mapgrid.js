import {
  MeshPhongMaterial,
  CylinderGeometry,
  Mesh,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  PlaneGeometry,
  TextureLoader,
  DoubleSide,
  CanvasTexture,
  MeshLambertMaterial,
  TorusGeometry
} from "three";
import { Reflector } from './reflector';
import { getRegions, translateRegionTo } from './mapgen'

class Tile {
  constructor(name, position, region, mission, current) {
    this._name = name;
    this._position = position;
    this._region = region;
    this._mission = mission;
    this._current = current;
  }

  get current() {
    return this._current;
  }

  get name() {
    return this._name;
  }

  get position() {
    return this._position;
  }

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  get region() {
    return this._region;
  }

  set region(region) {
    this._region = region;
  }

  get enabled() {
    return this._region.enabled;
  }

  set mission(mission) {
    this._mission = mission;
  }

  get mission() {
    return this._mission;
  }
}

class Region {
  constructor(name, tiles, enabled) {
    this._tiles = [];
    this._name = name;
    this._enabled = enabled || false;
    this._selected = false;
    for (const tile of tiles) {
      if (tile instanceof Tile) {
        tile.region = this;
        this._tiles.push(tile);
      } else {
        this._tiles.push(new Tile(tile.name, tile, this, tile.mission));
      }
    }
  }

  get tiles() {
    return this._tiles;
  }

  get name() {
    return this._name;
  }

  get enabled() {
    return this._enabled;
  }

  get selected() {
    return this._selected;
  }

  set selected(selected) {
    this._selected = selected;
  }

  get size(){
    this._tiles.length;
  }

  isTileInRegion(tile) {
    return this.tiles.includes(tile);
  }

  findLowestTile() {
    const minY = Math.min(...this.tiles.map(tile => tile.y));
    const tile = this.tiles.filter(tile => tile.y === minY);
    return tile[0];
  }
}

class Map {
  constructor(size, regions) {
    this._size = size;
    this._regions = [];
    for (const region of regions) {
      if (region instanceof Region) {
        this._regions.push(region);
      } else {
        this._regions.push(new Region(region.name, region))
      }
    }
  }

  get size() {
    return this._size;
  }

  get regions() {
    return this._regions;
  }

  get tiles() {
    return this.regions.flatMap(region => region.tiles);
  }

  deselectRegion() {
    this.regions.filter(region => region.selected).forEach(region => region.selected = false);
  }

  findRegion(tile) {
    for (const region of this.regions) {
      if (region.isTileInRegion(tile)) {
        return region;
      }
    }
    return undefined;
  }
}
class GridPoint {
  constructor(grid, x, y) {
    this.grid = grid;
    this.x = x;
    this.y = y;
    this._tile = undefined;
  }

  get tile() {
    return this._tile;
  }

  set tile(tile) {
    this._tile = tile;
  }
}
class Materials {

  constructor() {
    function intersectShader(shader) {
      shader.fragmentShader = shader.fragmentShader.replace(
        `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
        `gl_FragColor = ( gl_FrontFacing ) ? vec4( outgoingLight, diffuseColor.a ) : vec4( diffuse, opacity );`
      );
    };
    this.planeMaterial = new MeshBasicMaterial({ color: 0xAAAAAA, opacity: 0.8, transparent: true });
    this.minimapPlaneMaterial = new MeshPhongMaterial({ color: 0xcccccc, opacity: 1, transparent: false });
    this.dotMaterial = new MeshPhongMaterial({ color: 0xFF1111 });
    this.normalMaterial = new MeshPhongMaterial({ color: 0xFF2222 });
    this.completedMissionMaterial = new MeshPhongMaterial({ color: 0x66AD66 });
    this.disabledMaterial = new MeshPhongMaterial({ color: 0x999999  });
    this.selectedMaterial = new MeshPhongMaterial({ color: 0x4444CF });
    this.highlightedMaterial = new MeshPhongMaterial({ color: 0x58D9D6});
    this.specialMissionMaterial = new MeshPhongMaterial({ color: 0xf7f7f7, emissive: 0xf7f7f7,emissiveIntensity:0.2 });
    this.coneMaterial = new MeshPhongMaterial({ color: 0x007FFF, emissive: 0xf7f7f7, emissiveIntensity:0.1, shininess:50, side: DoubleSide});
    this.coneMaterial.onBeforeCompile = intersectShader;
  }
}

class Geometries {
  constructor(grid) {
    this.planeGeometry = new PlaneBufferGeometry(10, 10);
    this.sidePlaneGeometry = new PlaneBufferGeometry(100, 30);
    const radius = this.planeGeometry.parameters.width / grid.map.size / 2;
    const height = radius * 0.3;
    const radialSegments = 6;
    this.hexGeometry = new CylinderGeometry(radius, radius, height, radialSegments);
    this.dotGeometry = new SphereGeometry(0.01);
    this.sphere = new SphereGeometry(radius/2);
    this.cone = new CylinderGeometry(radius/2, 0, 1/3, 36, 1, true);

    // hex geomerty: s = (2 (r sin a)) where a is the angle of half a segment - or 30 degrees (360/12) or (2Pi/12=> Pi/6)
    // plane geomerty (d = side length of plane and s = side-length of hex) d = (3-sqrt(3)) s
    let s = 2 * radius * Math.sin(Math.PI / 6);
    let d = s * (3 - Math.sqrt(3));
    this.iconPlaneGeometry = new PlaneGeometry(d, d);
  }
}

class Grid {
  constructor(canvas, map, drawdots) {
    this.canvas = canvas;
    this.map = map;
    this._materials = new Materials();
    this._geometries = new Geometries(this);
    this._selected = undefined;
    this._highlighted = undefined;
    this.drawdots = drawdots || false;
    this.layers = {
      'projection': 0,
      'minimap': 1
    }

    this.gridPoints = [];
    this.dots = [];
    this.hexes = [];
    this._plane = new Mesh(this.geometries.planeGeometry, this.materials.planeMaterial);
    this.plane.position.set(0, 0, 0);
    this.plane.name = "plane";
    this.plane.rotation.x = -1 * Math.PI / 2;
    this.setProjectionLayer(this.plane);

    this._frontPlane = new Mesh(this.geometries.planeGeometry, this.materials.planeMaterial);
    this.frontPlane.position.set(0, 0, 10);
    this.frontPlane.name = "frontplane";
    this.frontPlane.rotation.x = -1 * Math.PI / 2;
    this.setProjectionLayer(this.frontPlane);

    this._backPlane = new Mesh(this.geometries.planeGeometry, this.materials.planeMaterial);
    this.backPlane.position.set(0, 0, -10);
    this.backPlane.name = "backplane";
    this.backPlane.rotation.x = -1 * Math.PI / 2;
    this.setProjectionLayer(this.backPlane);

    this._leftPlane = new Mesh(this.geometries.sidePlaneGeometry, this.materials.planeMaterial);
    this.leftPlane.position.set(-55, 0, 0);
    this.leftPlane.name = "leftPlane";
    this.leftPlane.rotation.x = -1 * Math.PI / 2;
    this.setProjectionLayer(this.leftPlane);

    this._rightPlane = new Mesh(this.geometries.sidePlaneGeometry, this.materials.planeMaterial);
    this.rightPlane.position.set(55, 0, 0);
    this.rightPlane.name = "rightPlane";
    this.rightPlane.rotation.x = -1 * Math.PI / 2;
    this.setProjectionLayer(this.rightPlane);

    this.addGroundMirror();
    this._minimapPlane = new Mesh(this.geometries.planeGeometry, this.materials.minimapPlaneMaterial);
    this.minimapPlane.position.set(0, 0, 0);
    this.minimapPlane.name = "minimapplane";
    this.minimapPlane.rotation.x = -1 * Math.PI / 2;
    this.setMinimapLayer(this.minimapPlane);

    this.populateGridPoints();
    this.shownPoints = this.convertMapToGridPoints();
    this.addHexes();
    if(this.drawdots){
      this.drawCenterDot();
    }
  }

  get materials() { return this._materials; }
  get geometries() { return this._geometries; }
  get plane() { return this._plane; }
  get frontPlane() { return this._frontPlane; }
  get backPlane() { return this._backPlane; }
  get leftPlane() { return this._leftPlane; }
  get rightPlane() { return this._rightPlane; }
  get minimapPlane() { return this._minimapPlane; }
  get width() { return this.plane.geometry.parameters.width }
  get height() { return this.plane.geometry.parameters.height }
  get center() { return { x: this.width / 2, y: this.height / 2 }; }
  get projectionLayer() { return this.layers.projection };
  get minimapLayer() { return this.layers.minimap };

  get selected() {
    return this._selected;
  }

  set selected(selectedElement) {
    if (selectedElement !== this._selected) {
      this.clearSelection();
      this._selected = selectedElement;
      this._selected.scale.set(1.2, 1.2, 1.2);
      this._selected.position.z = this._selected.position.z + 0.1;
    }
  }

  get highlighted() {
    return this._highlighted;
  }

  set highlighted(element) {
    const highlightedElement = element;
    if (highlightedElement !== this._highlighted) {
      this.clearHighlight();
      this._highlighted = highlightedElement;
      highlightedElement.material = this.materials.highlightedMaterial;
      highlightedElement.scale.set(1.1, 1.1, 1.1);
      highlightedElement.position.z = highlightedElement.position.z + 0.075;
    }
  }

  findCurrentMissionHex() {
    return this.hexes.filter(h => h.gridPoint.tile.current)[0];
  }

  drawLocation() {
    const cone = new Mesh(this.geometries.cone, this.materials.coneMaterial);
    const sphere = new Mesh(this.geometries.sphere, this.materials.coneMaterial);
    sphere.position.set(0,1/6,0);
    cone.add(sphere);
    cone.name = 'location-cone';
    cone.rotation.x = Math.PI;
    cone.position.set(0, -0.5, 0);
    this.findCurrentMissionHex().add(cone);
    this._cone = cone;
    return cone;
  }

  makeImage(svg, callback, dimensions) {
    // TODO: Re-use canvasses where the canvas for the SVG has already been created
    let image = new Image();
    if (!dimensions) {
      dimensions = { width: 512, height: 512 }
    }
    if (typeof svg === 'string') {
      image.src = svg;
    } else {
      svg.setAttribute('width', dimensions.width + 'px');
      svg.setAttribute('height', dimensions.height + 'px');
      image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg.outerHTML)));
    }
    image.onload = () => {
      //image has loaded and now we can us it to draw on a canvas!
      var canvas = document.createElement('canvas');
      canvas.height = dimensions.width;
      canvas.width = dimensions.height;
      var context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.strokeStyle = "#ff0000";
      context.fillStyle='#ff0000';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      callback(canvas);
    }
  }

  setAllLayers(object) {
    object.layers.disableAll();
    object.layers.enable(this.projectionLayer);
    object.layers.enable(this.minimapLayer);
  }

  setMinimapLayer(object) {
    object.layers.disableAll();
    object.layers.enable(this.minimapLayer);
  }

  setProjectionLayer(object) {
    object.layers.disableAll();
    object.layers.enable(this.projectionLayer);
  }

  convertMapToGridPoints() {
    const points = [];
    for (const tile of this.map.tiles) {
      const gridPoint = this.mapCoordToGridPoint(tile, false);
      if (!gridPoint) {
        console.error("Point", tile, "not found in grid!");
      } else {
        gridPoint.tile = tile;
        points.push(gridPoint);
      }
    }
    return points;
  }

  removeDots() {
    for (const dot of this.dots) {
      this.plane.remove(dot);
    }
  }

  drawDots() {
    for (const gridPoint of this.gridPoints) {
      const dot = new Mesh(this.geometries.dotGeometry, this.materials.dotMaterial);
      dot.position.set(gridPoint.x, gridPoint.y, 0.01);
      this.plane.add(dot);
      this.dots.push(dot);
    }
  }

  drawCenterDot(){
    const centerDot = new Mesh(this.geometries.sphere, this.materials.coneMaterial);
    centerDot.position.set(0, 0, 0.05);
    this.plane.add(centerDot);
    this.dots.push(centerDot);
  }

  populateGridPoints() {
    for (let y = 0; y <= this.map.size; y++) {
      for (let x = 0; x <= this.map.size; x++) {
        const gridPoint = this.mapCoordToGridPoint({ x, y }, true);
        if (gridPoint && this.drawdots) {
          const dot = new Mesh(this.geometries.dotGeometry, this.materials.dotMaterial);
          dot.position.set(gridPoint.x, gridPoint.y, 0.01);
          this.plane.add(dot);
          this.dots.push(dot);
        }
      }
    }
  }

  mapCoordToGridPoint(point, create) {
    const delX = this.width / this.map.size;
    const delY = this.height / this.map.size;
    const offsetX = this.width / this.map.size / 2;
    const x = -this.center.x + point.x * delX + (point.y % 2 * offsetX);
    const y = -this.center.y + point.y * delY;
    if (this.isInPlane(x, y)) {
      return this.findGridPoint({ x, y }, create);
    }
    return undefined;
  }

  findGridPoint(pointCoords, create) {
    // TODO: find the gridpoint closest to the given coordinates
    let gridPoint = this.gridPoints.find((gP) => gP.x == pointCoords.x && gP.y == pointCoords.y);
    if (!gridPoint && create) {
      gridPoint = new GridPoint(this, pointCoords.x, pointCoords.y);
      this.gridPoints.push(gridPoint);
    }
    return gridPoint;
  }


  /**
   * Generate hexes for all grid points on the map
   */
  addHexes() {
    for (const gridPoint of this.shownPoints) {
      this.addHex(gridPoint)
    }
  }

  getMaterialFor(tile) {
    let material = this.materials.disabledMaterial;
    if (tile.enabled) {
      material = this.materials.normalMaterial;
      if (tile.mission) {
        if (tile.mission.dateCompleted) {
          material = this.materials.completedMissionMaterial;
        } else {
          if (tile.mission.type) {
            switch (tile.mission.type.code) {
              case 'conversation':
                material = this.materials.specialMissionMaterial;
                break;
              case 'self-directed':
                material = this.materials.specialMissionMaterial;
                break;
            }
          } else {
            console.warn("Tile does not have mission type", tile);
          }
        }
      }
    }
    return material;
  }

  addHex(gridPoint) {
    const material = this.getMaterialFor(gridPoint.tile);

    const hex = new Mesh(this.geometries.hexGeometry, material);
    hex.name = 'hexagon';
    hex.gridPoint = gridPoint;
    hex.position.set(gridPoint.x, gridPoint.y, hex.geometry.parameters.height);
    hex.rotation.x = - Math.PI / 2;
    this.setAllLayers(hex);

    if (gridPoint.tile.mission) {
      const mission = gridPoint.tile.mission;
      const icon = (mission.type&&mission.type.icon)?mission.type.icon:'images/logos/mission.svg';

      function makeMissionPlane(canvas) {
        const texture = new CanvasTexture(canvas);
        // Create material
        const material = new MeshPhongMaterial({ map: texture, transparent: true });

        let plane = new Mesh(this.geometries.iconPlaneGeometry, material);
        let h = this.geometries.hexGeometry.parameters.height / 2;
        plane.position.set(0, -1.01 * h, 0);
        plane.rotation.x = Math.PI / 2;
        hex.add(plane);
        this.setProjectionLayer(plane);
      }
      this.makeImage(icon, makeMissionPlane.bind(this));
    }

    this.plane.add(hex);
    this.hexes.push(hex);
  }

  addGroundMirror() {
    const pixelRatio = window.devicePixelRatio;
    this.groundMirror = new Reflector(this.plane.geometry, {
      clipBias: 0.003,
      textureWidth: this.canvas.clientWidth * pixelRatio | 0,
      textureHeight: this.canvas.clientHeight * pixelRatio | 0,
      color: 0x000000
    });
    this.groundMirror.position.set(0, -0.25, -0.01);
    this.plane.add(this.groundMirror);
  }

  isInPlane(x, y) {
    return x > -this.center.x && y > -this.center.y && x < this.center.x && y < this.center.y
  }

  clearSelection() {
    if (this._selected) {
      const deselected = this._selected;
      this._selected = undefined;
      deselected.scale.set(1, 1, 1);
      deselected.position.z = deselected.position.z - 0.1;
    }
  }

  clearHighlight() {
    if (this._highlighted) {
      const deselected = this._highlighted;
      this._highlighted = undefined;
      deselected.material = this.getMaterialFor(deselected.gridPoint.tile);
      deselected.scale.set(1, 1, 1);
      deselected.position.z = deselected.position.z - 0.075;
    }
  }

  doHighlight(intersections) {
    if (intersections[0] &&
      intersections[0].object.gridPoint.tile.enabled &&
      intersections[0].object !== this.selected) {
      this.highlighted = intersections[0].object;
      return this.highlighted.gridPoint._tile;
    } else {
      this.clearHighlight();
      return null;
    }
  }

  findCameraPositionForTile(tile) {
    const gridPoint = this.mapCoordToGridPoint(tile.position, false);
    const newX = gridPoint.x;
    const newZ = 1.5 - gridPoint.y; // y axis on the grid is z axis in the scene
    return { x: newX, z: newZ };
  }
}

function createCentreRegion(missions, currMission) {
  let userMissions = [...missions];
  const possibleTiles = [
    { x: 7, y: 3 },
    { x: 8, y: 3 },
    { x: 9, y: 2 },
    { x: 9, y: 3 },
    { x: 8, y: 4 },
    { x: 9, y: 4 },
    { x: 6, y: 3 },
    { x: 7, y: 5 },
    { x: 7, y: 4 },
    { x: 8, y: 5 },
    { x: 8, y: 6 },
    { x: 9, y: 5 },
    { x: 9, y: 6 },
    { x: 8, y: 7 },
    { x: 8, y: 2 },
    { x: 10, y: 2 },
    { x: 11, y: 2 },
    { x: 10, y: 3 },
    { x: 10, y: 4},
    { x: 10, y: 5 },
    { x: 11, y: 3 },
    { x: 11, y: 4 },
    { x: 11, y: 5 },
    { x: 12, y: 2 },
  ];

  const showableTiles = possibleTiles.length-2;

  if(userMissions.length>showableTiles){
    console.warn(`This user has more than ${showableTiles} missions, we will not be able to show them all on the map`)
    const newMissions = userMissions.slice(userMissions.length-showableTiles,userMissions.length);
    if(newMissions.find(mission => mission.missionId===currMission.missionId)){
      userMissions=newMissions;
      console.warn(`Showing last ${showableTiles} missions`);
    } else {
      console.warn(`Showing first ${showableTiles} missions`)
      userMissions=userMissions.slice(0,showableTiles);;
    }
  }

  const conversationMission = {
    name: 'Guide Conversation',
    heroUserPrincipleName: userMissions[0].heroUserPrincipleName,
    questId: userMissions[0].questId,
    type:{ code: 'conversation', icon: 'images/logos/messages.svg' }
  };
  userMissions.push(conversationMission);

  const selfDirectedMission = {
    name: 'Self-directed Missions',
    heroUserPrincipleName: userMissions[0].heroUserPrincipleName,
    questId: userMissions[0].questId,
    type: { code: 'self-directed', icon: 'images/logos/mission.svg' }
  };
  userMissions.push(selfDirectedMission);

  userMissions.reverse();

  let selectedTiles = [];
  for (let i = 0; i < userMissions.length; i++) {
    if(possibleTiles[i]){
      const tile = new Tile(userMissions[i].name, possibleTiles[i], null, userMissions[i], userMissions[i].missionId === currMission.missionId);
      selectedTiles.push(tile);
    }
  }

  return new Region('center', selectedTiles, true);
}

function prepareMap(missions, currMission) {
  const centreRegion = createCentreRegion(missions, currMission);
  const regionsWith2 = getRegions(2);

  const regions = [
    centreRegion,
    new Region('singlet', translateRegionTo(getRegions(1)[0], { x: 3, y: 3 })),
    new Region('doublet', translateRegionTo(regionsWith2[0], { x: 5, y: 1 })),
    new Region('west', [{ x: 1, y: 10 },
    { x: 1, y: 9 },
    { x: 1, y: 8 },
    { x: 2, y: 8 },
    { x: 3, y: 8 },
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 4, y: 7 },
    { x: 1, y: 6 },
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 1, y: 5 },
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 4, y: 5 }
    ]),
    new Region('north', [{ x: 11, y: 10 },
    { x: 12, y: 10 },
    { x: 10, y: 9 },
    { x: 11, y: 9 },
    { x: 12, y: 9 },
    { x: 11, y: 8 },
    { x: 12, y: 8 }
    ]),
    new Region('islet', [{ x: 6, y: 13 },
    { x: 7, y: 13 },
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
    { x: 6, y: 11 },
    { x: 5, y: 11 }
    ], true),
    new Region('continent', [{ x: 10, y: 19 },
    { x: 11, y: 19 },
    { x: 12, y: 19 },
    { x: 13, y: 19 },
    { x: 14, y: 19 },
    { x: 15, y: 19 },
    { x: 10, y: 18 },
    { x: 11, y: 18 },
    { x: 12, y: 18 },
    { x: 13, y: 18 },
    { x: 14, y: 18 },
    { x: 10, y: 17 },
    { x: 11, y: 17 },
    { x: 13, y: 17 },
    { x: 14, y: 17 },
    { x: 14, y: 16 },
    { x: 15, y: 16 }
    ], false),
    new Region('singleton', translateRegionTo(getRegions(1)[0], { x: 17, y: 10 })),
    new Region('east', [{ x: 16, y: 6 },
    { x: 17, y: 6 },
    { x: 18, y: 6 },
    { x: 14, y: 5 },
    { x: 15, y: 5 },
    { x: 16, y: 5 },
    { x: 17, y: 5 },
    { x: 18, y: 5 },
    { x: 14, y: 4 },
    { x: 15, y: 4 },
    { x: 16, y: 4 },
    { x: 17, y: 4 },
    { x: 14, y: 3 },
    { x: 16, y: 3 }
    ], false)
  ];

  if(centreRegion.size>=16){
    regions.push( new Region('south-east', translateRegionTo(getRegions(4)[0], { x: 11, y: 1 }), false));
  }

  return new Map(20, regions);
}

export {
  Tile,
  Region,
  Map,
  GridPoint,
  Grid,
  Materials,
  Geometries,
  prepareMap
}