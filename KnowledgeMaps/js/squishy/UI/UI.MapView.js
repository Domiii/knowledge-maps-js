/**
 * Some CSS insight on the MapView: http://jsfiddle.net/ZcE46/
 * Note: Requires JQuery.
 */

squishy.UI = {};

/**
 * The MapView uses clipping to only display a small part of a of a zoomable and scrollable map DOM element 
 * of (possibly much) larger dimensions.
 * 
 * @param {Object} config The MapView component and settings.
 * @param {Element} [config.mapEl] The underlying DOM element of the map.
 * @param {Element} [config.viewPortEl] The underlying DOM element of the viewPort (must contain map).
 * @param {Array.<Number, Number>} [config.viewPortPosition] A 2D array, representing the current top and left px coordinates of the viewPort, relative to the map.
 * @param {Number=} [config.zoomStep] The factor to be applied at every step. (Default: 2)
 * @param {Number=} [config.scrollAcceleration] Acceleration factor of ballistic scrolling. (Default: 10)
 * @param {Number=} [config.scrollDamping] Velocity damping of ballistic scrolling. (Default: 1)
 */
squishy.UI.MapView = function(config) {
    // shallow-copy config options into this object
    config.clone(false, this);
    
    squishy.assert(config.mapEl, "config.map is not defined.");
    squishy.assert(config.viewPortEl, "config.viewPortEl is not defined.");
    squishy.assert(config.mapEl.parentNode == config.viewPortEl, "config.viewPortEl must be parent of config.map.");
    
    // set zoom parameters
    this.zoomScale = 1;
    this.zoomStep = this.zoomStep || 2;
    
    // set scroll parameters
    this.scrollAcceleration = this.scrollAcceleration || 10;
    this.scrollDamping = this.scrollDamping || 1;
    this.scrollVelocity = 0;
    
    // associate the view with the map
    this.mapEl.mapView = this;
    
    // don't display the clipped map area
    this.viewPortEl.style.overflow = "hidden";
    
    // viewPort must properly contain the absolute map element
    this.viewPortEl.style.position = "relative";
    this.mapEl.style.position = "absolute";
    
    // initialize position and clipping  of the map element
    this.moveTo(config.viewPortPosition);
    
    // initialize event handlers etc.
    this.initMap();
};


// #############################################################################
// Core methods

/**
 * Translate the viewport of this canvas by delta.
 * 
 * @param {Object.<number, number>} delta
 */
squishy.UI.MapView.prototype.translate = function(delta) {
    // update viewPortPosition
    squishy.UI.MapView.vecAdd(this.viewPortPosition, delta);
    this.updateViewPort();
};

/**
 * Translate the view of this canvas to the given absolute position.
 * 
 * @param pos
 */
squishy.UI.MapView.prototype.moveTo = function(pos) {
    this.viewPortPosition[0] = pos[0];
    this.viewPortPosition[1] = pos[1];
    this.updateViewPort();
};

/**
 * Translate the view of this canvas to the newly updated position.
 * 
 * @private
 * @param pos
 */
squishy.UI.MapView.prototype.updateViewPort = function() {
    /** @const */ var minX = 0;
    /** @const */ var minY = 0;
    
    var width = this.mapEl.offsetWidth;
    var height = this.mapEl.offsetHeight;
    var viewWidth = this.viewPortEl.offsetWidth;
    var viewHeight = this.viewPortEl.offsetHeight;
    
    var left = this.viewPortPosition[0];
    var top = this.viewPortPosition[1];
    var right = left + viewWidth;
    var bottom = top + viewHeight;
    
    // clamp
    left = Math.min(width - viewWidth, left);
    left = Math.max(0, left);
    top = Math.min(height - viewHeight, top);
    top = Math.max(0, top);
    
    // update position
    this.mapEl.style.left = -left + "px";
    this.mapEl.style.top = -top + "px";
    
    
    this.viewPortPosition[0] = left;
    this.viewPortPosition[1] = top;
    
    //// set clipping rectangle
    //this.mapEl.style.clip = "rect(" + top + "px," + right + "px," + bottom + "px," + left + "px)";
};

// #############################################################################
// Event handlers

/**
 * Register events to interact with the canvas.
 * 
 * @private
 */
squishy.UI.MapView.prototype.initMap = function() {
    // intermediate state:
    this.dragAnchor = { active : 0, pos : [0,0], time : 0 };
    this.lastDelta = [0, 0];
    
    // add event listeners
    (function() {
    	var _this = this;
    	
        // start dragging/touching
        this.viewPortEl.addEventListener('mousedown',  function(evt) { _this.onTouchStart(evt); } , false);
        
        // move about
        this.viewPortEl.addEventListener('mousemove',  function(evt) { if (_this.dragAnchor.active) _this.onTouchUpdate(evt); } , false);
        
        // stop dragging/touching
        document.addEventListener('mouseup',  function(evt) { _this.onTouchStop(evt); } , false);
    }).call(this);
};


/**
 * Mouse has been pressed or finger has just started touching the canvas.
 * 
 * @private
 */
squishy.UI.MapView.prototype.onTouchStart = function(evt) {
	evt.preventDefault();
	if (this.dragAnchor.active == 0) {
	    this.setDragAnchor(evt);
    }
	++this.dragAnchor.active;
};

/**
 * Mouse or finger is moving across the canvas, causing a translation.
 * 
 * @private
 */
squishy.UI.MapView.prototype.onTouchUpdate = function(evt) {
    // we moved by delta pixels
    this.getPositionDelta(evt, this.lastDelta);
    
    // translate the viewport
    this.translate(this.lastDelta);
    
    // update anchor
    this.setDragAnchor(evt);
};

/**
 * Mouse is not clicked anymore, or finger has been lifted.
 * 
 * @private
 */
squishy.UI.MapView.prototype.onTouchStop = function(evt) {
	if (this.dragAnchor.active > 0)
		--this.dragAnchor.active;
    
    // TODO: Use last update to determine a velocity and damp off slowly
};


// #############################################################################
// Anchor and position management

/**
 * Click or move update update dragAnchor.
 * 
 * @private
 */
squishy.UI.MapView.prototype.setDragAnchor = function(evt) {
    squishy.getRelativeEventCoordinates(evt, this.dragAnchor.pos);
    this.dragAnchor.time = squishy.getCurrentTimeMillis();
};

/**
 * Copies the current position delta to the given target array, by subtracting the given screen event coordinates from to the last coordinates.
 * 
 * @private
 */
squishy.UI.MapView.prototype.getPositionDelta = function(evt, target) {
    squishy.getRelativeEventCoordinates(evt, target);
    target[0] = this.dragAnchor.pos[0] - target[0];
    target[1] = this.dragAnchor.pos[1] - target[1];
};


// #############################################################################
// Zooming

// TODO: Zoom in on a specific point.

/**
 * Min zoom scale is the greatest scale that allows the viewPort to entirely contain the underlying element.
 */
squishy.UI.MapView.prototype.getMinZoomScale = function() {
    var width = this.mapEl.offsetWidth;
    var height = this.mapEl.offsetHeight;
    var viewWidth = this.viewPortEl.offsetWidth;
    var viewHeight = this.viewPortEl.offsetHeight;
    
    // determine how many steps we must take to make sure that the max ratio is <= 1
    var wRatio = width/viewWidth;
    var hRatio = height/viewHeight;
    var maxRatio = Math.max(wRatio, hRatio);
    
    var zoomStepInv = 1/this.zoomStep;
    var scale = this.zoomScale;
    var i;
    for (i = 0; scale * maxRatio > 1; ++i) {
        scale *= zoomStepInv;
    }
    
    return scale;
};

/**
 * Don't allow magnification.
 */
squishy.UI.MapView.prototype.getMaxZoomScale = function() {
    return 1;
};

squishy.UI.MapView.prototype.setZoomScale = function(zoomScale) {
    // make sure, zoom scale is within bounds
    zoomScale = Math.min(zoomScale, this.getMaxZoomScale());
    zoomScale = Math.max(zoomScale, this.getMinZoomScale());
    
    // move to current position in the new zoom level
    var delta = this.zoomScale - zoomScale;
    if (delta < 0) delta = 1 - delta;
    
    // TODO: Consider sub-pixel accuracy?
    this.viewPortPosition[0] *= delta;
    this.viewPortPosition[1] *= delta;
    this.updateViewPort();
    
    // update zoom scale
    squishy.transformScale(this.mapEl, zoomScale, zoomScale);
    this.zoomScale = zoomScale;
};

squishy.UI.MapView.prototype.zoomIn = function() {
    this.setZoomScale(this.zoomScale * this.zoomStep);
};

squishy.UI.MapView.prototype.zoomOut = function() {
    this.setZoomScale(this.zoomScale / this.zoomStep);
};


// #############################################################################
// Math utilities

/**
 * Adds vec2 to target.
 * 
 * @private
 */
squishy.UI.MapView.vecAdd = function(target, vec2) {
    target[0] += vec2[0];
    target[1] += vec2[1];
};
