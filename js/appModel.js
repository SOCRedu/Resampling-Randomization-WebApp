/**
 *appModel.js is the model object for the SOCR app.
 *
 *@author selvam , ashwini
 * @constructor
 *@return {object}
 *SOCR - Statistical Online Computational Resource
*/

socr.model=function(){
//::::::: PRIVATE PROPERTIES :::::::::::::::
	var _stopCount = 1000;			//Number of runs to be made when 'run' button is pressed 
	var _count=0;					//keeps count of number of samples generated from start
	var _n=["0 is taken"];			//Number of datapoints in a bootstrap sample or Sample Size
	var _K=1;						//contains the number of datasets
	/*
	Why there are keys and values? Its because in some form of data input (like coin toss), the "key" contains the symbolic meaningful reference whereas the "value" contains the mathematical equivalent value.
	*/
	var _this=this;

//::::::: PRIVATE METHODS :::::::::::::::
	/**
	 * @method : _getRandomInt()
	 * @desc   : returns a random number in the range [min,max]
	 * @param  : min , max
	 * @return : {number}
	 */
	function _getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min )) + min;
	}

	/**
	 *@method : _generateMean
	 *@param  : {number|string} sampleNumber - the random sample number for which the mean is to be calculated
     *@param  : {number} groupNumber
	 *@desc   : the calculated mean value
	 *@return : {number}
	*/
	function _generateMean(sampleNumber,groupNumber){
        var groupNumber= groupNumber || 1;
        var total=0;
        if(sampleNumber === "dataset"){
        	var _val = socr.dataStore.dataset[groupNumber].values.getData();
            for(var i=0;i<_val.length;i++) {
                total += parseFloat(_val[i]);
            }
            total=total/_val.length;
            if(isNaN(total)){return false;}else{return total;}
        }
        else{
		    var total=_generateCount(sampleNumber,groupNumber);
		    return total/socr.dataStore.bootstrapGroup[sampleNumber].values.getData(groupNumber).length;
        }
    }
	
	/**
	 *@method : _generateCount
	 *@param  : sampleNumber - the random sample number for which the count is to be calculated
     *@param  : groupNumber
	 *@desc   : the calculated total count value for the sample
	 *@return : {number}
	*/
	function _generateCount(sampleNumber,groupNumber){
		var x=socr.dataStore.bootstrapGroup[sampleNumber].values.getData(groupNumber);
		var total=0;
		for(var i=0;i<x.length;i++) {
		   total += parseFloat(x[i]);
		}
		return total;
	}
	
	/**
     *@method : _generateStandardDev
	 *@param  : sampleNumber , groupNumber
	 *@desc   : the calculated mean standard deviation.
	 *@return : {number} standard deviation for the input sample and group numbers
	*/
	function _generateStandardDev(sampleNumber,groupNumber){
		//formula used here is SD= ( E(x^2) - (E(x))^2 ) ^ 1/2
		var _mean=_generateMean(sampleNumber,groupNumber) ;			//E(x)
		var _squaredSum=null;							//stores E(x^2)
		var _sample=socr.dataStore.bootstrapGroup[sampleNumber].values.getData(groupNumber)
		for(var i=0;i<_sample.length;i++){
			_squaredSum+=_sample[i]*_sample[i];
		}
		_squaredSum=_squaredSum/_sample.length;
		//console.log("_squaredSum"+_squaredSum+"--- _mean:"+_mean);
		var _SD=Math.sqrt(_squaredSum-(_mean)*(_mean));
		return _SD;
	}

    /**
     *@method  : _generateF
     * @desc   : Generates the F value using the one way ANOVA method
     * @param  :sampleNumber
     * @return :{object}
     */
	function _generateF(sampleNumber){
		if(sampleNumber == undefined){
			return null;
		}
		else{
			var _k=0,_ymean=[],_total=0,_N= 0,_sst=0,_sse=0, _data=[];
			_k=_this.getK();
			if (sampleNumber === "dataset"){
				for (var i = 1; i <=_k; i++) {
					_data[i] = socr.dataStore.dataset[i].values.getData();
				};
			}
			else{
				_data=socr.dataStore.bootstrapGroup[sampleNumber].values.getData()
			}

            for(i=1;i<=_k;i++){
				_ymean[i] = $.mean(_data[i]);
                _N +=_data[i].length;       //calculate N = total number of observations
				_total+=_ymean[i];
			}
			var _y = _total/_k; // grand mean
//            console.log("dataset:");
//            console.log(_data);
//            console.log("means");
//            console.log(_ymean);
//            console.log("grand mean: "+ _y);
//            console.log("N :"+ _N)
            var _dofe=_k - 1;//calculate the dof between =  k - 1
			var _dofw=_N - _k; //calculate the dof within = N - k
//
//            console.log("dofe:"+_dofe);
//            console.log("dofw:"+_dofw);

			//SST
			for (i = 1; i <= _k; i++) {
				_temp = (_ymean[i] - _y);
				_sst+=_data[i].length*_temp*_temp;
			}
//			console.log("_sst:"+_sst);
			//SSE
			for (var i = 1,_temp=0; i <= _k; i++) {
				for(var j=0;j<_data[i].length;j++){
					_temp = ( _data[i][j] - _ymean[i]);
					_sse+=_temp*_temp;
				}
			}
//			console.log("_sse:"+_sse);
			//MST
			var _mst = _sst/_dofe;
			//MSE
			var _mse = _sse/_dofw;
//            console.log("mean sum of squares between "+_mst);
//           console.log("mean sum of squares within  "+_mse);

//            console.log("F value: "+_mst/_mse);
			return {
                fValue:_mst/_mse,
                ndf:_dofe,
                ddf:_dofw
            };

		}
	}

    /**
     * @method : _generateP
     * @desc   :Generates p value for the "k" data groups using one way ANOVA method.
     * @param  :sampleNumber
     * @param  :_ndf
     * @param  :_ddf
     * @return :{number}
     */
    function _generateP(sampleNumber,_ndf,_ddf){
        var x = _generateF(sampleNumber);
        var _ndf = _ndf || x.ndf ;
        var _ddf = _ddf || x.ddf ;
        return socr.tools.fCal.computeP(x.fValue,_ndf,_ddf);
    }
	
	/**
	 *@method  : _generateZ
     * @desc   :Generates p value for the "k" data groups using difference of proportion test.
     * @param  :sampleNumber
     * @return : {number}
     */
	function _generateZ(sampleNumber){
		if(sampleNumber === "dataset"){
			var _data1 = socr.dataStore.dataset[1].values.getData(),
		    _data2 = socr.dataStore.dataset[2].values.getData();
		}
		else{
			var _data1 = socr.dataStore.bootstrapGroup[sampleNumber].values.getData(1),
		    	_data2 = socr.dataStore.bootstrapGroup[sampleNumber].values.getData(2);
		}
		var n1 = _data1.length,
		p1 = $.sum(_data1)/n1,
		n2 = _data2.length,
		p2 = $.sum(_data2)/n2;
		//quickly generate the proportions
		var p = (p1 * n1 + p2 * n2) / (n1 + n2);

		var SE = Math.sqrt(p * ( 1 - p ) * ((1/n1) + (1/n2)));

		return {
			zValue:(p1-p2)/SE
		}

	}
	/**
     * @desc Generates p value for the "k" data groups using difference of proportion.
     * @param sampleNumber
     * @param mu
     * @param sigma
     * @returns {number}
     * @private
     */
    function _generateDOP(sampleNumber,mu,sigma){
        try{
        	var x = _generateZ(sampleNumber),
        	mu=mu ||0,
        	sigma=sigma||1;
        }
        catch(e){
        	console.log(e.message)
        }
        return socr.tools.zCal.computeP(x.zValue,mu,sigma);
    }

return{
	n:_n,
	/* PUBLIC PROPERTIES   */
	//bootstrapGroupKeys:_bootstrapGroupKeys,
	//bootstrapGroupValues:_bootstrapGroupValues,

	
	/* PUBLIC METHODS   */
	/*
	addObserver:subject.addObserver(),
	removeObserver:subject.removeObserver()
	*/    
    
    /**
     *
     * @method: [public] generateTrail()
     * @param datasetIndex
     * @desc:  Generating a random number between 0 and dataSet size {@ashwini: I think this should be a private function}
     * @returns {object}
     */
	generateTrail:function(datasetIndex){
		var _temp = socr.dataStore.sampleSpace;
		if(_temp === undefined || this.getK() === false){
			return null;
		}
		else{
		var randomIndex=_getRandomInt(0, _temp.values.getData().length);	//generating a random number between 0 and dataSet size 
		return {
			key:_temp.keys.getData(randomIndex),
			value:_temp.values.getData(randomIndex)
			};			//returning the generated trail into a bootstrap sample array	
		}
	},

    /**
     *@method [public] generateSample()
     *@desc  generating a random number between 0 and dataSet size
     * @return {boolean}
     */

    generateSample:function(){
		var k=socr.model.getK(),
			keyEl=['0 is taken'],
			valEl=['0 is taken'],
			i=1;
		while(i <= k){
            /*EDIT THIS TO MAKE N DYNAMIC*/
            //var j = _n[k];
            var j = socr.model.getN()[i];
			var sample=[],values=[];
			while(j--){
				var temp=this.generateTrail(k);
				sample[j]=temp.key;	//inserting the new sample
				values[j]=temp.value;
			}
			keyEl.push(sample);
			valEl.push(values);
			i++;
		}
		socr.dataStore.createObject("bootstrapGroup."+_count+".keys",keyEl);
		socr.dataStore.createObject("bootstrapGroup."+_count+".values",valEl);
		//Object.defineProperty(_bootstrapGroupKeys,_count,{value:keyEl,writable:true,configurable : true});
		//Object.defineProperty(_bootstrapGroupValues,_count,{value:valEl,writable:true,configurable : true});
		_count++;		//incrementing the total count - number of samples generated from start of simulation
        return true;
	},

	/**
	 * @method getMean()
	 * @desc  executed when the user presses "infer" button in the controller tile. The click binding of the step button is done in the {experiment}.js
	 * @param groupNumber
     * @return {Array}
	*/
	getMean:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		var obj = socr.dataStore.createObject(groupNumber+".mean",[])[groupNumber].mean;
		if(obj.getData().length=== _count){
            console.log("already saved!");
			return obj.getData()
		}
		else{
			var _mean=[];
			for(var j=obj.getData().length;j<_count;j++){
				_mean[j]=_generateMean(j,groupNumber);
			}
			obj.setData(_mean)
			return obj.getData()
			}
		},

    /**
     * @method getMeanOf()
     * @desc  executed when the user presses "infer" button in the controller tile.
     *        The click binding of the step button is done in the {experiment}.js
     * @param sampleNumber
     * @param groupNumber
     * @returns {number}
     */
	getMeanOf:function(sampleNumber,groupNumber){
		return _generateMean(sampleNumber,groupNumber);
	},

	
	/** STANDARD DEVIATION METHODS STARTS **/

    /**
     * @method getStandardDev
     * @param groupNumber
     * @returns {*}
     */
	getStandardDev:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		//if the _sampleStandardDev already has the values
		if(_sample.StandardDev[groupNumber] === undefined){
			_sample.StandardDev[groupNumber]=[];
		}
		var _temp=_sample.StandardDev[groupNumber];
		if(_temp.length==_bootstrapGroupValues.length)
			return _temp;
		else{
			for(var j=_temp.length;j<_count;j++){
				_temp[j]=_generateStandardDev(j,groupNumber);
				//console.log(_sampleStandardDev[j]);
			}
			_sample.StandardDev[groupNumber]=_temp;
			return _sample.StandardDev[groupNumber];
		}	
	},

    /**
     * @method getStandardDevOf
     * @param sampleNumber
     * @param groupNumber
     * @returns {number}
     */
    getStandardDevOf:function(sampleNumber,groupNumber){
		return _generateStandardDev(sampleNumber,groupNumber);
	},

    /**
     *
     * @param K
     * @returns {number}
     */
	getStandardDevOfDataset:function(K){
		var K=K || 1,
			_ds = socr.dataStore.dataset,
			_val=_ds[K].values.getData(),
			_mean=this.getMeanOf("dataset",K),
			_squaredSum=null;
		for(var i=0;i<_val.length;i++){
				_squaredSum+=_val[i]*_val[i];
			}
		_squaredSum=_squaredSum/_val.length;
		var _SD=Math.sqrt(_squaredSum-(_mean)*(_mean));
		console.log("SD of Dataset:"+_SD);
		return _SD;
	},

	/** STANDARD DEVIATION METHODS ENDS **/
	/** COUNT METHODS STARTS **/

    /**
     * @method getCount
     * @param groupNumber
     * @returns {Array}
     */
	getCount:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		var obj = socr.dataStore.createObject(groupNumber+".count",[])[groupNumber].count;
		if(obj.getData().length=== _count){
            console.log("already saved!");
			return obj.getData()
		}
		else{
			var _c=[];
			for(var j=obj.getData().length;j<_count;j++){
				_c[j]=_generateCount(j,groupNumber);
			}
			obj.setData(_c)
			return obj.getData()
		}
	},

    /**
     * @method getCountOf
     * @param {number | string}sampleNumber
     * @param {number} groupNumber
     * @returns {number}
     */
	getCountOf:function(sampleNumber,groupNumber){
        var K = groupNumber || 1,
        	_ds = socr.dataStore.dataset;
        if(sampleNumber === "dataset"){
            var _val=_ds[K].values.getData();
            var total=0;
            for(var i=0;i<_val.length;i++){
                total += parseFloat(_val[i]);
            }
            return total;
        }
        else{
		    return _generateCount(sampleNumber,K);
        }
	},

	/** COUNT METHODS ENDS **/
	/** PERCENTILE METHODS STARTS **/

	/**
	 * @method getPercentile ()
	 * @param  pvalue - what is the percentile value that is to be calculated.
     * @return {Array}
	*/
	getPercentile:function(pvalue){
	console.log("getPercentile() invoked");
	//if(_samplePercentile.length==bootstrapSampleValues.length)
	//		return _samplePercentile;
	//else
	//	{
		for(var j=0;j<_count;j++)
			{
			_sample.Percentile[j]=this.getPercentileOf(j,pvalue);
			//console.log(_samplePercentile[j]);
			}
			return _sample.Percentile;
	//	}
	},

    /**
     * @method getPercentileOf
     * @param sampleNumber
     * @param pvalue
     * @returns {*}
     */
	getPercentileOf:function(sampleNumber,pvalue){
		var temp=bootstrapSampleValues[sampleNumber].sort(function(a,b){return a-b});
		var position=Math.floor(bootstrapSampleValues[sampleNumber].length*(pvalue/100));
		//console.log(pvalue);
		//console.log(bootstrapSampleValues[sampleNumber]+"---"+position);
		return temp[position];
	},
    /**
     *
     * @param pvalue
     * @returns {*}
     */
	getPercentileOfDataset:function(pvalue){
		var temp=_datasetValues.sort(function(a,b){return a-b});
		var position=Math.floor(_datasetValues.length*(pvalue/100));
		return temp[position];
	},
	/** PERCENTILE METHODS ENDS **/

	/**
	*@method getF
	*@desc returns the F value computed from the supplied group
	*@return {Object}
    */
    getF:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		_this=this;
		var obj = socr.dataStore.createObject("F-Value",[])["F-Value"];
		if(obj.getData().length=== _count){
            console.log("already saved!");
			return obj.getData()
		}
		else{
			var _f=[];
			for(var j=obj.getData().length;j<_count;j++){
				_f[j]=_generateF(j).fValue;
			}
			obj.setData(_f)
			return obj.getData()
		}
	},

    /**
     * @method  getFof
     * @desc returns the F value computed from the supplied group
     * @param sampleNumber - Random sample Number at which the F value is to be calculated
     * @returns {Object}
     */
    getFof:function(sampleNumber){
    	//check if K > 1 and there are random samples to compute F.
        if (socr.model.getK() <= 1 || socr.dataStore.bootstrapGroup === undefined) {
        	return false
        };
        _this=this;
        return _generateF(sampleNumber);
    },

    /**
     * @method getP
     * @return {Object}
     */

    getP:function(groupNumber){
 		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		_this=this;
		var obj = socr.dataStore.createObject("P-Value",[])["P-Value"];
		if(obj.getData().length=== _count){
            console.log("already saved!");
			return obj.getData()
		}
		else{
			var _p=[];
			for(var j=obj.getData().length;j<_count;j++){
				_p[j]=_generateP(j);
			}
			obj.setData(_p)
			return obj.getData()
		}
    },

    /**
     * @method getPof
     * @param sampleNumber
     * @returns {number}
     */
    getPof:function(sampleNumber){
    	//check if K > 1 and there are random samples to compute P.
        if (socr.model.getK() <= 1 && socr.dataStore.bootstrapGroup === undefined) {
        	return false
        };
        _this=this;
        return _generateP(sampleNumber);
    },

    /**
     * @method getDOP
     * @return {Object}
     */

    getDOP:function(){
		_this=this;
		var obj = socr.dataStore.createObject("DOPValue",[])["DOPValue"];
		if(obj.getData().length=== _count){
            console.log("already saved!");
			return obj.getData()
		}
		else{
			var _p=[];
			for(var j=obj.getData().length;j<_count;j++){
				_p[j]=_generateDOP(j);
			}
			obj.setData(_p)
			return obj.getData()
		}

    },
    /**
     * @method getDOPof
     * @param sampleNumber
     * @returns {number}
     */
    getDOPof:function(sampleNumber){
    	_this=this;
        return _generateDOP(sampleNumber);
    },

    /**
     * @method getDataset
     * @desc  getter function for dataSet variable.
     * @param K  dataset number , field - what value to return i.e values or keys or name
     * @param field
     * @returns {*}
     */
	getDataset:function(K,field){
		if(K===undefined)
				K=1;
		if(field ===undefined)
			field='keys';
		try{
			return socr.dataStore.dataset[K][field].getData()
		}
		catch(e){
			console.log(e.message)
			return false
		}
	},

	/**
	 * @method setDataset
	 * @desc sets the data from the input sheet into the app model
     * @param input
     * @return {boolean}
	 */
	setDataset:function(input){
		//check for input values...if its empty...then throw error
        if(input === undefined || typeof input != "object"){
            return false;
        }
		//input.processed is true in case of a simulation -> data mode switch
		if(input.processed){
			var ma1=[],ma2=[];
			for(var i=0;i<input.keys.length;i++){
				socr.dataStore.createObject("dataset."+(i+1)+".values",input.values[i]).createObject("dataset."+(i+1)+".keys",input.keys[i]);
				ma1 = ma1.concat(input.values[i]);
				ma2 = ma2.concat(input.keys[i]);
			}
			socr.dataStore.createObject("sampleSpace.values",ma1).createObject("sampleSpace.keys",ma2)
			console.log('Simulation data is loaded now.');
			return true;
		}
		else if(input.type=='url'){
			console.log('Simulation data is loaded now.');
			return false;
		}
		else if(input.type=='spreadsheet'){
			var ma1=[],ma2=[];
			//clear previous data.
			socr.dataStore.removeObject("dataset");
			console.log(input.values.length);
			for (var i = 0; i < input.values.length; i++) {
				var _cells=input.values[i].cells,
					_id=input.values[i].id,
					_temp=[];
				console.log("_cells : "+_cells);
				for (var j = 0; j < _cells.length; j++) {
					if (_cells[j][0] !== ""){
						_temp[j]=_cells[j][0];
						console.log(_temp[j]);
					}
					else{
						break;
					}
				};
				socr.dataStore.createObject("dataset."+_id+".values",_temp).createObject("dataset."+_id+".keys",_temp);
				ma1 = ma1.concat(_temp);
				ma2 = ma2.concat(_temp);
			};
			socr.dataStore.createObject("sampleSpace.values",ma1).createObject("sampleSpace.keys",ma2);
			if(!socr.dataStore.dataset){
					return false;
			}
			else{
				return true;
			}

		}
	},
    /**
	 *@method : getSample
	 *@param  : index  random sample index
     *@param  : K group index
	 *@param  : type values or keys
	 *@desc   : getter and setter function for random samples.
	 */
	getSample:function(index,type,K){
		P=0;
		K= K || 1;		//default set to 1
		type=type || "values";	//default set to "values"
        if(this.getRSampleCount() === 0){
            return false;
        }
        var _bg = socr.dataStore.bootstrapGroup[index] ;
		if(type === "values"){
			return _bg.values.getData(K);
		}
		else{
			return _bg.keys.getData(K);
		}
	},

    /**
     * @method - getSamples
     * @param type
     * @param K
     * @returns {Array}
     */
	getSamples:function(type,K){
		type = type || "values",
		K=K || 1;
		var _temp=[];
		var _bg = socr.dataStore.bootstrapGroup;
		if(type==="values"){
			for(var i=0;i<_count;i++){
			  _temp[i]=_bg[i].values.getData(K);
			}
		}
		else{
			for(var i=0;i<_count;i++){
			  _temp[i]=_bg[i].keys.getData(K);
			}
		}
		return _temp;
	},
	
	/**  getter and setter for variable '_stopCount'  */
	setStopCount:function(y){
		//alert(y);
		_stopCount=y;
	},
	getStopCount:function(){
		return _stopCount;
	},
	
	/**  getter and setter for variable '_n'  */
	setN:function(z){
		/*NEED TO MAKE N DYNAMIC*/
		/*if z length != to dataset length, then default the values to the dataset lengths*/
		//purge _n array
		_n.length=0;
		_n.push("0 is taken");
		var _k = socr.model.getK();
		var _ds = socr.dataStore.dataset;
		if (typeof z === "undefined" || z === null){
			//computing default values
			if(typeof _ds !== "undefined"){
				for (var i = 1; i <= _k; i++) {
					try{
						_n.push(_ds[i]['values'].getData().length)
					}
					catch(e){
						console.log(e.message);
						PubSub.publish("Error in model");
					}
				}
			}
		} 
		else if($.isArray(z)){
			if((z.length-1 === _k )||(z.length === _k)){
				z.forEach(function(el,index,arr){
					if(typeof el === "undefined" || el === null){
						z[i] = _ds[i]['values'].getData().length
					}
				},z);
				_n.push(z);
			}
			else{
				//some values are missing
				//this case will come almost never
			}
		}
		else if(typeof z === "number" || typeof z === "string"){
			console.log(typeof z + " is the type of Z")
			z = parseInt(z);
			for (var i = _k; i > 0; i--) {
				_n.push(z)
			}
		}
		console.log(_n);
	},
	getN:function(){
		return _n;
	},

	/**  getter and setter for variable '_count'  */
	setRSampleCount:function(v){
		_count=v;
		return true;
	},

	getRSampleCount:function(){
		return _count;
	},

	reset:function(option){
		if(option !== "undefined" && option === "samples"){
			socr.dataStore.removeObject("bootstrapGroup");
			//setting the global random sample count to 0
			socr.model.setRSampleCount(0);	
		}
		else{
			//all values deleted
			socr.dataStore.removeObject("all");
			//setting the global random sample count to 0
			socr.model.setRSampleCount(0);
		}
	},

    /**
     * @method :getK
     * @return : {number}
     */
	getK:function(){
		var _count=0;
		try{
			_ds = socr.dataStore.dataset;
		}
		catch(e){
			console.log(e.message)
			return false;
		}
		for (var name in _ds) {
    		if (_ds.hasOwnProperty(name)) {
        		_count++;
        	}
  	  	}
		return _count;
	}
}//return
}
