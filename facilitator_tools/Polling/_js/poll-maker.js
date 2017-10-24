// JavaScript Document


var selectedVals = [];
var appData;

var orgUnitId = parent.orgUnitId;
var orgCoursePath = parent.coursePath;
var myRole;

var url = window.location.href;
var contentURL = window.top.location.href;
var contentParts = contentURL.split("/");
if (contentURL.indexOf("/m/") > -1) {
  orgUnitId = contentParts[7];
  topicId = contentParts[10];
} else {
  orgUnitId = contentParts[6];
  topicId = contentParts[8];
}
if (orgUnitId == undefined) {
  orgUnitId = parent.ouID;
}


var refreshnum = 1;
var deletenum = 1;
var usersFound = [];


CSVal.routes.get_users = '/d2l/api/lp/' + APIVersion + '/enrollments/orgUnits/ORGID/users/';
CSVal.routes.get_user_details = '/d2l/api/lp/' + APIVersion + '/enrollments/users/USERID/orgUnits/' + orgUnitId;
CSVal.routes.get_demographics_all = '/d2l/api/lp/' + APIVersion + '/demographics/orgUnits/' + orgUnitId + '/users/';
CSVal.routes.get_demographics_user = '/d2l/api/lp/' + APIVersion + '/demographics/users/';
CSVal.routes.put_demographics = '/d2l/api/lp/' + APIVersion + '/demographics/users/';
CSVal.routes.get_demographics_fields = '/d2l/api/lp/' + APIVersion + '/demographics/fields/';
CSVal.routes.get_demographics_datatypes = '/d2l/api/lp/' + APIVersion + '/demographics/dataTypes/';
CSVal.routes.delete_user_entries = '/d2l/api/lp/' + APIVersion + '/demographics/users/USERID';


CSVal.demographics = CSVal.demographics || {};
CSVal.demographics.get_all = CSVal.demographics.get_all || {"Items":[],"PagingInfo":{}};
CSVal.demographics.get_user = CSVal.demographics.get_user || {};
CSVal.demographics.put_demographics = CSVal.demographics.put_demographics || {};
CSVal.demographics.fields = CSVal.demographics.fields || {};
CSVal.demographics.datatypes = CSVal.demographics.datatypes || {};

var numparticipantstotal = 0;
var numparticipantsloaded = 0;

var users = [];
var datavals = [];
var labels = [];
var colors = [];

var getuserdone = false;
var getdatadone = false;

var hasResponded = false;
var userIndex = -1;
var entryIndex = -1;
var valueIndex = -1;
var valueJSON = {};
var myVal = {};

CSVal.devMode = false;

function pollInit() {
	if(getuserdone && getdatadone) {
		$.ajax({
			url: "data/"+datafilename,
			dataType: "json",
			success: function (data) {
				appData = data;
				
				if(appData.Roles.ModeratorView.indexOf(myRole) > -1) {
					buildResultsView();
					
					$('.nav-tabs a[href="#participantview"]').parent().remove();
					$('.nav-tabs a[href="#resultsview"]').tab('show');
				}

				if(appData.Roles.ParticipantView.indexOf(myRole) > -1) {
					for(var i=0; i<CSVal.demographics.get_all.Items.length; i++) {
						if(parseInt(CSVal.user.ID) == CSVal.demographics.get_all.Items[i].UserId) {
							userIndex = i;
							for(var e=0; e<CSVal.demographics.get_all.Items[i].EntryValues.length; e++) {
								if(CSVal.demographics.get_all.Items[i].EntryValues[e].FieldId == appData.FieldID) {
									entryIndex = e;
									for(var v=0; v<CSVal.demographics.get_all.Items[i].EntryValues[e].Values.length; v++) {

										var entryValue = JSON.parse(CSVal.demographics.get_all.Items[i].EntryValues[e].Values[v]);

										if(entryValue.pollID == appData.PollID) {
											valueIndex = v;
											valueJSON = entryValue;
											selectedVals = entryValue.scaleID;
											hasResponded = true;
										}
									}
								}
							}
						}	
					}
					
					if(hasResponded) {
						buildResultsView();
						buildParticipantView();
					}
					else {
						buildParticipantView();
					}		
				}
			}
		});
	}
}


function buildResultsView() {
	
	
	$("#participantview #widgetdetails").html("");
	$("#participantview .ratingscale").html("");

	$("#participantview #widgetdetails").append("<div class='polltitle'>"+appData.Title+"</div>");
	$("#participantview #widgetdetails").append("<p>"+appData.Description+"</p>");	

	datavals = [];
	labels = [];
	colors = [];
	usersFound = [];
	
	$('.chart').html('<canvas id="chart" width="400" height="300"></canvas>');
	
	//$("#resultsview").css("display","block");
	$("#resultsview .polltitle").text(appData.Title);
	$("#resultsview #polldescription").text(appData.Description);
	
	for(l=0; l<appData.Scale.length; l++) {
		labels.push(appData.Scale[l].Descriptor);	
		colors.push(appData.Scale[l].Color);
		datavals.push(0);
	}

	for(var i=0; i<CSVal.demographics.get_all.Items.length; i++) {
		if(usersFound.indexOf(CSVal.demographics.get_all.Items[i].UserId) == -1) {
			for(var e=0; e<CSVal.demographics.get_all.Items[i].EntryValues.length; e++) {
				if(CSVal.demographics.get_all.Items[i].EntryValues[e].FieldId == appData.FieldID) {
					for(var v=0; v<CSVal.demographics.get_all.Items[i].EntryValues[e].Values.length; v++) {

						var entryValue = JSON.parse(CSVal.demographics.get_all.Items[i].EntryValues[e].Values[v]);

						if(entryValue.pollID == appData.PollID) {
							usersFound.push(CSVal.demographics.get_all.Items[i].UserId);
							for(var a=0; a<appData.Scale.length; a++) {
								//if(appData.Scale[a].Id == entryValue.scaleID) {
								if(entryValue.scaleID.indexOf(appData.Scale[a].Id) > -1) {
									datavals[a] += 1;
								}
							}
						}
						
					}
				}
			}
		}
	}
	
	var datafound = false;
	for(var d=0; d<datavals.length; d++) {
		if(datavals[d] > 0) {
			datafound = true;
			break;
		}
	}

	if(datafound) {
		var data = {
			labels: labels,
			datasets: [
				{
					data: datavals,
					backgroundColor: colors,
				}]
		};

		var options = {
			animation:{
				animateScale:true,
			},
			legend:{
				position: "right",
				onClick:function(event, legendItem) {}
			}
		};

		var ctx = document.getElementById("chart");
		var myPieChart = new Chart(ctx,{
			type: appData.GraphType,
			data: data,
			options: options
		});
	}
	else {
		$(".chart").append("<p>There are no results to display.</p>")
	}

	
	//$('.nav-tabs a[href="#resultsview"]').tab('show');
	
	
}


function buildParticipantView() {


	
	$("#participantview #widgetdetails").html("");
	$("#participantview .ratingscale").html("");

	$("#participantview #widgetdetails").append("<div class='polltitle'>"+appData.Title+"</div>");
	$("#participantview #widgetdetails").append("<p>"+appData.Description+"</p>");

	var ratingselected = false;
	for(s=0; s<appData.Scale.length; s++) {
		if((userIndex > -1) && (entryIndex > -1) && (valueIndex > -1)) {

			//if(appData.Scale[s].Id == valueJSON.scaleID) {
			if(valueJSON.scaleID.indexOf(appData.Scale[s].Id) > -1) {
				var newbutton = "<li><a class='ratingoption' data-id='"+appData.Scale[s].Id+"' href='javascript:setValue("+appData.Scale[s].Id+")' title='"+appData.Scale[s].Descriptor+"'><img src='data/images/"+appData.Scale[s].ImageFile+"'><p>"+appData.Scale[s].Descriptor+"</p></a></li>";
				ratingselected = true;
				$("#ratingselected").html("<img src='data/images/"+appData.Scale[s].ImageFile+"'>");

			}
			else {
				var newbutton = "<li><a class='ratingoption' data-id='"+appData.Scale[s].Id+"' href='javascript:setValue("+appData.Scale[s].Id+")' title='"+appData.Scale[s].Descriptor+"'><img class='desaturate' src='data/images/"+appData.Scale[s].ImageFile+"'><p>"+appData.Scale[s].Descriptor+"</p></a></li>";
			}

		}
		else {
			var newbutton = "<li><a class='ratingoption' data-id='"+appData.Scale[s].Id+"' href='javascript:setValue("+appData.Scale[s].Id+")' title='"+appData.Scale[s].Descriptor+"'><img class='desaturate' src='data/images/"+appData.Scale[s].ImageFile+"'><p>"+appData.Scale[s].Descriptor+"</p></a></li>";
		}


		$("#participantview #"+appData.Scale[s].Container).append(newbutton);
	}

	if(appData.AccentImage !== "" && appData.AccentImage !== null && appData.AccentImage !== "none") {
		$("#ratingaccent").html("<img src='data/images/"+appData.AccentImage+"'>");
	}
	else {
		$("#ratingaccent").parent().remove();
		$(".ratingscale").parent().removeClass("col-sm-6");
		$(".ratingscale").parent().addClass("col-sm-12");
	}
	

	//$("#participantview").css("display","block");
}


function setValue(valID) {
	
	var updatedata = false;
	
	if(appData.PollType == "Single") {
		selectedVals[0] = valID;
		updatedata = true;
	}
	else if(appData.PollType == "Multi") {
		if(selectedVals.indexOf(valID) == -1) {
			if(selectedVals.length < appData.MaxSelections) {
				selectedVals.push(valID);	
				updatedata = true;
			}
			else {
				console.log("already selected max");
			}
		}
		else {
			selectedVals.splice(selectedVals.indexOf(valID),1);
			updatedata = true;
		}
	}
	


	if(updatedata) {
		myVal = {
			"pollID": appData.PollID,
			"scaleID": selectedVals	
		};

		updateData();				

		$("#participantview #ratingscale li a.ratingoption img").addClass("desaturate");
		$("#participantview #ratingscale li a.ratingoption").each(function() {	
			if(selectedVals.indexOf($(this).attr("data-id")) > -1) {
				$(this).find("img").removeClass("desaturate");
			}
		});	
	}


	
}


function updateData() {

	var newEntry = {
	  FieldId: appData.FieldID,
	  Name: appData.FieldName,
	  Values: []
	};
	
	pubsubz.subscribe('csval/get_demographics_user/'+CSVal.user.ID+"-"+refreshnum, function(result) {	
		
		var newDemoData;
		
		if(result.newUser) {
			
			newEntry.Values = [JSON.stringify(myVal)];
			newDemoData = {
				"EntryValues":[newEntry],
				"UserId":CSVal.user.ID
			};
		}
		
		else {
			newDemoData = result;
			var fieldfound = false;
			var fieldindex = -1;
			var valuefound = false;
			var valueindex = -1;
			
			for(var i=0; i<newDemoData.EntryValues.length; i++) {

				if(newDemoData.EntryValues[i].FieldId == appData.FieldID) {
					fieldfound = true;
					fieldindex = i;
					
					for(var j=0; j<newDemoData.EntryValues[i].Values.length; j++) {
						var tempval = JSON.parse(newDemoData.EntryValues[i].Values[j]);
						
						if(tempval.pollID == appData.PollID) {
							valuefound = true;
							valueindex = j;
						}
					}
				}
			}
			
			if(!fieldfound) {
				newEntry.Values = [JSON.stringify(myVal)];
				newDemoData.EntryValues.push(newEntry);
			}
			else {
				if(!valuefound) {
					var tempvalues = newDemoData.EntryValues[fieldindex].Values;
					tempvalues.push(JSON.stringify(myVal));
					
					newEntry.Values = tempvalues;
					newDemoData.EntryValues[fieldindex] = newEntry;
				}
				else {
					var tempvalues = newDemoData.EntryValues[fieldindex].Values;
					tempvalues[valueindex] = JSON.stringify(myVal);
					
					newEntry.Values = tempvalues;
					newDemoData.EntryValues[fieldindex] = newEntry;
				}
				
			}
			
		}
		
		CSVal.put_demographics(CSVal.user.ID, newDemoData);						

	});

	CSVal.get_demographics_user(CSVal.user.ID);
}


function clearInput() {
	$("#exampleTextarea").val("");
	doneTyping();	
}


function showSaved() {
	$("#updatetext").fadeIn(500);	
	setTimeout(function(){
		$("#updatetext").fadeOut(1500);	
	},1500);
	
}


function isValidEmailAddress(emailAddress) {
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return pattern.test(emailAddress);
};


function frameHeight() {
	//console.log($("body").height());
}



function graphInit() {
	data = {
		users:users,
		labels:labels
	}		
	
	ready = buildData();
	
	if(ready){
		init();
	}else{
		//issue
	}		

		//console.log(users);
}






/*
	CSVal.get_users
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Add results to CSVal.user object
*/
CSVal.get_users = function (bookmark) {
	var route = CSVal.routes.get_users.replace("ORGID", CSVal.context.ouID);
	if (bookmark !== undefined){
		route += "?bookmark=" + bookmark;
	}				
	valence_req
		.get(route)
		.use(valence_auth)
		.end(function (err, response) {
			if (err != null) {
				//console.log(response);
				//errorPrompt(err, CSVal.routes.get_users, "alert");
				return false;
			}
			else {
				if (response.body.PagingInfo.HasMoreItems == true) {
					if(bookmark == undefined) {
						CSVal.user.classlist = response.body;
					}
					else {
						CSVal.user.classlist.Items = CSVal.user.classlist.Items.concat(response.body.Items);
					}
					CSVal.get_users(roleId, response.body.PagingInfo.Bookmark);
				}
				else {
					if(bookmark == undefined) {
						CSVal.user.classlist = response.body;
					}
					else {
						CSVal.user.classlist.Items = CSVal.user.classlist.Items.concat(response.body.Items);
					}
					pubsubz.publish('csval/get_users');
					if (CSVal.devMode == true) {}
				}
				if (CSVal.devMode == true) {
					//console.log('CSVal.users:');
					//console.log(CSVal.user);
				}
			}
		});

};


CSVal.get_user_details = function(uID) {
   var route = CSVal.routes.get_user_details.replace("USERID",uID);
   valence_req
      .get(route)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
			 if(response.status == 404) {
				 CSVal.user.RoleId = 101;
				 pubsubz.publish('csval/get_user_details/'+uID, response.body);
			 }
         } else {
			 CSVal.user.RoleId = response.body.RoleId;
			 pubsubz.publish('csval/get_user_details/'+uID, response.body);
         }
         if (CSVal.devMode == true) {
            console.log(CSVal.user.RoleId);
         }
      });
};



/*
	CSVal.get_instructorProfile
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- If capturing myProfile data then add to CSVal.user object
	- Return response body to subscribers
*/
CSVal.get_participantProfile = function (Profile) {
	valence_req
		.get(CSVal.routes.get_userProfile + Profile.ProfileIdentifier)
		.use(valence_auth)
		.end(function (err, response) {
			if (err != null) {
				errorPrompt(err, CSVal.routes.get_userProfile, "alert");
				CSVal.t_profile.lock = false;
				return false;
			}
			
			var participantObj = {
				"name":	Profile.DisplayName,
				"email":	Profile.EmailAddress,
				"id": Profile.Identifier
			}
			
			var hasArray = false;
			var dataIndex = -1;
			
			var userSaveJSON;
			var userSaveData;
			
			userJSON = JSON.parse(JSON.stringify(response.body));
			try {
				if (userJSON.FutureGoals !== null) {
					userSaveData = JSON.parse(userJSON.FutureGoals);
				}
			} catch (e) {
				console.log("error?");
			}

			if (typeof userSaveData === 'object') {
				if (userSaveData.careValue !== undefined) {
					if (userSaveData.careValue.constructor == Array) {
						hasArray = true;
						for (i = 0; i < userSaveData.careValue.length; i++) {
							if (orgUnitId == userSaveData.careValue[i].ouNUM) {
								dataIndex = i;
							} 
						}
					}
				}
			}
		
			if (dataIndex > -1) {			
				participantObj.rating = userSaveData.careValue[dataIndex].scaleID;
				participantObj.reason = userSaveData.careValue[dataIndex].myReason;
				participantObj.date = userSaveData.careValue[dataIndex].timeStamp;
				participantObj.help = userSaveData.careValue[dataIndex].requestHelp;
			}
			else {
				participantObj.rating = null;
				participantObj.reason = "";
				participantObj.date = null;
				participantObj.help = false;
			}
			
			//console.log(userSaveData);
			
			users.push(participantObj);
			numparticipantsloaded += 1;
			
			if(numparticipantsloaded == numparticipantstotal) {
				graphInit();
				frameHeight();
			}
			
		});
};


/*
	CSVal.post_demographics_fields
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/
CSVal.post_demographics_fields = function(fieldData) {
	console.log(fieldData);
   valence_req
      .post(CSVal.routes.get_demographics_fields)
	  .send(fieldData)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            //errorPrompt(err, CSVal.routes.get_demographics_fields, "alert");
            CSVal.t_profile.lock = false;
         } else {
            pubsubz.publish('csval/post_demographics_fields', response.body);
         }
         if (CSVal.devMode == true) {
            console.log(response.body);
         }
      });
};

/*
	CSVal.get_demographics_fields
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body
*/
CSVal.get_demographics_fields = function() {
   valence_req
      .get(CSVal.routes.get_demographics_fields)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            //errorPrompt(err, CSVal.routes.get_demographics_fields, "alert");
            CSVal.t_profile.lock = false;
         } else {
            CSVal.demographics.fields = response.body;
            pubsubz.publish('csval/get_demographics_fields', response.body);
         }
         if (CSVal.devMode == true) {
            console.log(CSVal.demographics.fields);
         }
      });
};

/*
	CSVal.get_demographics_datatypes
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body
*/
CSVal.get_demographics_datatypes = function(bookmark) {
   valence_req
      .get(CSVal.routes.get_demographics_datatypes)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            //errorPrompt(err, CSVal.routes.get_demographics_datatypes, "alert");
            CSVal.t_profile.lock = false;
         } else {
            CSVal.demographics.datatypes = response.body;
            pubsubz.publish('csval/get_demographics_datatypes', response.body);
         }
         if (CSVal.devMode == true) {
            console.log(CSVal.demographics.datatypes);
         }
      });
};

/*
	CSVal.get_demographics_all
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body to subscribers
*/
CSVal.get_demographics_all = function(bookmark, fieldId) {
   var route = CSVal.routes.get_demographics_all + '?bookmark=' + bookmark;

   if(fieldId > 0) {
	   route += "&fieldIds=" + fieldId;
   }
   valence_req
      .get(route)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            //errorPrompt(err, CSVal.routes.get_demographics_all, "alert");
            CSVal.t_profile.lock = false;
         } else {
            CSVal.demographics.get_all.Items = CSVal.demographics.get_all.Items.concat(response.body.Items);
			CSVal.demographics.get_all.PagingInfo = response.body.PagingInfo;
            pubsubz.publish('csval/get_demographics_all', response.body);
         }
         if (CSVal.devMode == true) {
            console.log(CSVal.demographics.get_all);
         }
      });
};


/*
	CSVal.get_demographics_user
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body to subscribers
*/
CSVal.get_demographics_user = function(userID) {
   var route = CSVal.routes.get_demographics_user + userID;
   valence_req
      .get(route)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            CSVal.t_profile.lock = false;
            if (response.statusCode === 404) {
               CSVal.demographics.get_user = { "newUser": true };
               pubsubz.publish('csval/get_demographics_user/'+userID+"-"+refreshnum, { "newUser": true });
			   refreshnum++;
            }
         } else {
            CSVal.demographics.get_user = response.body;
			pubsubz.publish('csval/get_demographics_user/'+userID+"-"+refreshnum, response.body);        
			refreshnum++;
         }
         if (CSVal.devMode == true) {
            console.log(CSVal.demographics.get_user);
         }
      });
};


/*
	CSVal.get_demographics_user
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body to subscribers
*/
CSVal.get_demographics_alluser = function(filter) {
   valence_req
      .get(CSVal.routes.get_demographics_user)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
			   console.log(err);
         } else {
               CSVal.demographics.get_alluser = response.body;
         }
	   
	     pubsubz.publish('csval/get_demographics_alluser');
	   
         if (CSVal.devMode == true) {
            console.log(CSVal.demographics.get_user);
         }
	   
      });
};



/*
	CSVal.put_demographics
	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	- Return response body to subscribers
*/
CSVal.put_demographics = function(UserID, demographicsData) {

  if (demographicsData == undefined) {
	 return false;
  }

   valence_req
      .put(CSVal.routes.put_demographics + UserID)
      .send(demographicsData)
      .use(valence_auth)
      .end(function(err, response) {
         if (err != null) {
            errorPrompt(err, CSVal.routes.put_demographics, "alert");
            return false;
         } else {
            CSVal.demographics.put_demographics = response.body;
			showSaved();
			CSVal.demographics.get_all = {"Items":[],"PagingInfo":{}};
			CSVal.get_demographics_all();
            pubsubz.publish('csval/put_demographics', response.body);
         }
      });
};


pubsubz.subscribe('csval/get_demographics_all', function() {
   var results = CSVal.demographics.get_all;
   if (CSVal.demographics.get_all.PagingInfo.HasMoreItems === true) {
      demographicAllIndex = CSVal.demographics.get_all.PagingInfo.Bookmark;
      CSVal.get_demographics_all(demographicAllIndex);
   } else {
      getdatadone = true;
	  pollInit();
	   
   }
});


pubsubz.subscribe('csval/get_whoami', function () {

	pubsubz.subscribe('csval/get_user_details/'+CSVal.user.ID, function () {
		myRole = CSVal.user.RoleId;
		getuserdone = true;
		pollInit();
	});

	CSVal.get_user_details(CSVal.user.ID);
	CSVal.get_demographics_all();
	
});

CSVal.init();