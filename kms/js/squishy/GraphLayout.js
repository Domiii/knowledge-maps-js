/*jslint node: true */
"use strict";

// Implementation of the dot graph layout algorithm for directed graphs with a single root.
// TODO: Fully add Google Closure - compatbile annotation.
// See: https://developers.google.com/closure/compiler/docs/js-for-compiler



// ####################################################################################################
// Directed graph layout algorithm

/**
 * Computes the position and size of all node rectangles and their arcs.
 */
squishy.Graph.prototype.computeLayout = function() {
    this.computeRanks();
    var virtualMap = this.createVirtualGraph();
    var ordering = virtualMap.computeInRankOrder();
    return virtualMap.computeInRankPosition(ordering);
};


// #################################################################
// DOT Step #1: Compute Ranks

/**
 * Computes the rank property of each node.
 * 
 * @private
 */
squishy.Graph.prototype.computeRanks = function() {
    // TODO: First group by tags, and then compute the inter-group and intra-group layouts separately
    
    // we compute the tree and with it the node ranks.
    this.computeRanksGreedily();
    
    // All other steps are unnecessary since we only have a single root (citation missing)
    
    // while ((arcBad = this.getNextBadArc(tree)) != null) {
        // arcGood = this.getReplacementArc(arcBad, tree);
        // tree.replaceEdge(arcBad, arcGood);
    // }
    // this.normalize();	// make sure, the root has rank 0
    // this.balance();  // TODO: For edges with multiple feasible rank choices, choose the least crowded one
    
    this.logArcs("computeRanks (done)");
};

/**
 * Simple greedy scheme of moving a sub-graph down by one if an arc is not tight.
 * 
 * @private
 */
squishy.Graph.prototype.computeRanksGreedily = function() {
    this.NRankMin = 0;
    this.NRankMax = 0;
    this.initRanks();
	
	// visitor function that moves the rank of every node down by the given amount of slack
	var visitorFactory = function(_this, delta) {
		return function (arc) {
			var toNode = _this.nodes[arc.to];
			toNode.rank += delta;
			_this.NRankMax = Math.max(_this.NRankMax, toNode.rank);
			return true;
		};
	};
    
    // iterate over all arcs
    for (var iArc = 0; iArc < this.arcs.length; ++iArc) {
    	var arc = this.arcs[iArc];
    	
    	var slack = this.arcGetSlack(arc);
    	
    	if (slack < 0) {
    		// move sub-graph down by one
    		var fromNode = this.nodes[arc.from];
    		var bfsState = this.BFSNodesInit([], [fromNode]);
    		this.BFSNodes(visitorFactory(this, -slack), bfsState);
    	}
    }
};

// /**
 // * @private
 // */
// squishy.Graph.prototype.computeFeasibleTree = function() {
    // this.NRankMin = 0;
    // this.NRankMax = 0;
    // this.initRanks();
//     
    // /** @const */ var nNodes = this.nodes.length;      // total node count
    // var tree = { 
    	// arcs : [],
    	// nodes : {0:1},			// add root initially
    	// size : 1
   	// };
//    	
    // var _this = this;
    // var leastAdjacentArc;
    // var leastAdjacentArcSlack;
    // var bfsCallback = function(nextArc) {
        // var slack = _this.arcGetSlack(nextArc);
//     	
    	// // if (tree.nodes[nextArc.to]) {
    		// // return true;		// node has already been added
    	// // }
//     	
    	// // grow a tight tree
        // if (slack === 0) {       // tight arc
            // tree.arcs.push(nextArc);
            // tree.nodes[nextArc.to] = 1;
            // ++tree.size;
            // return true;
        // }
//         
        // // this arc is not tight -> But it's adjacent to the tree.
        // if (slack < leastAdjacentArcSlack) {
            // leastAdjacentArc = nextArc;
            // leastAdjacentArcSlack = slack;
            // console.log("leastAdjacentArcSlack: " + leastAdjacentArcSlack);
        // }
//         
        // return false;
    // };
//     
    // // start traversal
    // var graphBFSState = this.BFSArcsInit();
    // while (true)
    // {
        // // remember arc with least slack in incident fringe
        // leastAdjacentArc = null;
        // leastAdjacentArcSlack = 1e9;
//         
        // // grow tight tree
        // this.BFSArcs(bfsCallback, graphBFSState);
        // if (tree.size == nNodes) {
            // break;
        // }
//         
        // debugger;
//         
        // // adjust ranks to make the next edge tight
        // var delta = leastAdjacentArcSlack;
        // this.Root.rank += delta;
        // for (var i = 0; i < tree.arcs.length; ++i) {
            // var arc = tree.arcs[i];
            // var newRank = (this.nodes[arc.to].rank += delta);
            // _this.NRankMax = Math.max(_this.NRankMax, newRank);
        // }
    // }
    // this.logArcs("computeFeasibleTree");
    // return tree;
// };

/**
 * Produces an initial node ranking with breadth-first order.
 * Sets the rank property of each node.
 *
 * @private
 */
squishy.Graph.prototype.initRanks = function() {
    this.Root.rank = this.NRankMin;     // set root rank to 0
    /** @const */ var _this = this;
    this.BFSNodes(function(nextArc) { 
        var newRank = _this.nodes[nextArc.to].rank = _this.nodes[nextArc.from].rank+1;
        _this.NRankMax = Math.max(_this.NRankMax, newRank);
        return true;
    });
};



// #################################################################
// DOT Step #2: addVirtualNodes

/**
 * Creates a copy of the graph with virtual nodes so that every arc has unit length.
 * @private
 */
squishy.Graph.prototype.createVirtualGraph = function() {
    // shallow-copy all nodes into the new graph
    var virtualGraph = new squishy.Graph({ 
        layout : this.layout, 
        nodes : this.nodes.clone(false), 
        arcs : [],
        NRankMin : this.NRankMin,
        NRankMax : this.NRankMax
    });
    
    // create all arcs
    for (var nArcs = this.arcs.length, j = 0; j < nArcs; ++j) {
        var arc = this.arcs[j];
        var arcLen = this.arcGetLen(arc);
        
        
        squishy.assert(arcLen >= 0, "Arc length is negative => Rank computation is bugged.");
        
        if (arcLen > 1) {
            // insert (len-1) virtual nodes
            var last = virtualGraph.nodes[arc.from];
            for (var k = 1; k < arcLen; ++k) {
                last = virtualGraph.addNode(last, arc.weight, arc.arcid);
                last.virtual = 1;
            }
            
            // finally, connect the last virtual node and the child node
            var child = virtualGraph.nodes[arc.to];
            virtualGraph.addArc(last, child, arc.weight, arc.arcid);
        }
        else {
            // add the arc as-is
            var fromNode = virtualGraph.nodes[arc.from];
            var toNode = virtualGraph.nodes[arc.to];
            virtualGraph.addArc(fromNode, toNode, arc.weight, arc.arcid);
        }
    }
    
    return virtualGraph;
};



// #################################################################
// DOT Step #3: Reorder Children Lists

/**
 * Computes in-rank order, based on the median positions of ancestors.
 */
squishy.Graph.prototype.computeInRankOrder = function() {
    // First do a BFS for an initial ordering.
    // Returns "ranks" array and adds the "order" property to every node.
    var ranks = squishy.createArray(this.NRankMax+1, []);     // one array per rank
    var _this = this;
    
    // add root
    this.Root.order = 0;
    ranks[0].push(this.Root);
    
    this.BFSNodes(function(nextArc) {
        var node = _this.nodes[nextArc.to];
        var nodesInRank = ranks[node.rank];
        node.order = nodesInRank.length;
        nodesInRank.push(node);
        return true;
    });
    
    // compare order of two parents
    var compareFun = function(left, right) {
        if (left.order < right.order) return -1;
        else if (left.order == right.order) return 0;
        return 1;
    };
    
    // Now, improve the initial ordering using median.
    // Note we use stable sort to maintain the original order of siblings.
    // TODO: Iteratively perform local swaps, and switch up/down <-> down/up directions between iterations.
    for (var nRanks = this.NRankMax, i = 1; i <= nRanks; ++i) {
        var nodesInRank = ranks[i];
        for (var rankSize = nodesInRank.length, j = 1; j < rankSize; ++j) {
            var node = nodesInRank[j];
            // sort the parents
            var sortedParents = node.arcsIn.stableSort(compareFun);
            
            // TODO: Interpolation, in case there are multiple medians.
            
            // update order value based on parent order value
            var medianArc = sortedParents[Math.floor(sortedParents.length/2)];
            var medianNode = this.nodes[medianArc.from];
            node.order = medianNode.order;
        }
        
        // re-compute in-rank ordering
        ranks[i] = nodesInRank.stableSort(compareFun);
    }
    return ranks;
};


// #################################################################
// DOT Step #4: Compute in-rank positions of nodes.

/**
 * Computes in-rank position.
 * 
 * @private
 * 
 * @param ranks Array of arrays of nodes.
 * @param {Element=} canvas Optional canvas DOM element to improve layout computation performance.
 * 
 * @return An array of {x, y}, indicating the top-left position of each node.
 */
squishy.Graph.prototype.computeInRankPosition = function(ranks, canvas) {
    var positions = [];
    var y = 0;
    for (var i = 0; i < ranks.length; ++i) {
        var x = 0;
        var rankNodes = ranks[i];
        for (var j = 0; j < rankNodes.length; ++j) {
            var node = rankNodes[j];
            
            x += this.layout.nodeSizeMax.x + this.layout.nodeSeparation.x;
            
            if (!node.virtual)
            	positions[node.nodeindex] = [ x, y ];
        }
        y += this.layout.nodeSizeMax.y + this.layout.nodeSeparation.y;
    }
    return positions;
};


// #################################################################
// Layout utilities

/**
 * The slack is (arc length) - (min length). The min length is usually 1.
 *
 * @param arc The arc.
 */
squishy.Graph.prototype.arcGetSlack = function(arc) {
    var arcLen = this.arcGetLen(arc);
    return arcLen - this.layout.arcMinLength;
};
