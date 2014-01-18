
/**
 * A GraphGen provides methods to create random cycle-free directed graphs of arbitrary size.
 */
squishy.GraphGen = function() {
    
};

/**
 * Generates a random digraph.
 * 
 * @param {number} nRanksMin Min number of ranks.
 * @param {number} nRanksMax Max number of ranks.
 * @param {number} nWidthMin Min nodes per rank.
 * @param {number} nWidthMax Max nodes per rank.
 * @param {number} nEdgeCreationChance Chance between 0 and 1, that a new edge will be created.
 * @param {number=} nWeightMin Min weight of each edge (default = 1).
 * @param {number=} nWeightMax Max weight of each edge (default = 1).
 * 
 * @see http://stackoverflow.com/questions/12790337/generating-a-random-dag
 */
squishy.GraphGen.prototype.genGraph = function(nRanksMin, nRanksMax, nWidthMin, nWidthMax, nEdgeCreationChance, nWeightMin, nWeightMax) {
    var nWeightMin = nWeightMin || 1;
    var nWeightMax = nWeightMax || 2;
	
	// sanity checks
	squishy.assert(nRanksMin > 1);
	squishy.assert(nRanksMax >= nRanksMin);
	squishy.assert(nWidthMax >= nWidthMin);
	squishy.assert(nWeightMax >= nWeightMin);
	
	var arcs = [];
	
	// add root
	var nodes = [0];
	var nodeMap = { "0" : 1 };
    
    // iterate over all ranks
    var nRanks = squishy.randomInt(nRanksMin, nRanksMax);
    var nPreviousNodes = 1;
    for(var iRank = 1; iRank <= nRanks; iRank++) {
    	var nNodesInRank = squishy.randomInt(nWidthMin, nWidthMax);
    	var nNewNodes = 0;
	    for (var iFrom = 0; iFrom < nPreviousNodes; iFrom++) {
		    for (var iTo = 0; iTo < nNodesInRank; iTo++) {
		    	if (Math.random() < nEdgeCreationChance) {
			    	var toNodeid = nPreviousNodes + iTo;
			    	
			    	// add arc
			    	arcs.push({
			    		arcid : arcs.length,
			    		from : nodes[iFrom],
			    		to : toNodeid,
			    		weight : squishy.randomInt(nWidthMin, nWidthMax)
			    	});
			    	
			    	// add node (if not already added)
			    	if (!nodeMap[toNodeid.toString()]) {
				    	nodes.push(toNodeid);
				    	nodeMap[toNodeid.toString()] = 1;
				    	++nNewNodes;
			    	}
		    	}
		    }
	    }
	    
	    var rankNodes = nodes.slice(nPreviousNodes, nPreviousNodes + nNewNodes);
	    console.log("Nodes in rank #" + iRank + ": " + rankNodes);
	    nPreviousNodes += nNewNodes;
	 }
    var graphData = {
        nodes : this.genNodes(nodes),
        arcs : arcs
    };
    
    return new squishy.Graph(graphData);
};


/**
 * Generates nodes with the given ids.
 * 
 * @param {number} nNodes The number of nodes to be generated.
 */
squishy.GraphGen.prototype.genNodes = function(nodeIds) {
    var nodes = squishy.createArray(nodeIds.length);
    for (var i = 0; i < nodeIds.length; ++i) {
    	var nodeid = nodeIds[i];
        nodes[i] = {
            nodeid : nodeid,
            title : "#" + nodeid + " - This is the great title of node #" + nodeid + "'",
            htmlInfo : "HTML info of random node " + nodeid + "<br> TODO: More."
        };
    }
    
    return nodes;
};