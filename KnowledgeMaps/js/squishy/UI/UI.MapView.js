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
 * @param {Element} [config.map] The underlying DOM element of the map.
 * @param {Element} [config.viewPort] The underlying DOM element of the viewPort (must contain map).
 * @param {Array.<Number, Number>} [config.viewPortPosition] A 2D array, representing the current top and left px coordinates of the viewPort, relative to the map.
 */
squishy.UI.MapView = function(config) {
    // shallow-copy config options into this object
    config.clone(false, this);
    
    squishy.assert(config.map, "config.map is not defined.");
    squishy.assert(config.viewPort, "config.viewPort is not defined.");
    squishy.assert(config.map.parentNode == config.viewPort, "config.viewPort must be parent of config.map.");
    
    this.map.mapView = this;
    
    // don't display the clipped map area
    this.viewPort.style.overflow = "hidden";
    
    // viewPort must properly contain the absolute map element
    this.viewPort.style.position = "relative";
    this.map.style.position = "absolute";
    
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
    
    var width = this.map.offsetWidth;
    var height = this.map.offsetHeight;
    var viewWidth = this.viewPort.offsetWidth;
    var viewHeight = this.viewPort.offsetHeight;
    
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
    this.map.style.left = -left + "px";
    this.map.style.top = -top + "px";
    
    this.viewPortPosition[0] = left;
    this.viewPortPosition[1] = top;
    
    //// set clipping rectangle
    //this.map.style.clip = "rect(" + top + "px," + right + "px," + bottom + "px," + left + "px)";
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
        this.viewPort.addEventListener('mousedown',  function(evt) { _this.onTouchStart(evt); } , false);
        
        // move about
        this.viewPort.addEventListener('mousemove',  function(evt) { if (_this.dragAnchor.active) _this.onTouchUpdate(evt); } , false);
        
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
