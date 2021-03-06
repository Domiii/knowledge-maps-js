/*jslint node: true */
"use strict";

// Some directed Graph utilities.
// TODO: Support Google Closure annotation.
// See: https://developers.google.com/closure/compiler/docs/js-for-compiler


// #############################################################################
// BFS traversal of nodes

/**
 * Initializes and returns the state object used in GraphBFSNodes.
 */
squishy.Graph.prototype.BFSNodesInit = function(fringe, visited) {
    var state = {
        visited : visited || squishy.createArray(this.nodes.length, false),
        fringe : fringe || [this.Root]
    };
    
    // mark fringe as visited, in case this graph has cycles
    for (var iFringe = 0; iFringe < state.fringe.length; ++iFringe) {
    	state.visited[state.fringe[iFringe].nodeindex] = true;	
    }
    return state;
};

/**
 * Breadth-first di-graph traversal of nodes. This might not visit all arcs.
 * 
 *
 * @param visitFunc Is called on every node (except for root) before visiting. Passes traversed arc as parameter. Returns false if children of "to" node should not be visited.
 * @param {Object=} graphBFSState Optional traversal start state (if not given, starts at root).
 */ 
squishy.Graph.prototype.BFSNodes = function(visitFunc, graphBFSState) {
    // if there is no state given: start from root
    graphBFSState = graphBFSState || this.BFSNodesInit();
    
    var visited = graphBFSState.visited;
    var fringe = graphBFSState.fringe;
    
    var headIdx = 0;
    var tailIdx = -1;
    
    do {
        var nextNode = fringe[++tailIdx];                   // dequeue next node
        
        // replace arc with outgoing arcs of "to" node
        var childArcs = nextNode.arcsOut;
        
        // iterate over all kids
        for (var childArcCount = childArcs.length, j = 0; j < childArcCount; ++j) {
            var childArc = childArcs[j];
            if (visited[childArc.to]) continue;
            visited[childArc.to] = true;         // flag as visited
            
            if (visitFunc.call(this, childArc)) {
                // keep visiting
                fringe[++headIdx] = this.nodes[childArc.to];
				squishy.assert(this.nodes[childArc.to], "Arc " + childArc.arcid + " points to invalid node at index " + childArc.to);
            }
        }
    } while (tailIdx < headIdx);
};



// #############################################################################
// BFS traversal along all arcs

/**
 * Initializes and returns the state object used in GraphBFSArcs.
 */
squishy.Graph.prototype.BFSArcsInit = function(fringe, visited) {
    var state = {
        visited : visited || squishy.createArray(this.narccount, false),
        fringe : fringe || [this.Root]
    };
    
    // mark root as visited, in case this graph has cycles
    for (var i = 0; i < state.fringe.length; ++i) {
        state.visited[state.fringe[i].arcid] = true;
    }
    return state;
};

/**
 * Breadth-first di-graph traversal of arcs.
 * 
 *
 * @param visitFunc Is called on every arc before visiting. Passes traversed arc as parameter. Returns true if arcs from "to" node should be visited.
 * @param {Object=} graphBFSState Optional traversal start state (if not given, starts at root).
 */ 
squishy.Graph.prototype.BFSArcs = function(visitFunc, graphBFSState) {
    // if there is no state given: start from root
    graphBFSState = graphBFSState || this.BFSArcsInit();
    
    var visited = graphBFSState.visited;
    var fringe = graphBFSState.fringe;
    
    var headIdx = 0;
    var tailIdx = -1;
    while (tailIdx < headIdx) {
        var nextNode = fringe[++tailIdx];                   // dequeue next node
        // add all arcs leading into and out of this node to the queue:
        
        // first, add all outgoing arcs
        var childArcs = nextNode.arcsOut;
        for (var j = 0; j < childArcs.length; ++j) {
            var childArc = childArcs[j];
            if (visited[childArc.arcid]) continue;
            visited[childArc.arcid] = true;             // flag as visited
            
            if (visitFunc.call(this, childArc)) {
                // keep visiting
                fringe[++headIdx] = this.nodes[childArc.to];
            }
        }
        
        // // then, add all incoming arcs
        // childArcs = nextNode.arcsIn;
        // for (var j = 0; j < childArcs.length; ++j) {
            // var childArc = childArcs[j];
            // if (visited[childArc.arcid]) continue;
            // visited[childArc.arcid] = true;             // flag as visited
//             
            // if (visitFunc(childArc)) {
                // // keep visiting
                // fringe[++headIdx] = this.nodes[childArc.to];
            // }
        // }
    }
};


// #############################################################################
// BFS graph traversal of arcs

/**
 * Log all arcs to console. 
 */
squishy.Graph.prototype.logArcs = function(ranks, msg) {
	console.log("==============");
	console.log("All arcs (" + msg + "):");
    for (var i = 0; i < this.arcs.length; ++i) {
    	var arc = this.arcs[i];
        
        console.log("[" + arc.from + "] -> " + "[" + arc.to + "] -- " + this.arcGetLength(arc, ranks));
    }
};
