

// ####################################################################################################
// Misc graph methods


/**
 * Graph ctor.
 *
 * @constructor
 * @param config is explained below.
 * 
 * config: { layout, nodes, arcs, allTags }
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
 *  nodeid, title, htmlInfo, tags
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
    this.allTagString = this.allTags.join(",");
    this.minNodeid = 0;
    this.minArcid = 0;
    
    // change nodeid references in arcs (arc.to and arc.from) to use indices instead.
    var nodeId2Index = {};
    for (var i = 0; i < this.nodes.length; ++i) {
        var node = this.nodes[i];
        this.minNodeid = Math.max(this.minNodeid, node.nodeid);
        node.nodeindex = i;
        node.arcsIn = [];
        node.arcsOut = [];
        node.tagString = node.tags.join(",");
        squishy.assert(!nodeId2Index[node.nodeid], "Found two nodes with the same id: " + node.nodeid);
        nodeId2Index[node.nodeid] = i;
    }
    
    // update arc to and from properties and use it to
    // fill every nodes' parent and child lists (arcsIn & arcsOut)
    for (var i = 0; i < this.arcs.length; ++i) {
        var arc = this.arcs[i];
        arc.arcindex = i;
        this.minArcid = Math.max(this.minArcid, arc.arcid);
        
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
    
    //this.logArcs("ctor");
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
 * @param {number} newNodeId The new node id.
 * @param {number} newArcId The arc id of the new arc pointing from parent to the new node.
 */
squishy.Graph.prototype.addNode = function(parent, newNode, newArcWeight, newArcId) {
    var newIdx = this.nodes.length;
    
    // create new child node 
    newNode.nodeid = newNode.nodeid > 0 ? newNode.nodeid : this.minNodeid+1;
    newNode.nodeindex = newIdx;
    newNode.arcsIn = [];
    newNode.arcsOut = [];
    
    this.minNodeid = Math.max(this.minNodeid, newNode.nodeid);
    
    // add new node and arc to graph
    this.nodes[newIdx] = newNode;
    this.addArc(parent, newNode, newArcWeight, newArcId);
    
    return newNode;
};

/**
 * Adds a new arc to this DAG.
 *
 * @param from The starting node of the arc.
 * @param to The goal node of the arc.
 * @param {number=} weight The weight of the new arc (Default = 1).
 * @param {number=} newArcId The id of the new arc (Default = this.minArcId+1).
 */
squishy.Graph.prototype.addArc = function(fromNode, toNode, newWeight, newArcId) {
    var newArcIdx = this.arcs.length;
    
    newArcId = newArcId > 0 ? newArcId : this.minArcid+1;
    newWeight = newWeight || 1;
    
    // create arc from parent to new child
    var newArc = {
      arcid : newArcId,
      arcindex : newArcIdx,
      from : fromNode.nodeindex,
      to : toNode.nodeindex,
      weight : newWeight
    };
    
    this.minArcid = Math.max(this.minArcid, newArc.arcid);
    
    this.arcs[newArcIdx] = newArc;
    fromNode.arcsOut.push(newArc);
    toNode.arcsIn.push(newArc);
    return newArc;
};



// // load dependencies
// loadScriptOnInit( "GraphUtil.js" );
// loadScriptOnInit( "GraphLayout.js" );
