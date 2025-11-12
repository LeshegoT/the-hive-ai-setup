"use strict;"

import { Clock } from 'three';

/**
 * Frame information to be passed to the render callback loop
 */
class FrameInfo {
  /**
   * Construct a timeframe information object
   * @param {timestamp} timestamp
   * @param {counter} frameID
   * @param {delta} delta
   */
  constructor(timestamp, frameID,delta){
    this.timestamp=timestamp;
    this.frameID=frameID;
    this.delta=delta;
  }
}
/**
 * This class is responsible for managing the speed of frame generation
 */
class FpsCtrl {
  /**
   * Constructor
   * @param {int} fps number of frames per second
   * @param {renderfunction} callback the rendering function used for each frame
   */
  constructor(fps, callback) {
    this.clock = new Clock();
    this.fps = fps;
    this.delay = 1000 / fps, // calc. time per frame
    this.time = null, // start time
    this.frame = -1, // frame count
    this.tref = undefined; // animationframe id reference
    this.callback = callback; // callback function to call when
    this.running=false;

    this.loop = (timestamp) => {
      if (this.running) {
        if (this.time === null) {
          this.time = timestamp; // init start time
        }
        var seg = Math.floor((timestamp - this.time) / this.delay); // calc frame no.
        if (seg > this.frame) { // moved to next frame?
          let delta = this.clock.getDelta();
          this.frame = seg; // update
          this.callback(new FrameInfo(timestamp, this.frame, delta));
        }
        this.tref = requestAnimationFrame(this.loop);
      }
    }
  }

  /**
   * Initiate rendering loop
   */
  start() {
    this.running=true;
    this.tref = requestAnimationFrame(this.loop);
    return this;
  }

  stop(){
    this.running=false;
  }
}

export { FpsCtrl, FrameInfo }