/*jslint node: true */
"use strict";

/**
 * Directed Graph render utilities.
 * @see: https://developers.google.com/closure/compiler/docs/js-for-compiler
 */
 
 // TODO: Zoom
 // TODO: Editing
 // TODO: Highlight & list node updates
 // TODO: Collaborative editing (needs reviewer options etc)


// #############################################################################
// Graph renderer


// #####################################################################################################################
// Ctor & setup
/**
 * Creates a new GraphUI that renders and lets the user interact with a Graph object.
 * 
 * @param {Graph} graph The graph to be rendered.
 * @param {Element} viewport The div containing the map.
 * @param {Element} mapEl The div to render the graph to.
 * @param {Object} mapView The MapView that wraps the map.
 * @param {Element} toolbarEl The toolbar container.
 * @param {Element} allTagsEl The div to render all tags to.
 * @param {Element} nodeInfoEl The div element for displaying selected node information etc.
 * @param {Element} nodeTagsEl The div to render the current node's tags to.
 * @param {Object} backend Contains functions for interacting with the backend, which is especially necessary for editing.
 */
squishy.GraphUI = function(graph, viewport, mapEl, mapView, toolbarEl, allTagsEl, nodeTitleEl, nodeInfoEl, nodeTagsEl, backend) {
    // sanity check all arguments:
    for (var i = 0; i < arguments.length; ++i) {
        squishy.assert(arguments[i], "Argument #" + i + " is not set.");
    }

    // set all properties
    this.graph = graph;
    this.viewport = viewport;
    this.mapEl = mapEl;
    this.mapView = mapView;
    this.toolbarEl = toolbarEl;
    this.allTagsEl = allTagsEl;
    this.nodeTitleEl = nodeTitleEl;
    this.nodeInfoEl = nodeInfoEl;
    this.nodeTagsEl = nodeTagsEl;
    this.backend = backend;
    this.backend.graphui = mapEl.graphui = this;
    
    // setup GUI
    this.setupGUI();
    
    // render interactive graph to DOM
    this.resetGraph();
};


/**
 * Sets up initial GUI stuff.
 */
squishy.GraphUI.prototype.setupGUI = function() {
    var toolbar = this.toolbarEl;
    
    // zoom in button
    var zoomInButton = document.createElement("button");
    zoomInButton.style.cssText = "padding:0px; float:left";
    zoomInButton.title = "Zoom In";
    squishy.addBackgroundImage(zoomInButton, "img/zoomin.png");
    toolbar.appendChild(zoomInButton);
    
    // zoom out button
    var zoomOutButton = document.createElement("button");
    zoomOutButton.style.cssText = "padding:0px; float:left";
    zoomInButton.title = "Zoom Out";
    squishy.addBackgroundImage(zoomOutButton, "img/zoomout.png");
    toolbar.appendChild(zoomOutButton);
    
    // Add node button
    var addNodeButton = document.createElement("button");
    addNodeButton.style.cssText = "padding:0px; float:left";
    addNodeButton.title = "Add Node";
    addNodeButton.innerHTML = "Add<br>Node";
    addNodeButton.editNode = true;
    //squishy.appendText(addNodeButton, "Add<br>Node");
    //squishy.addBackgroundImage(addNodeButton, "img/plus.png");
    toolbar.appendChild(addNodeButton);
    
    // Remove node button
    var removeNodeButton = document.createElement("button");
    removeNodeButton.style.cssText = "padding:0px; float:left";
    removeNodeButton.title = "Remove Node";
    removeNodeButton.innerHTML = "Remove<br>Node";
    removeNodeButton.editNode = true;
    //squishy.appendText(removeNodeButton, "Remove Node");
    toolbar.appendChild(removeNodeButton);
    
    // Add edge button
    var addArcButton = document.createElement("button");
    addArcButton.style.cssText = "padding:0px; float:left";
    addArcButton.title = "Add Arc";
    addArcButton.innerHTML = "Add<br>Arc";
    addArcButton.editNode = true;
    toolbar.appendChild(addArcButton);
    
    // Remove edge button
    var removeArcButton = document.createElement("button");
    removeArcButton.style.cssText = "padding:0px; float:left";
    removeArcButton.title = "Remove Arc";
    removeArcButton.innerHTML = "Remove<br>Arc";
    removeArcButton.editArc = true;
    toolbar.appendChild(removeArcButton);
    
    // add button functionality
    this.editButtons = [addNodeButton, removeNodeButton, addArcButton, removeArcButton];
    var _this = this;
    zoomInButton.onclick = function(evt) { _this.mapView.zoomIn(); };
    zoomOutButton.onclick = function(evt) { _this.mapView.zoomOut(); };
    
    addNodeButton.onclick = function(evt) { _this.startAddNode(); };
    removeNodeButton.onclick = function(evt) { _this.startRemoveNode(); };
    addArcButton.onclick = function(evt) { _this.startAddArc(); };
    removeArcButton.onclick = function(evt) { _this.startRemoveArc(); };
};



/**
 * Renders the DAG to the given given DOM elements.
 *
 * @private 
 * @param canvas The canvas to render the DAG to.
 * @return The text version of the DAG.
 */
squishy.GraphUI.prototype.resetGraph = function() {
    // clear map DOM
    this.mapEl.innerHTML = "";
    this.mapEl.style.width = "0px";
    this.mapEl.style.height = "0px";

    // reset mode & selections
    this.enterMode(squishy.GraphUI.ActionMode.Default);
    this.selectNode(null);
    this.selectArc(null);
    this.selectTag(null);
    
    // compute layout
    var positions = this.graph.computeLayout();
    var layout = this.graph.layout;
    
    // add tags
    this.allTagMap = this.setTags(this.graph.allTags, this.allTagsEl);
    
    // add nodes
    for (var i = 0; i < positions.length; ++i) {
        var node = this.graph.nodes[i];
        var position = positions[i];
        var x = position[0];
        var y = position[1];
	    var w = layout.nodeSizeMax.x;
	    var h = layout.nodeSizeMax.y;
        
        // adjust viewport size because it messes with things
        this.mapEl.style.width = Math.max(this.mapEl.clientWidth, x + w + layout.nodeSizeMax.x) + "px";
        this.mapEl.style.height = Math.max(this.mapEl.clientHeight, y + h + layout.nodeSizeMax.y) + "px";
        
        // add node button
        var button = this.addNodeButton(node, x, y, w);
    }
    
    // add arcs
    for (var i = 0; i < this.graph.arcs.length; ++i) {
    	var arc = this.graph.arcs[i];
    	var from = this.graph.nodes[arc.from];
    	var to = this.graph.nodes[arc.to];
    	
        var fromPos = positions[arc.from];
        var toPos = positions[arc.to];
	    var w = layout.nodeSizeMax.x;
	    var h = layout.nodeSizeMax.y;
        
        // draw arc
        var fromX = fromPos[0] + w/2;
        var fromY = fromPos[1] + h;
        var toX = toPos[0] + w/2;
        var toY = toPos[1];
        
        //console.log("[" + fromX + ", " + fromY + "] -> " + "[" + toX + ", " + toY + "] -- " + (to.rank - from.rank));
        //console.log("[" + arc.from + "] -> " + "[" + arc.to + "] -- " + (to.rank - from.rank));
        var line = squishy.drawLine(this.mapEl, [fromX, fromY], [toX, toY]);
        line.className = "km_arc";
        line.arc = arc;
        arc.elem = line;
        
        
        // Add line functionality
        var this_ = this;
        squishy.onClick(line, function (evt) {
        	evt = evt || window.event;
        	var line = event.target || event.srcElement;
            
            var arc = line.arc;
            if (this_.selectedArc && this_.selectedArc.arcid == arc.arcid) { 
                // de-select selected arc
                this_.selectArc(null);
            }
            else {
                this_.selectArc(arc);
            }
        });
        
        // line.onmouseover = function(evt) { 
        	// evt = evt || window.event;
        	// var target = event.target || event.srcElement;
        	
        	// var arc = target.arc;
        	// console.log(arc.from + " -> " + arc.to);
		// };
    }
    
	//squishy.drawLine(this.mapEl, [500, 10], [50, 100], "red", 4);
};



// #####################################################################################################################
// Nodes

/**
 * Select given node.
 */
squishy.GraphUI.prototype.selectNode = function(node) {
    var oldNode = this.selectedNode;
    
    // select new node
    this.selectedNode = node;
    
    if (oldNode) {
        // update old node
        this.updateNodeStyles(oldNode);
    }
    
    if (node) {
        // update new node
        this.updateNodeStyles(node);
        
        // update node title & info
        this.nodeTitleEl.innerHTML = node.title;
        this.nodeInfoEl.innerHTML = node.htmlInfo;
        
        // update node tags
        this.setTags(node.tags, this.nodeTagsEl);
        
        // enable node edit buttons
        this.editButtons.forEach(function(button) {
            if (button.editNode) {
                button.disabled = false;
            }
        });
    }
    else {
        // disable node edit buttons
        this.editButtons.forEach(function(button) {
            if (button.editNode) {
                button.disabled = true;
            }
        });
    }
};

/**
 * Updates the decoration of the given node.
 *
 * @param node
 */
squishy.GraphUI.prototype.updateNodeStyles = function(node) {
    node.elem.className = this.getNodeClassNames(node);
};

/**
 * Determine layout of given node by its properties.
 *
 * @param node
 */
squishy.GraphUI.prototype.getNodeClassNames = function(node) {
    var names = ["km_node"];     // default
    if (this.selectedTag) {
        // a tag has been selected
        if (node.tags.indexOf(this.selectedTag) >= 0) {
            // has tag
            names.push("km_node_filtered");
        }
        else {
            // does not have tag
            names.push("km_node_notfiltered");
        }
    }
    if (this.selectedNode == node) {
        names.push("km_node_selected");
    }
    return names.join(" ");
};

/**
 * Adds a new node, using a default rendering mechanism.
 *  
 * @param {Object} text
 * @param {Number} x
 * @param {Number} y
 * 
 * @private
 */
squishy.GraphUI.prototype.addNodeButton = function(node, x, y, w) {
    var text = node.title;
    
    var button = document.createElement("button");
    var layout = this.graph.layout;
    
    // set style
    var w = layout.nodeSizeMax.x + button.style.paddingLeft + button.style.paddingRight + button.style.borderLeftWidth + button.style.borderRightWidth;
    // button.style.width = w + "px";
    button.style.minWidth = w + "px";
    // button.style.height = layout.nodeSizeMax.y + "px";
    // button.style.minHeight = layout.nodeSizeMax.y + "px";
    button.style.font = layout.font;
    button.style.position = "absolute";
    button.style.display = "inline-block";
    button.style.overflow = "hidden";
    button.style.left = x + "px";
    button.style.top = y + "px";
    button.setAttribute("data-nodeindex", node.nodeindex);
    button.node = node;
    node.elem = button;
  
    // reset node styles
    this.updateNodeStyles(node);
    
    // set text
    var shortText = squishy.truncateText(text, layout.font, w);
	var textNode = document.createTextNode(shortText);
    var spanNode = document.createElement("span");
    spanNode.appendChild(textNode);
	button.appendChild(spanNode);
    button.title = text;
    
    // display HTML when hovering with the mouse or clicking it
    var showInfoHandler = function(evt) {
        //evt = evt || window.event;
        button.graphui.selectNode(button.node);
    };
    squishy.onClick(button, showInfoHandler);
    //button.addEventListener("mouseover", showInfoHandler);
    
	this.mapEl.appendChild(button);
    button.graphui = this;
	
	return button;
};

/**
 * Starts adding a new node to the graph.
 * Action will complete when backend responded.
 */
squishy.GraphUI.prototype.startAddNode = function() {
    var parent = this.selectedNode;
    if (!parent) return;
    
    // TODO: Sanity checks
    
    var newNode = {
        title : "New Node",
        htmlInfo : "Please edit this node's description...",
        tags : parent.tags.clone()     // copy parent tags
    };
    
    // send request to add new node to given parent
    this.backend.requestAddNode(parent, newNode);
};

/**
 * Is called by the backend interface when the given node has been added to the graph.
 *
 * @param parent
 * @param newNode
 */
squishy.GraphUI.prototype.addNodeResponse = function(parent, newNode, newArcId) {
    // add node and arc
    this.graph.addNode(parent, newNode, 1, newArcId);
    
    // re-compute layout
    this.resetGraph();
	
	// select new node
	this.selectNode(newNode);
};


// #####################################################################################################################
// Arcs

/** 
 * Selects the given arc.
 *
 * @param arc
 */
squishy.GraphUI.prototype.selectArc = function(arc) {
    var oldArc = this.selectedArc;
    
    // select new node
    this.selectedArc = arc;
    
    if (oldArc) {
        // update old arc
        this.updateArcStyles(oldArc);
    }
    
    if (arc) {
        // update newly selected arc
        this.updateArcStyles(arc);
        
        // enable arc edit buttons
        this.editButtons.forEach(function(button) {
            if (button.editArc) {
                button.disabled = false;
            }
        });
    }
    else {
        // disable arc edit buttons
        this.editButtons.forEach(function(button) {
            if (button.editArc) {
                button.disabled = true;
            }
        });
    }
};

/**
 * Updates the decoration of the given edge.
 *
 * @param edge
 */
squishy.GraphUI.prototype.updateArcStyles = function(arc) {
    arc.elem.className = this.getArcClassNames(arc);
};

/**
 * Determine layout of given edge by its properties.
 *
 * @param edge
 */
squishy.GraphUI.prototype.getArcClassNames = function(arc) {
    var names = ["km_arc"];     // default
    if (this.selectedArc == arc) {
        names.push("km_arc_selected");
    }
    return names.join(" ");
};


// ############################################################################################################
// Tags


/**
 * Select the given tag.
 * 
 * @param {String} tag
 * @param {Element} tagEl
 */
squishy.GraphUI.prototype.selectTag = function(tag) {
    var tagElem = null;
    if (tag) {
        tagElem = this.allTagMap[tag];
    }
    
    // update tag
    var oldTag = this.selectedTag;
    var oldTagElem = this.selectedTagElem;
    
    if (oldTag) {
        // update old tag
        oldTagElem.className = "km_tag";
    }
    
    var tagChanged = oldTag != tag;
    
    if (tag && tagChanged) {
        // update new tag
        this.selectedTag = tag;
        this.selectedTagElem = tagElem;
        tagElem.className = "km_tag km_tag_selected";
    }
    else {
        // deselect
        this.selectedTag = null;
        this.selectedTagElem = null;
    }
    
    if (tagChanged) {
        // update all nodes
        for (var i = 0; i < this.graph.nodes.length; ++i) {
            var node = this.graph.nodes[i];
            this.updateNodeStyles(node);
        }
    }
};


/**
 * Clears and then adds the given tags from/to the given target DOM element.
 * 
 * @param {Array} tags
 * @param {Element} targetEl
 */
squishy.GraphUI.prototype.setTags = function(tags, targetEl) {
    this.nodeTagsEl.innerHTML = "";
    var tagElementMap = {};
    for (var i = 0; i < tags.length; ++i) {
        var tag = tags[i];
        tagElementMap[tag] = this.addTag(tag, targetEl);
    }
    return tagElementMap;
};

/**
 * Adds the given tag to the given element.
 *  
 * @param {String} tag
 * @param {Element} targetEl
 * 
 * @private
 */
squishy.GraphUI.prototype.addTag = function(tag, targetEl) {
    var tagEl = document.createElement("span");
    tagEl.className = "km_tag";
    tagEl.graphui = this;
    
    // add text
    squishy.appendText(tagEl, tag);
    
    // add shadow
    squishy.addShadow(tagEl, 2);
    
    // add tag and whitespace to DOM, to avoid clumping together.
    targetEl.appendChild(tagEl);
    squishy.appendText(targetEl, " ");
	
    // display HTML when clicking it
    var selectTagHandler = function(evt) {
        //evt = evt || window.event;
        tagEl.graphui.selectTag(tag);
    };
    
    squishy.onClick(tagEl, selectTagHandler);
    
    return tagEl;
};
    
// #####################################################################################################################
// Modes

/**
 * The different actions that can be taken by the user.
 * We are currently imposing the constraint that only one action can be taken at a time.
 * @const
 */
squishy.GraphUI.ActionMode = {
    /**
     * Nothing special.
     */
	Default : 0, 
    /**
     * Adding a new arc requires multiple steps.
     */
	AddArc : 1,
    /**
     * After having made a change, we have to notify the server and wait for the response.
     */
    WaitingForResponse : 2
};


/**
 * Enter a new mode to prevent 
 *
 * @param mode
 */
squishy.GraphUI.prototype.enterMode = function(mode) {
    var oldMode = this.mode;
    
    
};

/**
 * Enter a new mode to prevent 
 *
 * @param mode
 */
squishy.GraphUI.prototype.leaveCurrentMode = function() {
    // TODO: 
};

// TODO: freeze object, but it's performance is currently bad in Chrome
//Object.freeze(squishy.GraphUI.ActionMode);



// #####################################################################################################################
// Arcs

/**
 * @constructor
 *
 * Creates a new DefaultBackend object.
 */
squishy.GraphUI.DefaultBackend = function() {
};

/**
 * Sends a request to add the given newNode to the given parentNode.
 *
 * @param parentNode
 * @param newNode
 */
squishy.GraphUI.DefaultBackend.prototype.requestAddNode = function(parentNode, newNode) {
    // TODO: Send request to server
    this.graphui.addNodeResponse(parentNode, newNode);
};