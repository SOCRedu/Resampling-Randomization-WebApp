/*
	DataStore which contains all the simulation data generated by the webapp.
	@fileName: appData.js
	@author: selvam1991@gmail.com
	
*/
socr.dataStore = function(){
	// helper toolkit.
	// to be installed in all objects created using createObject()
	_helper = function(type){
		var _data = {}

	return{
		getData: function(index){
			if(typeof _data[index] !== "undefined"){
				return _data[index]
			}
			else
				return _data
		},

		setData: function(data){
			//check whether data is clean
			if(typeof data === "object"){
				//appending the values to data
				// if certain key already exists, incoming data will overwrite it.
				if(!$.isEmptyObject(_data)){
					$.each(data,function(key,value){
						_data[key]=value;
					});
				}
				else{
					_data = data;
				}
				return this;
			}
			else{
				return false;
			}

		},
		
		order:function(type){
			//type = ascending or descending

		}
	}

	}

	return{
		createObject:function(name,data,type){
			/* "."delimited name */
			var name_list = $.normalize(name);
			var temp= this, newFlag = false;
			try{
				for(var i=0;i<name_list.length;i++){
					if(!temp.hasOwnProperty(name_list[i])){
						Object.defineProperty(temp,name_list[i],{value:{},
							writable: true,
							enumerable: true,
							configurable: true});
						// Set the new Object flag to true.
						newFlag=true;
					}
					temp = temp[name_list[i]]
				}
				//check if data exists.
				if(typeof data !== "undefined"){
					if(newFlag){
						var h= _helper();
						// Installing the helper functions to the newly created object.
						$.extend(temp,h);
					}
					// set the data provided with the function call.
					temp.setData(data);
				}
				return this;
			}
			catch(e){
				console.log(e.stack);
				PubSub.publish("Error",{description:"Error while creating dataStore object."})
			}
		},
		removeObject:function(obj){
			if(typeof this[obj] !== "undefined"){
				delete this[obj];
			}
			// delete all the data entries created by the app
			if(obj === "all"){
				for(prop in this){
					if(prop !== "createObject" && prop !== "removeObject"){
						delete this[prop];
					}
				}
			}
			return this;
		}
	}	

};