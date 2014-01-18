

// ####################################################################################################
// Misc graph methods


/**
 * Graph ctor.
 *
 * @constructor
 * @param config is explained below.
 * 
 * config: { layout, nodes, arcs }
 *
 * implicit properties:
 *  Graph is DAG with single root
 *  rank dimension = vertical (we call it y)
 *  sibling dimension = horizontal (we call it x)
 *
 * layout properties:
 *  arcMinLength = min length of an arc (usually 1)
 *  nodeSizeMax.x & nodeSizeMax.y = max node width & height
 *  nodeSeparation.x & nodeSeparation.y = space between nodes
 *  font = CSS font style (e.g. "bold 12pt arial")
 *
 * node properties:
 *  nodeid, title, htmlInfo
 * 
 * arc properties:
 *  arcid, from, to, weight
 *
 * new per-node properties: 
 *  node.rank = rank of node (y)
 *  node.inRankPos = in-rank position of node (x)
 *  node.size.x & node.size.y = size of node
 */ 
squishy.Graph = function(config) {
    config.clone(false, this);               // shallow-copy all properties from data to this
    this.Root = this.nodes[0];
    
    // change nodeid references in arcs (arc.to and arc.from) to use indices instead.
    var nodeId2Index = {};
    for (var i = 0; i < this.nodes.length; ++i) {
        var node = this.nodes[i];
        node.nodeindex = i;
        node.arcsIn = [];
        node.arcsOut = [];
        nodeId2Index[node.nodeid] = i;
    }
    
    // update arc to and from properties and use it to
    // fill every nodes' parent and child lists (arcsIn & arcsOut)
    for (var i = 0; i < this.arcs.length; ++i) {
        var arc = this.arcs[i];
        arc.arcindex = i;
        
        // get nodes and fix indices
        var fromIdx = nodeId2Index[arc.from];
        var toIdx = nodeId2Index[arc.to];
        var fromNode = this.nodes[fromIdx];
        var toNode = this.nodes[toIdx];
        arc.from = fromIdx;
        arc.to = toIdx;
        
        squishy.assert(fromNode, "from node #" + arc.from + " does not exist.");
        squishy.assert(toNode, "to node #" + arc.to + " does not exist.");
        
        // add arcs to nodes
        fromNode.arcsOut.push(arc);
        toNode.arcsIn.push(arc);
    }
};


/**
 * The length of an arc is the rank distance between it's nodes.
 *
 * @param arc The arc.
 */
squishy.Graph.prototype.arcGetLen = function(arc) {
    var fromNode = this.nodes[arc.from];
    var toNode = this.nodes[arc.to];
    return toNode.rank - fromNode.rank;
};

/**
 * @param {number} nodeid The id of the node to be obtained.
 */
squishy.Graph.prototype.nodeGet = function(nodeid) {
    return this.nodes[nodeid];
};


/**
 * Adds a new node to the given parent.
 * @param parent The parent of the new node.
 * @param {number} newWeight The weight of the new arc from parent to new child.
 * @param {number} newArcId The arc id, corresponding to an actual backend object.
 */
squishy.Graph.prototype.addNode = function(parent, newWeight, newArcId) {
    var newIdx = this.nodes.length;
    
    // create new child node 
    var newNode = {
        nodeid : -1,                // does not actually exist in the DB
        nodeindex : newIdx,
        rank : parent.rank,
        name : "virtual",
        arcsIn : [],
        arcsOut : []
    };
    
    // add new node and arc to graph
    this.nodes[newIdx] = newNode;
    this.addArc(parent, newNode, newWeight, newArcId);
    
    return newNode;
};

/**
 * Adds a new arc to this DAG.
 *
 * @param from The starting node of the arc.
 * @param to The goal node of the arc.
 * @param {number} weight The weight of the new arc.
 */
squishy.Graph.prototype.addArc = function(fromNode, toNode, newWeight, newArcId) {
    var newArcIdx = this.arcs.length;
    
    // create arc from parent to new child
    var newArc = {
      arcid : newArcId,
      arcindex : newArcIdx,
      from : fromNode.nodeindex,
      to : toNode.nodeindex,
      weight : newWeight
    };
    
    this.arcs[newArcIdx] = newArc;
    fromNode.arcsOut.push(newArc);
    toNode.arcsIn.push(newArc);
    return newArc;
};



// // load dependencies
// loadScriptOnInit( "GraphUtil.js" );
// loadScriptOnInit( "GraphLayout.js" );
