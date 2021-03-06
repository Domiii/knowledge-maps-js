/*jslint node: true */
"use strict";

// Implementation of the dot graph layout algorithm for directed graphs with a single root.
// TODO: Fully add Google Closure - compatbile annotation.
// See: https://developers.google.com/closure/compiler/docs/js-for-compiler


// TODO: Don't let nodes overlap
// TODO: Improve layout

// ####################################################################################################
// Directed graph layout algorithm

/**
 * Computes the position and size of all node rectangles and their arcs.
 */
squishy.Graph.prototype.computeLayout = function() {
    var ranks = this.computeRanks();
    //this.logArcs(ranks, "computeRanks");
    var virtualMap = this;
    //var virtualMap = this.createVirtualGraph(ranks);
    var rankArrays = virtualMap.computeInRankOrder(ranks);
    return virtualMap.computeInRankPosition(ranks, rankArrays);
};


// #################################################################
// DOT Step #1: Compute Ranks

/**
 * Computes the rank property of each node.
 * 
 * @private
 */
squishy.Graph.prototype.computeRanks = function() {
    // we compute the tree and with it the node ranks.
    var ranks = this.computeRanksGreedily();
	
	return ranks;
};

/**
 * Simple greedy scheme of moving a sub-graph down by one if an arc is not tight.
 * 
 * @private
 */
squishy.Graph.prototype.computeRanksGreedily = function() {
	// get initial ranking, using BFS
    var ranks = this.initRanks();
	
	// visitor function that moves the rank of every node down by the given amount of slack
	var visitorFunc = function (arc) {
		var slack = this.arcGetSlack(arc, ranks);
		if (slack < 0) {
			ranks[arc.to] -= slack;
		}
		return true;
	};
    
    // iterate over all arcs in BF order
    this.BFSArcs(function(arc) {
        //console.log("visited arc: " + arc.from + " -> " + arc.to);
    	var slack = this.arcGetSlack(arc, ranks);
    	
    	if (slack < 0) {
    		var fromNode = this.nodes[arc.from];
            
            // re-check sub-graph
            var bfsState = this.BFSArcsInit([fromNode]);
            this.BFSArcs(visitorFunc, bfsState);
    	}
        return true;
    });
    return ranks;
};


/**
 * Produces an initial node ranking with breadth-first order.
 * Sets the rank property of each node.
 *
 * @private
 */
squishy.Graph.prototype.initRanks = function() {
	// init ranks
	var ranks = squishy.createArray(this.nodes.length);
	ranks[0] = 0;
    /** @const */ var _this = this;
    this.BFSNodes(function(nextArc) { 
        ranks[nextArc.to] = ranks[nextArc.from]+1;
        return true;
    });
	
	return ranks;
};



// #################################################################
// DOT Simplex Network Algorithm

/**
 * Runs the Simplex Network algorithm on this graph and returns the "rank" of each node
 * in an array, indexed by nodeindex.
 * 
 * Reference: Paper "A Technique for Drawing Directed Graphs" [1993]
 * 
 * @return An array of ranks, indexed by nodeindex.
 */
squishy.Graph.prototype.runSimplexNetwork = function() {
	var ranks = this.initRanks();
    
    // feasible tree
	var tree = this.computeFeasibleTree(ranks);
	
	// while ((arcBad = this.getNextBadArc(tree)) != null) {
        // arcGood = this.getReplacementArc(arcBad, tree);
        // tree.replaceEdge(arcBad, arcGood);
    // }
    // this.normalize();	// make sure, the root has rank 0
    // this.balance();  // TODO: For edges with multiple feasible rank choices, choose the least crowded one
};

/**
 * @private
 */
squishy.Graph.prototype.computeFeasibleTree = function(ranks) {
    // compute 
    /** @const */ var nNodes = this.nodes.length;      // total node count
    var tree = { 
    	arcs : [],
    	nodes : {0:1}			// add root initially
   	};
   	
    var _this = this;
    var leastAdjacentArc;
    var leastAdjacentArcSlack;
    var bfsCallback = function(nextArc) {
        var slack = _this.arcGetSlack(nextArc, ranks);
    	
    	// if (tree.nodes[nextArc.to]) {
    		// return true;		// node has already been added
    	// }
    	
    	// grow a tight tree
        if (slack === 0) {       // tight arc
            tree.arcs.push(nextArc);
            tree.nodes[nextArc.to] = 1;
            ++tree.size;
            return true;
        }
        
        // this arc is not tight -> But it's adjacent to the tree.
        if (slack < leastAdjacentArcSlack) {
            leastAdjacentArc = nextArc;
            leastAdjacentArcSlack = slack;
            console.log("leastAdjacentArcSlack: " + leastAdjacentArcSlack);
        }
        
        return false;
    };
    
    // start traversal
    var graphBFSState = this.BFSArcsInit();
    while (true)
    {
        // remember arc with least slack in incident fringe
        leastAdjacentArc = null;
        leastAdjacentArcSlack = 1e9;
        
        // grow tight tree
        this.BFSArcs(bfsCallback, graphBFSState);
        if (tree.size == nNodes) {
            break;
        }
        
        debugger;
        
        // adjust ranks to make the next edge tight
        var delta = leastAdjacentArcSlack;
        ranks[this.Root.nodeindex] += delta;
        for (var i = 0; i < tree.arcs.length; ++i) {
            var arc = tree.arcs[i];
            ranks[arc.to] += delta;
        }
    }
    this.logArcs("computeFeasibleTree");
    return tree;
};



// #################################################################
// DOT Step #2: Create virtual nodes

/**
 * Creates a copy of the graph with virtual nodes so that every arc has unit length.
 * @private
 */
squishy.Graph.prototype.createVirtualGraph = function(ranks) {
    // shallow-copy all nodes into the new graph
    var virtualGraph = new squishy.Graph({ 
        nodes : this.nodes.clone(false), 
        arcs : [],
        layout : this.layout,
		allTags : this.allTags
    });
    
    // create all arcs
    for (var nArcs = this.arcs.length, j = 0; j < nArcs; ++j) {
        var arc = this.arcs[j];
        var arcLen = this.arcGetLength(arc, ranks);
        
        squishy.assert(arcLen >= this.layout.arcMinLength, "Slack is negative => Rank computation is bugged.");
        
		var fromNode = virtualGraph.nodes[arc.from];
        if (arcLen > 1) {
            // insert (len-1) virtual nodes
            var last = fromNode;
            for (var k = 1; k < arcLen; ++k) {
                last = virtualGraph.addNode(last, { title : "virtual node" }, arc.weight, arc.arcid);
				ranks[last.nodeindex] = ranks[fromNode.nodeindex] + k;		// add node rank
                last.virtual = 1;
            }
            
            // finally, connect the last virtual node and the child node
            var child = virtualGraph.nodes[arc.to];
            virtualGraph.addArc(last, child, arc.weight, arc.arcid);
        }
        else {
            // add the arc as-is
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
squishy.Graph.prototype.computeInRankOrder = function(ranks) {
    // First do a BFS for an initial ordering.
    // Returns "ranks" array and adds the "order" property to every node.
	var nRankMax = Math.max.apply(null, ranks);
    var rankArrays = this.rankArrays = squishy.createArray(nRankMax+1, []);     // one array per rank
    var _this = this;
    
    // add root
    this.Root.order = 0;
    rankArrays[0].push(this.Root);
    
    // get all ranks of nodes, and assign preliminary order
    this.BFSNodes(function(nextArc) {
        var node = _this.nodes[nextArc.to];
		var rank = ranks[node.nodeindex];
        var nodesInRank = rankArrays[rank];
        node.order = nodesInRank.length;
        nodesInRank.push(node);
        return true;
    });
    
    // compare nodes by order
    var compareFun = function(left, right) {
        if (left.order < right.order) return -1;
        else if (left.order == right.order) return 0;
        return 1;
    };
    
    // Now, improve the initial ordering using median.
    // We use stable sort to maintain the original order of siblings, if their parents has the same median order.
    // TODO: Iteratively perform local swaps, and switch up/down <-> down/up directions between iterations.
    for (var nRanks = nRankMax, i = 1; i <= nRanks; ++i) {
        var nodesInRank = rankArrays[i];
        for (var j = 0; j < nodesInRank.length; ++j) {
            var node = nodesInRank[j];
            // sort the parents
            var sortedParents = node.arcsIn.stableSort(compareFun);
            
            // TODO: Interpolation, in case there are multiple medians.
            
            // update order value based on parent order value
            var medianArc = sortedParents[Math.floor(sortedParents.length/2)];
            var medianNode = this.nodes[medianArc.from];
            node.order = medianNode.order;
        }
        
        // re-order correspondingly
        rankArrays[i] = nodesInRank.stableSort(compareFun);
		
		// and assign correct order value
        for (var j = 0; j < nodesInRank.length; ++j) {
            var node = nodesInRank[j];
			node.order = j;
		}
    }
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
squishy.Graph.prototype.computeInRankPosition = function(ranks, rankArrays) {
    var positions = [];
    var dx = this.layout.nodeSizeMax.x + this.layout.nodeSeparation.x;
    var dy = this.layout.nodeSizeMax.y + this.layout.nodeSeparation.y;
	var nRankMax = Math.max.apply(null, ranks);
	
	// compute position
    for (var i = 0; i < this.nodes.length; ++i) {
    	var node = this.nodes[i];
	
		if (!node.virtual) {
			var order = node.order;
			var rank = ranks[node.nodeindex];
			var x = order * dx + this.layout.nodeSeparation.x;
        	var y = rank * dy + this.layout.nodeSeparation.y;
        	positions[node.nodeindex] = [ x, y ];
        }
    }
    
    // improve position result:
	
    
    return positions;
};


// #################################################################
// Layout utilities

/**
 * The slack is (arc length) - (min length). The min length is usually 1.
 *
 * @param arc The arc.
 */
squishy.Graph.prototype.arcGetSlack = function(arc, ranks) {
    var arcLen = this.arcGetLength(arc, ranks);
    return arcLen - this.layout.arcMinLength;
};


/**
 * The length of an arc is the rank distance between it's nodes.
 *
 * @param arc The arc.
 */
squishy.Graph.prototype.arcGetLength = function(arc, ranks) {
    return ranks[arc.to] - ranks[arc.from];
};