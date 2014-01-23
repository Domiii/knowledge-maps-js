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

/**
 * Creates a new GraphUI that renders and lets the user interact with a Graph object.
 * 
 * @param {Graph} graph The graph to be rendered.
 * @param {Element} viewport The div containing the map.
 * @param {Element} elem The div to render the graph to.
 * @param {Element} allTagsEl The div to render all tags to.
 * @param {Element} nodeInfoEl The div element for displaying selected node information etc.
 * @param {Element} nodeTagsEl The div to render the current node's tags to.
 */
squishy.GraphUI = function(graph, viewport, elem, allTagsEl, nodeTitleEl, nodeInfoEl, nodeTagsEl) {
    this.graph = graph;
    this.viewport = viewport;
    this.elem = elem;
    this.allTagsEl = allTagsEl;
    this.nodeTitleEl = nodeTitleEl;
    this.nodeInfoEl = nodeInfoEl;
    this.nodeTagsEl = nodeTagsEl;
    elem.graphui = this;
    
    this.resetDisplay();
};


/**
 * Renders the DAG to the given given DOM elements.
 * 
 * @param canvas The canvas to render the DAG to.
 * @return The text version of the DAG.
 */
squishy.GraphUI.prototype.resetDisplay = function() {
    // reset selection
    this.selectedNode = null;
    this.update
    this.selectedTag = null;
    this.selectedTagElem = null;
    
    var positions = this.positions = this.graph.computeLayout();
    
    var layout = this.graph.layout;
    
    // store viewport size
    
    // add tags
    this.allTagMap = this.addTags(this.graph.allTags, this.allTagsEl);
    
    // add nodes
    for (var i = 0; i < positions.length; ++i) {
        var node = this.graph.nodes[i];
        var position = positions[i];
        var x = position[0];
        var y = position[1];
	    var w = layout.nodeSizeMax.x;
	    var h = layout.nodeSizeMax.y;
        
        // adjust viewport size because it messes with things
        this.elem.style.width = Math.max(this.elem.clientWidth, x + w + layout.nodeSizeMax.x) + "px";
        this.elem.style.height = Math.max(this.elem.clientHeight, y + h + layout.nodeSizeMax.y) + "px";
        
        // add node button
        var button = this.addNode(node, x, y, w);
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
        var line = squishy.drawLine(this.elem, [fromX, fromY], [toX, toY], this.graph.layout.arcColor);
        line.setAttribute("data-arcindex", arc.arcindex);
        
        var this_ = this;
        line.onmouseover = function(evt) { 
        	evt = evt || window.event;
        	var target = event.target || event.srcElement;
        	
        	var arcIdx = target.getAttribute("data-arcindex");
        	var arc = this_.graph.arcs[arcIdx]; 
        	//console.log(arc.from + " -> " + arc.to);
		};
    }
    
	//squishy.drawLine(this.elem, [500, 10], [50, 100], "red", 4);
};

/**
 * Select given node.
 */
squishy.GraphUI.prototype.selectNode = function(node) {
    var selectedNode = this.selectedNode;
    
    // select new node
    this.selectedNode = node;
    
    if (selectedNode) {
        // update old node
        this.updateNodeStyles(selectedNode);
    }
    
    if (node) {
        // update new node
        this.updateNodeStyles(node);
        
        // update node title & info
        this.nodeTitleEl.innerHTML = node.title;
        this.nodeInfoEl.innerHTML = node.htmlInfo;
        
        // update node tags
        this.nodeTagsEl.innerHTML = "";
        this.addTags(node.tags, this.nodeTagsEl);
    }
};

/**
 * Deselect given node.
 */
squishy.GraphUI.prototype.updateNodeStyles = function(node) {
    node.elem.className = this.getNodeClassNames(node);
};

/**
 * Determine layout of given node by its properties.
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
 * Adds a new node, using a default rendering mechanism
 *  
 * @param {Object} text
 * @param {Number} x
 * @param {Number} y
 * 
 * @private
 */
squishy.GraphUI.prototype.addNode = function(node, x, y, w) {
    var text = node.title;
    
    var button = document.createElement("button");
    var layout = this.graph.layout;
    
    // set style
    var w = layout.nodeSizeMax.x + button.style.paddingLeft + button.style.paddingRight + button.style.borderLeftWidth + button.style.borderRightWidth;
    // button.style.width = w + "px";
    // button.style.minWidth = w + "px";
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
    button.addEventListener("mousedown", showInfoHandler);
    button.addEventListener("touchstart", showInfoHandler);
    button.addEventListener("mouseover", showInfoHandler);
    //button.onmouseover = showHandler;
    
	this.elem.appendChild(button);
    button.graphui = this;
	
	return button;
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
    if (tag) {
        var tagElem = this.allTagMap[tag];
    }
    
    // update tag
    var oldTag = this.selectedTag;
    var oldTagElem = this.selectedTagElem;
    
    if (oldTag) {
        // update old tag
        oldTagElem.className = "km_tag";
    }
    
    if (tag && oldTag != tag) {
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
    
    // update all nodes
    for (var i = 0; i < this.graph.nodes.length; ++i) {
        var node = this.graph.nodes[i];
        this.updateNodeStyles(node);
    }
};


/**
 * Add the given tags to the given target DOM element.
 * 
 * @param {Array} tags
 * @param {Element} targetEl
 */
squishy.GraphUI.prototype.addTags = function(tags, targetEl) {
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
    
    // display HTML when hovering with the mouse or clicking it
    var selectTagHandler = function(evt) {
        //evt = evt || window.event;
        tagEl.graphui.selectTag(tag);
    };
    tagEl.addEventListener("mousedown", selectTagHandler);
    tagEl.addEventListener("touchstart", selectTagHandler);
    tagEl.graphui = this;
    
    // add text
    var textNode = document.createTextNode(tag);
    tagEl.appendChild(textNode);
    squishy.addShadow(tagEl, 2);
    
    // add to DOM
    targetEl.appendChild(tagEl);
    
    return tagEl;
};