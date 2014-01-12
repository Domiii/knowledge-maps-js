
/**
 * A GraphGen provides methods to create random cycle-free directed graphs of arbitrary size.
 */
squishy.GraphGen = function() {
    
};

/**
 * Creates a new digraph with the given number of nodes and arcs.
 * 
 * @param {number} nNodes Number of nodes graph.
 * @param {number} nArcs Number of arcs graph.
 * @param {number=} minWeight Min weight of each edge (default = 1).
 * @param {number=} minWeight Max weight of each edge (default = 2).
 */
squishy.GraphGen.prototype.genGraph = function(nNodes, nArcs, minWeight, maxWeight) {
    var minWeight = minWeight || 1;
    var maxWeight = maxWeight || 2;
    
    // sanity checks
    squishy.assert(nArcs >= nNodes-1, "There must be at least enough arcs to connect all nodes.");
    squishy.assert(nArcs <= nNodes*nNodes / 2 - 1, "DAG can have at most nNodes^2/2 - 1 arcs.");
    
    var nodes = this.genNodes(nNodes);
    
    // 1. generate all possible DAG arc combinations:
    var possibleGoalNodes = squishy.createArray(Math.ceil(nNodes*nNodes/2), []);
    for (var i = 0; i < nNodes; ++i) {
        for (var j = i+1; j < nNodes; ++j) {
            possibleGoalNodes[i].push(j);
        }
    }
    
    // first, iterate over all nodes
    var allNodes = squishy.createArray(nNodes-1);
    for (var i = 0; i < nNodes-1; ++i) {
    	allNodes[i] = i+1;
    }
    
    // make sure that every new arc starts at a node that is already connected
    var connectedNodes = [0];
    var connectedNodeMap = {"0" : true};
    
    // 2. generate random arcs
    var arcs = squishy.createArray(nArcs);
    for (var i = 0; i < nArcs; ++i) {
        var weight = squishy.randomInt(minWeight, maxWeight);
        var from = connectedNodes.randomElement();
        var toIdx;
        if (allNodes.length > 0) {
        	// first, make sure that every node exists at least once
        	// TOOD: Continue from here
        	toIdx = 
        }
        else {
	        // then draw from other possible arc combinations
	        toIdx = squishy.randomInt(0, possibleGoalNodes[from].length-1);
        }
        var to = possibleGoalNodes[from][toIdx];
        possibleGoalNodes[from].splice(toIdx, 1);	// exclude drawn arc from future draws
        if (!connectedNodeMap) {					// update connectivity map
        	connectedNodeMap[to.toString()] = true;
        	connectedNodes.push(to);
        }
        
        
        arcs[i] = {
            arcid : i,
            from : nodes[from].nodeid,
            to : nodes[to].nodeid,
            weight : weight
        };
    }
    
    var graphData = {
        nodes : nodes,
        arcs : arcs
    };
    
    return new squishy.Graph(graphData);
};


/**
 * Generates a fixed amount of random nodes.
 * 
 * @param {number} nNodes The number of nodes to be generated.
 */
squishy.GraphGen.prototype.genNodes = function(nNodes) {
    var nodes = squishy.createArray(nNodes);
    
    for (var i = 0; i < nNodes; ++i) {
        nodes[i] = {
            nodeid : i,
            title : "#" + i + " - This is the great title of node #" + i + "'",
            htmlInfo : "HTML info of random node " + i + " TODO: More."
        };
    }
    
    return nodes;
};