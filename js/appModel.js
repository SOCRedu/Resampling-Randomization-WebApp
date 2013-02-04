/**
*appModel.js is the model object for the SOCR app.
*
*@author: selvam , ashwini 
*
*SOCR - Statistical Online Computational Resource
*/

socr.model=function(){
//::::::: PRIVATE PROPERTIES :::::::::::::::
	var _stopCount = 1000;			//Number of runs to be made when 'run' button is pressed 
	var _count=0;					//keeps count of number of samples generated from start
	var _dataset={};				// All the input datapoints from wich bootstrap sample is generated
	var _n=50;						//Number of datapoints in a bootstrap sample or Sample Size
	var _K=1;						//contains the number of datasets
	/*
	Why there are keys and values? Its because in some form of data input (like coin toss), the "key" contains the symbolic meaningful reference whereas the "value" contains the mathematical equivalent value.
	*/

	/* Structure of both bootstrapGroupKeys and Values
		{
			"0": [ [..],[..],[..],..] ,
			"1": [ [..],[..],[..],..] ,
			 ..
		}
	*/
	var bootstrapGroupKeys={};
	var bootstrapGroupValues={};
	
	/*
	TODO: make the datasetKeys and datasetValues multidimensional to account for [Issue #4].  OBSOLETE
	*/
	//var _datasetKeys=[];
	//var _datasetValues=[];
	var _sample={
		Mean:{},
		Count:{},
		StandardDev:{},
		Percentile:{}
	};
/*
 IF EVENT DISPATCH MODEL IS TO BE IMPLEMENTED
	subject = new LIB_makeSubject(['generateSamples','generateSample']); //list of all the events with observer pattern
*/

/* PRIVATE METHODS   */
	/**
	*@method: [private] _getRandomInt()
	*@desc:  returns a random number in the range [min,max]
	*@return: Random number
	*/
	function _getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min )) + min;
	}

	/**
	*@method: [private] _generateMean()
	*@param:  sampleNumber - the random sample number for which the mean is to be calculated
	*@desc: 
	*@return: the calculated mean value
	*/
	function _generateMean(sampleNumber,groupNumber){
		var total=_generateCount(sampleNumber,groupNumber);
		return total/bootstrapGroupValues[sampleNumber][groupNumber].length;
	}
	
	/**
	*@method: [private] _generateCount()
	*@param:  sampleNumber - the random sample number for which the count is to be calculated
	*@desc: 
	*@return: the calculated total count value for the sample
	*/
	function _generateCount(sampleNumber,groupNumber){
		var x=bootstrapGroupValues[sampleNumber][groupNumber];
		var total=0;
		for(var i=0;i<x.length;i++) {
		   total += parseInt(x[i]); 
		}
		return total;
	}
	
	/**
	*@method: [private] _generateStandardDev()
	*@param:  sampleNumber - the random sample number for which the mean is to be calculated
	@dependencies: _generateMean()
	*@return: the calculated mean standard deviation
	*/
	function _generateStandardDev(sampleNumber,groupNumber){
		//formula used here is SD= ( E(x^2) - (E(x))^2 ) ^ 1/2
		var _mean=_generateMean(sampleNumber,groupNumber) ;			//E(x)
		var _squaredSum=null;							//stores E(x^2)
		var _sample=bootstrapGroupValues[sampleNumber][groupNumber];
		for(var i=0;i<_sample.length;i++){
			_squaredSum+=_sample[i]*_sample[i];
		}
		_squaredSum=_squaredSum/_sample.length;
		//console.log("_squaredSum"+_squaredSum+"--- _mean:"+_mean);
		var _SD=Math.sqrt(_squaredSum-(_mean)*(_mean));
		return _SD;
	}
	
return{
	/* PUBLIC PROPERTIES   */
	bootstrapGroupKeys:bootstrapGroupKeys,
	bootstrapGroupValues:bootstrapGroupValues,

	
	/* PUBLIC METHODS   */
	/*
	addObserver:subject.addObserver(),
	removeObserver:subject.removeObserver()
	*/    
    
    /**
	*@method: [public] generateTrail()
	*@desc:  Generating a random number between 0 and dataSet size {@ashwini: I think this should be a private function}
	*/
	generateTrail:function(datasetIndex){
		if(_dataset[1] === undefined || this.getK() === false)
		{
			return false;
		}
		else
		{
		
		var randomIndex=_getRandomInt(0, _dataset[datasetIndex].values.length);	//generating a random number between 0 and dataSet size 
		var _temp=_dataset[datasetIndex];
		return {
			key:_temp.keys[randomIndex],
			value:_temp.values[randomIndex]
			};			//returning the generated trail into a bootstrap sample array	
		}
	},
    
	/**
	*@method: [public] generateSample()
	*@desc:  generating a random number between 0 and dataSet size 
	*/
	generateSample:function(){
		var i=this.getK();	var keyEl=['0 is taken'],valEl=['0 is taken'],k=1;
		while(k<=i){
			var j=$('#nSize').val();
			var sample=[],values=[];
			while(j--)
				{
				var temp=this.generateTrail(k);
				sample[j]=temp.key;	//inserting the new sample
				values[j]=temp.value;
				}
			keyEl.push(sample);
			valEl.push(values);
			k++;
			}

		bootstrapGroupKeys[_count]=keyEl;
		bootstrapGroupValues[_count]=valEl;
		_count++;		//incrementing the total count - number of samples generated from start of simulation
	},
	
	/**
	*@method: [public] generateStep()
	*@desc:  executed when the user presses step button in the controller tile. The click binding of the step button is done in the {experiment}.js
	*@dependencies: generateTrail()
	*@return: returns the indexes of the dataset for the animation to occur
	*/
	generateStep:function(){
		var j=$('#nSize').val();
		var key=[];var values=[];var indexes=[];var datasetIndexes=[];
		while(j--)
			{
			//bootstrapSamples[_count][j]=this.generateTrail();
			var temp=this.generateTrail();
			key[j]=temp.key;	//inserting the new sample
			values[j]=temp.value;
			indexes[j]=temp.index;
			datasetIndexes[j]=temp.datasetIndex;
			}
		bootstrapSamples[_count]=key;
		bootstrapSampleValues[_count]=values;
		//bootstrapSamples[_count]= new Array(sample);
		//console.log(_count+' random sample:'+sample);
		_count++;
		return {
			indexes:indexes,
			datasetIndexes:datasetIndexes
				};
	},
	
	/**
	*@method: [public] getMean()
	*@desc:  executed when the user presses "infer" button in the controller tile. The click binding of the step button is done in the {experiment}.js
	*@param: groupNumber 
	*@dependencies: generateTrail()
	*/
	getMean:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		if(_sample.Mean[groupNumber] === undefined){
			_sample.Mean[groupNumber]=[];
		}
		
		if(_sample.Mean[groupNumber].length==bootstrapGroupValues.length )
			return _sample.Mean[groupNumber];
		else{
			for(var j=_sample.Mean[groupNumber].length;j<_count;j++)
				{
				_sample.Mean[groupNumber][j]=_generateMean(j,groupNumber);
				}
				return _sample.Mean[groupNumber];
			}
		},
	
	/**
	*@method: [public] getMeanOf()
	*@desc:  executed when the user presses "infer" button in the controller tile. The click binding of the step button is done in the {experiment}.js
	*@dependencies: generateTrail()
	*/	
	getMeanOf:function(sampleNumber,groupNumber){
		return _generateMean(sampleNumber,groupNumber);
	},
	
	/**
	*@method: [public] getMeanOfDataset()
	*@param: K 
	*@desc: gets the mean of the intially created dataset/sample.
	*@dependencies: generateTrail()
	*/	
	getMeanOfDataset:function(K){
		if(K===undefined)
			K=1;
		var _val=_dataset[K].values;
		var total=0;
		for(var i=0;i<_val.length;i++) {
			total += parseInt(_val[i]); 
		}
		total=total/_val.length;
		if(isNaN(total)){return false;}else{return total;}

	},
	
	/** STANDARD DEVIATION METHODS STARTS **/
	getStandardDev:function(groupNumber){
		var	groupNumber = groupNumber || 1 ;    // 1 is default value - meaning the first dataset
		//if the _sampleStandardDev already has the values
		if(_sample.StandardDev[groupNumber] === undefined){
			_sample.StandardDev[groupNumber]=[];
		}
		var _temp=_sample.StandardDev[groupNumber];
		if(_temp.length==bootstrapGroupValues.length)
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

	getStandardDevOf:function(sampleNumber,groupNumber){
		return _generateStandardDev(sampleNumber,groupNumber);
	},

	getStandardDevOfDataset:function(K){
		K=K || 1;
		var _val=_dataset[K].values;
		var _mean=this.getMeanOfDataset(K);
		var _squaredSum=null;
		for(var i=0;i<_val.length;i++)
			{
				_squaredSum+=_val[i]*_val[i];
			}
		_squaredSum=_squaredSum/_val.length;
		var _SD=Math.sqrt(_squaredSum-(_mean)*(_mean));
		console.log("SD of Dataset:"+_SD);
		return _SD;
	},
	/** STANDARD DEVIATION METHODS ENDS **/

	/** COUNT METHODS STARTS **/
	getCount:function(groupNumber){
		groupNumber = groupNumber || 1;
		var _test=[];
		for(var j=0;j<_count;j++)
			{
			_test[j]=_generateCount(j,groupNumber);
			//console.log(_sample.Count[j]);
			}
			_sample.Count[groupNumber]=_test;
			return _sample.Count[groupNumber];
	},
	
	getCountOf:function(sampleNumber){
		return _generateCount(sampleNumber);
	},

	getCountOfDataset:function(K){
		K=K || 1;
		var _val=_dataset[K].values;
		var total=0;
		for(var i=0;i<_val.length;i++) 
			{ total += parseInt(_val[i]); }
		return total;
	},
	/** COUNT METHODS ENDS **/

	/**
	*@method:getPercentile ()
	*@param: pvalue - what is the percentile value that is to be calculated.
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

	getPercentileOf:function(sampleNumber,pvalue){
		var temp=bootstrapSampleValues[sampleNumber].sort(function(a,b){return a-b});
		var position=Math.floor(bootstrapSampleValues[sampleNumber].length*(pvalue/100));
		//console.log(pvalue);
		//console.log(bootstrapSampleValues[sampleNumber]+"---"+position);
		return temp[position];
	},

	getPercentileOfDataset:function(pvalue){
		var temp=_datasetValues.sort(function(a,b){return a-b});
		var position=Math.floor(_datasetValues.length*(pvalue/100));
		return temp[position];
	},

	/**
	*@method: [public] getDataset()
	*@desc:  getter funtion for dataSet variable. 
	*@param: K - dataset number , field - what value to return i.e values or keys or name
	*@dependencies: generateTrail()
	*/
	getDataset:function(K,field){
		if(K===undefined)
				K=1;
		if(field ===undefined)
			field='keys';
		if(_dataset[K]===undefined)
			return false;
		else
			return _dataset[K][field];
	},
	/**
	*@method: setDataset
	*@param: input 
	*@description: sets the data from the input sheet into the app model
	*/
	setDataset:function(input){
		//check for input values...if its empty...then throw error
		console.log('setDataSet() invoked!');
		console.log('Input Data :'+input.keys+' Input Type :'+input.type+' Input Range :'+input.range+' Input Values :'+input.values);
	//input.processed is true incase of a simulation -> data mode switch
		if(input.processed)
			{
				for(var i=0;i<input.keys.length;i++)
				{
					_dataset[i+1]={
						values:input.values[i],
						keys:input.keys[i],
						name:null,
						index:i
					};
				}
				//^^^^^ _datasetKeys and _datasetValues are decrepted ^^^^^^^  OBSOLETE
				_datasetKeys=input.keys[0];
				_datasetValues=input.values[0];
				console.log('Simulation data is loaded now.');
				return false;
			}
		else if(input.type=='url')
			{
			//both _datasetValues and _datasetKeys will have the same values
				_datasetValues=input.keys.split(",");
				console.log('Simulation data is loaded now.');
				return false;
			}
		else if(input.type=='getData' || input.type=='getSelected')
			{
			_datasetValues=[];			//emptying the array
			_datasetKeys=[];
			//iterate through rows
			/*for(var i=input.range[0];i<=input.range[2];i++)
				{
					for(var j=input.range[1];j<=input.range[3];j++)
						{
						if (input.data[i][j] != '')
							{         
							_datasetValues.push(input.data[i][j]);
							}
						}
				}
			*/
		
			// for (var i = 0; i < input.keys.length; i++)
			// 	{
			// 	for(var j = 0; j < input.keys[i].length; j++)
			// 		{
			// 			if (input.keys[i][j] != '')
			// 			{         
			// 				_datasetValues.push(input.data[i][j]);
							
			// 			}
			// 		}
			// 	}

			console.log(_datasetValues.length);
			if(_datasetValues.length==0)
				{
					_datasetValues=0;
					console.log("returning false");
					return false;
				}
			else{
					_datasetKeys=_datasetValues;
					console.log("returning true");
					console.log('Data is loaded now. Data :' + _datasetValues);
					return true;
				}

		}
	},
    /**
	*@method: [public] getSample()
	*@desc:  getter and setter funtion for dataSet variable. 
	*@dependencies: generateTrail()
	*/
	getSample:function(index){
		return bootstrapSamples[index];
	},
	
	getSamples:function(){
		return bootstrapSamples;
	},
	/**
	*@method: [public] getSampleValues()
	*@desc:  getter and setter funtion for dataSet variable. 
	*@dependencies: generateTrail()
	*/
	getSampleValue:function(index){
		return bootstrapSampleValues[index];
	},
	
	getSampleValues:function(){
		return bootstrapSampleValues;
	},
	/*  getter and setter for variable '_stopCount'  */
	setStopCount:function(y){
		//alert(y);
		_stopCount=y;
	},
	getStopCount:function(){
		return _stopCount;
	},
	
	/*  getter and setter for variable '_n'  */
	setN:function(z){
		_n=z;
	},
	getN:function(){
		return _n;
	},
	/*  getter and setter for variable '_count'  */
	setRSampleCount:function(v){
		_count=v;
		return true;
	},
	getRSampleCount:function(){
		return _count;
	},
	reset:function(){
		//dataset values deleted
		_datasetKeys=[];
		_datasetValues=[];
		_dataset={};
		this.resetVariables();
		//random samples deleted
		//this.bootstrapSamples=[];
		this.bootstrapSampleValues=[];
		//setting the global random sample count to 0
		this.setRSampleCount(0);
		//Triggering view reset
		view.reset();
	},
	resetVariables:function(){
		_sample.Mean=[];
		_sample.StandardDev=[];
		_sample.Percentile=[];
		_sample.Count=[];
	},
	getK:function(){
		if(socr.exp.current)
			{
				return socr.exp.current.getK();
			}
		else
			return 0;
	}
	
}//return
}
