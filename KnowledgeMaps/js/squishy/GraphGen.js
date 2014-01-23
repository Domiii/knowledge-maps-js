
/**
 * A GraphGen provides methods to create random cycle-free directed graphs of arbitrary size.
 */
squishy.GraphGen = function() {
    this.allTags = ["tag1", "banana", "apple"];
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

    
    // iterate over all ranks
    var nRanks = squishy.randomInt(nRanksMin, nRanksMax);
    for(var iRank = 1; iRank <= nRanks; ++iRank) {
	    var nPreviousNodes = nodes.length;
    	var nNewNodes = squishy.randomInt(nWidthMin, nWidthMax);
        
        // add new nodes
        var newNodeIdsInRank = squishy.createArray(nNewNodes);
        for (var iTo = 0; iTo < nNewNodes; ++iTo) {
            newNodeIdsInRank[iTo] = nPreviousNodes + iTo;
        }
        
        newNodeIdsInRank.shuffle();
        
        // add edges to new nodes (at least one)
        for (var iTo = 0; iTo < nNewNodes; ++iTo) {
            var toId = newNodeIdsInRank[iTo];
            nodes.shuffle();    // re-shuffle
            
            // add arcs
            for (var iFrom = 0; iFrom < nPreviousNodes; ++iFrom) {
                var fromId = nodes[iFrom];
                
                squishy.assert(fromId < nPreviousNodes);
                squishy.assert(toId >= nPreviousNodes);
                
                // make sure there is at least one arc to the new node
		    	if (iFrom == 0 || Math.random() < nEdgeCreationChance) {
			    	// add arc
			    	arcs.push({
			    		arcid : arcs.length,
			    		from : fromId,
			    		to : toId,
			    		weight : squishy.randomInt(nWidthMin, nWidthMax)
			    	});
                    
                   // console.log("created arc: " + fromId + " -> " + toId);
		    	}
		    }
	    }
	    
	    //console.log("Nodes in rank #" + iRank + ": " + newNodeIdsInRank);
        
        // add new nodes to array
        nodes = nodes.concat(newNodeIdsInRank);
	    //console.log(nodes);
        
	}
    
    var graphData = {
        nodes : this.genNodes(nodes.length),
        arcs : arcs,
        allTags : this.allTags
    };
    
    return new squishy.Graph(graphData);
};


/**
 * Generates nodes with the given ids.
 * 
 * @param {number} nNodes The number of nodes to be generated.
 */
squishy.GraphGen.prototype.genNodes = function(nodeCount) {
    var nodes = squishy.createArray(nodeCount);
    for (var i = 0; i < nodeCount; ++i) {
    	var nodeid = i;
        var tags = [this.allTags.randomElement()];
        nodes[i] = {
            nodeid : nodeid,
            title : "#" + nodeid + " (" + i + ") - Generic Title",
            htmlInfo : "<p>Some info of node " + nodeid + "<p>More HTML info of random node " + nodeid + " <p> <a href='#'>a link</a>",
            tags : tags
        };
    }
    
    return nodes;
};