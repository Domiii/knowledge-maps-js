/*jslint node: true */
"use strict";

/**
 * This is the constructor for the PresFeed (Presentation Feedback) object.
 *
 * @constructor
 * 
 * @param {Element} [config.canvas] The canvas to contain this PresFeed object.
 * @param {Function} [config.callback] The callback is called regularly with the last sampled part of the feedback stream.
 * @param {Number} [config.windowMillis] The length of the canvas window in milliseconds.
 * @param {Number=} [config.samplingMinDistanceMillis] The min amount of milliseconds between two samples. Recent samples will be overwritten if too new. (Default = 500)
 */
squishy.PresFeed = function(config) {
	// copy and verify parameters
	config.clone(this, false);	// copy config elements to this object
	squishy.assert(this.canvas, "config.canvas was not set correctly.");
	squishy.assert(this.callback, "config.callback was not set correctly.");
	squishy.assert(this.windowMillis > 0, "config.windowMillis was not set correctly.");
	squishy.assert(this.samplingCallbackMillis > 0, "config.windowMillis was not set correctly.");
	
	this.samplingMinDistanceMillis = this.samplingMinDistanceMillis || 500;
	
	this.keyStates = [0, 0];
	this.log = [];
	this.started = -1;
	
	
	// initialize
	this.initPresFeed();
};


// #####################################################################################################################
// Handling keys

/**
 * @private
 *
 * @param {Event} evt
 */
squishy.PresFeed.prototype.initPresFeed = function() {
	(function() {
    	var _this = this;
    	
        // start clicking a button
        document.onkeydown = function(evt) { _this.onKeyDown(evt || window.event); };
        document.onkeyup = function(evt) { _this.onKeyUp(evt || window.event); };
    }).call(this);
};

/**
 * @private
 *
 * @param {Event} evt
 */
squishy.PresFeed.prototype.onKeyDown = function(evt) {
	// determine which key was pressed
	var pressedKey;
    if (document.all) { e = window.event;
        pressedKey = e.keyCode; }
    if (e.which) {
        pressedKey = e.which;
    }
	
	// see: http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	/** @const */ var KeyUp = 38;
	/** @const */ var KeyDown = 40;
	if (pressedKey == KeyUp || pressedKey == KeyDown) {
		this.update(1, pressedKey == KeyUp ? squishy.PresFeed.KeyIds.UpId : squishy.PresFeed.KeyIds.DownId);
	}
};


/**
 * @private
 *
 * @param {Event} evt
 */
squishy.PresFeed.prototype.onKeyUp = function(evt) {
	// determine which key was pressed
	var pressedKey;
    if (document.all) { e = window.event;
        pressedKey = e.keyCode; }
    if (e.which) {
        pressedKey = e.which;
    }
	
	// see: http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	/** @const */ var KeyUp = 38;
	/** @const */ var KeyDown = 40;
	if (pressedKey == KeyUp || pressedKey == KeyDown) {
		this.update(0, pressedKey == KeyUp ? squishy.PresFeed.KeyIds.UpId : squishy.PresFeed.KeyIds.DownId);
	}
};

/**
 * Signals a change of keys pressed: That is either the up or down key has been pressed or released.
 *
 * @private
 * @param {Number} pressed Whether the key is now pressed (1) or not (0).
 * @param {Number} keyId The id of the key that has been pressed or released.
 */
squishy.PresFeed.prototype.update = function(pressed, keyId) {
	this.keyStates[keyId] = pressed;
	
	// log state change, if currently running
	if (this.isRunning()) {
		this.addSample();
	}
};


/**
 * Logs the current keyStates sample. 
 * Overrides older samples if not at least this.samplingMinDistanceMillis ago.
 *
 * @private
 */
squishy.PresFeed.prototype.addSample = function() {
	// first step: Convert state to a single number
	var status = this.getSampleStatus(this.keyStates);
	
	this.samplingMinDistanceMillis
};


// #####################################################################################################################
// Public members

/**
 * Returns a single representation of a keyStates array.
 */
squishy.PresFeed.prototype.getSampleStatus = function(keyStates) {
	var upState = keyStates[squishy.PresFeed.KeyIds.UpId];
	var downState = keyStates[squishy.PresFeed.KeyIds.DownId];
	
	var status;
	if (upState == 0 && downState == 0) {
		status = squishy.PresFeed.Status.None;
	}
	else if (upState == 0 && downState == 1) {
		status = squishy.PresFeed.Status.Down;
	}
	else if (upState == 1 && downState == 0) {
		status = squishy.PresFeed.Status.Up;
	}
	else if (upState == 1 && downState == 1) {
		status = squishy.PresFeed.Status.Neutral;
	}
	
	return status;
};

/**
 * Whether we are currently recording a feedback stream.
 */
squishy.PresFeed.prototype.isRunning = function() {
	return this.started != -1;
};

/**
 * Whether we are currently recording a feedback stream.
 */
squishy.PresFeed.prototype.start = function() {
	if (this.isRunning()) return;
	
	this.started = squishy.getCurrentTimeMillis();
	
};

// #####################################################################################################################
// Enums

/**
 * The indices of the up and down keys in the keyStates array.
 * @const
 */
squishy.PresFeed.KeyIds = {
	UpId : 0, 
	DownId : 1
};

// TODO: freeze object, but it's currently buggy in Chrome
//Object.freeze(squishy.PresFeed.KeyIds);

/**
 * The possible status values, extrapolated from the key presses.
 * @const
 */
squishy.PresFeed.Status = {
	None : 0,
	Down : 1,
	Up : 2,
	Neutral : 3
};