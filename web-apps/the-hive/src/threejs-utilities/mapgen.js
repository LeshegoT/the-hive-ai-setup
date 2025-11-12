"use strict;"

/**
 * Get predefined regions with the specified number of tiles.
 * @param {int} tileCount
 */
function getRegions(tileCount) {
  switch (tileCount) {
    case 1: return [[{ x: 0, y: 0 }]];
    case 2: return getTwoElementRegions();
    case 4: return getFourElementRegions();
    default: return null;
  }
}

function getTwoElementRegions() {
  return [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }], // xx
    [{ x: 0, y: 0 }, { x: 1, y: 1 }], // ^x
    [{ x: 0, y: 0 }, { x: 0, y: 1 }]  // x^
  ];
}

function getFourElementRegions(){
  return [
    [{ x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 2 }]
  ];
}

/**
 * Translate a region relative to a new origin
 * This method takes into account the uneven spacing row on the triangular grid
 * @param {Region} region
 * @param {point} newOrigin
 */
function translateRegionTo(region, newOrigin){
  let offsetX=(newOrigin.y+1)%2;
  return region.map( (point) => ({x: point.x+newOrigin.x+offsetX, y: point.y+newOrigin.y }));
}

export {
  getRegions,
  translateRegionTo,
}