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
    this.positions = this.graph.computeLayout();    
    
    var positions = this.positions;
    var layout = this.graph.layout;
    for (var i = 0; i < positions.length; ++i) {
        var node = this.graph.nodes[i];
        var position = positions[i];
        var x = position[0];
        var y = position[1];
        
        var text = node.title;
        text = squishy.truncateText(text, layout.nodeSizeMax.x, layout.font);
        
        this.addNode(text, x, y);
    }
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
    button.style.width = this.layout.nodeSizeMax.x;
    button.style.height = this.layout.nodeSizeMax.y;
    button.style.font = this.layout.font;
    button.style.position = "absolute";
    button.style.overflow = "hidden";
    button.style.left = x + "px";
    button.style.top = y + "px";
    
	var textNode = document.createTextNode("text");
	button.appendChild(textNode);
	
	this.elem = button;
};