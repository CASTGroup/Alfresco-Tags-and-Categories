var activityLog = [];
var categoryAdded = [];
var catArray = [];

function main(){
	var ok ='OK';

	if(json.has("noderef")){
		// Get the PUTed JSON data
		var noderef = json.get("noderef");
			
		var nodeToUpdate = search.findNode("workspace://SpacesStore/"+noderef);
		if(nodeToUpdate == null){//controllo se il noderef associato al documento esiste
			model.ok ='Errore';
			log("Documento non trovato " + noderef);
			model.categories=categoryAdded;
			model.errorLog = activityLog;
		}
		else{
			if (json.has("categories") && json.get("categories").length()){//se sono presenti categorie aggiorno quelle del documento
				var categories = json.get("categories");
				for (var index = 0; index < categories.length(); index++){
					 var cat = JSON.parse(categories.get(index)); 
					 var catname = cat.id;
					 var category = search.findNode("workspace://SpacesStore/"+catname);//cerco i nodi associati alle categorie (per noderef passati)
					 if (category != null) {
						catArray.push(category.nodeRef);
						categoryAdded.push(cat.id);
					}
					else{
						ok='Errore';
						log("Categoria NON trovata " + catname);
					}		
				}
				if(ok=='OK'){//solo se ok 
					nodeToUpdate.addAspect("cm:generalclassifiable");
					nodeToUpdate.properties["cm:categories"] = catArray;
					nodeToUpdate.save();
					model.categories=categoryAdded;
				}
				else{
					categoryAdded = [];
					model.categories=categoryAdded;
				}	
		   }
		   else{ //se non ci sono categorie devo eliminare quelle eventualmente presenti sul documento
				nodeToUpdate.properties["cm:categories"] = catArray;
				nodeToUpdate.save();
				model.categories=categoryAdded;
		   }	   
			model.ok = ok;
			model.errorLog = activityLog;
		}
	}
	else{
		model.ok ='Errore';
		log("Noderef non passato");
		model.categories=categoryAdded;
		model.errorLog = activityLog;
	}	
}
main();

function log(msg){
	activityLog.push(msg);
}	
