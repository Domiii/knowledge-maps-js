/*jslint node: true */
"use strict";

/**
 * Directed Graph render utilities.
 * @see: https://developers.google.com/closure/compiler/docs/js-for-compiler
 */


// #############################################################################
// Graph renderer

/**
 * Creates a new GraphUI that renders and lets the user interact with a Graph object.
 * 
 * @param {Graph} graph The graph to be rendered.
 * @param {Element} elem The div to render the graph to.
 * @param {Element} infoPanelEl The div element for displaying selected node information etc.
 */
squishy.GraphUI = function(graph, elem, infoPanelEl) {
    this.graph = graph;
    this.elem = elem;
    this.infoPanelEl = infoPanelEl;
    elem.graphui = this;
    
    this.display();
};


/**
 * Renders the DAG to the given canvas.
 * 
 * @param canvas The canvas to render the DAG to.
 * @return The text version of the DAG.
 */
squishy.GraphUI.prototype.display = function() {
    var positions = this.positions = this.graph.computeLayout();
    
    var layout = this.graph.layout;
    
    // add nodes
    for (var i = 0; i < positions.length; ++i) {
        var node = this.graph.nodes[i];
        var position = positions[i];
        var x = position[0];
        var y = position[1];
	    var w = layout.nodeSizeMax.x;
	    var h = layout.nodeSizeMax.y;
        
        var text = node.title;
        text = squishy.truncateText(text, layout.font, w);
        
        // add node button
        var button = this.addNode(text, x, y);
        node.elem = button;
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
        var line = squishy.drawLine(this.elem, [fromX, fromY], [toX, toY]);
        line.setAttribute("data-arc", arc.arcindex);
        
        var this_ = this;
        line.onmouseover = function(evt) { 
        	evt = evt || window.event;
        	var target = event.target || event.srcElement;
        	
        	var arcIdx = target.getAttribute("data-arc");
        	var arc = this_.graph.arcs[arcIdx]; 
        	console.log(arc.from + " -> " + arc.to);
		};
    }
    
	squishy.drawLine(this.elem, [500, 10], [50, 100], "red", 4);
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
squishy.GraphUI.prototype.addNode = function(text, x, y) {
    var button = document.createElement("button");
    var layout = this.graph.layout;
    button.style.width = layout.nodeSizeMax.x;
    button.style.height = layout.nodeSizeMax.y;
    button.style.font = layout.font;
    button.style.position = "absolute";
    button.style.overflow = "hidden";
    button.style.left = x + "px";
    button.style.top = y + "px";
    
	var textNode = document.createTextNode(text);
	button.appendChild(textNode);
	this.elem.appendChild(button);
	
	return button;
};