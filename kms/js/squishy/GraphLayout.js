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
        arcs : [] }
    );
    
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
// DOT Step #1: Compute Ranks

/**
 * Computes the rank property of each node.
 * 
 * @private
 */
squishy.Graph.prototype.computeRanks = function() {
    // TODO: First group by tags, and then compute the inter-group and intra-group layouts separately
    
    // we compute the tree and with it the node ranks.
    var tree = this.computeFeasibleTree();
    
    // All other steps are unnecessary since we only have a single root (citation missing)
    
    // while ((arcBad = this.getNextBadArc(tree)) != null) {
        // arcGood = this.getReplacementArc(arcBad, tree);
        // tree.replaceEdge(arcBad, arcGood);
    // }
    // this.normalize(); // not currently necessary (set min rank to 0)
    // this.balance();  // TODO: For edges with multiple feasible rank choices, choose the least crowded one
};

/**
 * @private
 */
squishy.Graph.prototype.computeFeasibleTree = function() {
    this.initRanks();
    this.NRankMin = 0;
    this.NRankMax = 0;
    
    /** @const */ var nNodes = this.nodes.length;      // total node count
    var tree = { arcsIn : squishy.createArray(nNodes, []) };        // arcs is a list of arcs
    
    var _this = this;
    var nTreeSize = 1;		// root is already added
    var leastAdjacentArc;
    var leastAdjacentArcSlack;
    var bfsCallback = function(nextArc) {
        var slack = _this.arcGetSlack(nextArc);
        if (slack === 0) {       // tight arc
            // in a tree, every node can only have a single parent.
            var toNode = _this.nodes[nextArc.to];
            tree.arcsIn[toNode.nodeindex].push(nextArc);
            ++nTreeSize;
            return true;
        }
        
        // this arc is not tight -> But it's adjacent to the tree.
        if (slack < leastAdjacentArcSlack) {
            leastAdjacentArc = nextArc;
            leastAdjacentArcSlack = slack;
        }
        
        return false;
    };
    
    // start traversal
    var graphBFSState = this.BFSArcsInit();
    while (true) {
        // remember arc with least slack in incident fringe
        leastAdjacentArc = null;
        leastAdjacentArcSlack = 1e9;
        
        // grow tight tree
        this.BFSArcs(bfsCallback, graphBFSState);
        
        console.log(nTreeSize);
        if (nTreeSize == nNodes) {
            break;
        }
        
        // adjust ranks to make the next edge tight
        var delta = leastAdjacentArcSlack;
        if (leastAdjacentArc !== null) {
            this.Root.rank += delta;
            for (var i = 0; i < nNodes; ++i) {
                var arc = tree.arcs[i];
                if (arc !== null) {
                    var newRank = (this.nodes[arc.to].rank += delta);
                    _this.NRankMax = Math.max(_this.NRankMax, newRank);
                }
            }
        }
    }
    return tree;
};

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
// DOT Step #3: Reorder Children Lists

/**
 * Computes in-rank order, based on the median positions of ancestors.
 */
squishy.Graph.prototype.computeInRankOrder = function() {
    // First do a BFS for an initial ordering.
    // Returns "ranks" array and adds the "order" property to every node.
    var ranks = squishy.createArray(this.NRankMax+1, []);     // one array per rank
    var _this = this;
    this.Root.order = 0;
    
    this.BFSNodes(function(nextArc) {
        var node = _this.nodes[nextArc.to];
        var nodesInRank = ranks[node.rank];
        node.order = nodesInRank.length;
        nodesInRank.push(node);
        return true;
    });
    
    // compare order of two parents
    var compareFun = function(left, right) {
        var leftFromNode = _this.nodes[left.from];
        var rightFromNode = _this.nodes[right.from];
        if (leftFromNode.order < rightFromNode.order) return -1;
        else if (leftFromNode.order == rightFromNode.order) return 0;
        else return 1;
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
            var medianArc = sortedParents[sortedParents.length/2];
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
    var positions = squishy.createArray(this.nodes.length);
    var y = 0;
    for (var i = 0; i < ranks.length; ++i) {
        var x = 0;
        var rankNodes = ranks[i];
        for (var j = 0; j < rankNodes.length; ++j) {
            var node = rankNodes[j];
            var text = node.title;
            var textWidth = squishy.getTextWidth(text, this.layout.font, canvas);
            var width = Math.max(textWidth, this.layout.nodeSizeMax.x);
            var height = this.layout.nodeSizeMax.y;
            
            x += this.layout.nodeSizeMax.x + this.layout.nodeSeparation.x;
            
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
