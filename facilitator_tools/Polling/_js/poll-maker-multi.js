// JavaScript Document



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

var interactiondata = [];

var hasResponded = false;
var userIndex = -1;
var entryIndex = -1;
var valueIndex = -1;
var valueJSON = {};
var myVal = {};
var selectedVals = [];

CSVal.devMode = false;

function pollInit() {
	if(getuserdone && getdatadone) {
		$.ajax({
			url: "data/"+datafilename,
			dataType: "json",
			success: function (data) {
				appData = data;
				interactiondata = [];
				
				if(appData.Roles.ModeratorView.indexOf(myRole) > -1) {
					console.log(appData);
					for(var p=0; p<appData.Polls.length; p++) {
												
						var interactionObj = {
							"hasResponded":false,
							"userIndex":-1,
							"entryIndex":-1,
							"valueIndex":-1,
							"valueJSON":{},
							"myVal":{},
							"selectedVals":[],
							"users":[],
							"usersFound":[],
							"datavals":[],
							"labels":[],
							"colors":[]							
						};						
						
						interactiondata.push(interactionObj);
						console.log(interactiondata);
						var cindex = p;
						buildResultsView(cindex);
						
						var pollposition = $("#"+appData.Polls[p].PollContainer).position().top + 100;
						$("#"+appData.Polls[p].PollContainer+" .modal-dialog").css("margin-top",pollposition+"px");							
						
					}

				}
				
				if(appData.Roles.ParticipantView.indexOf(myRole) > -1) {
					for(var p=0; p<appData.Polls.length; p++) {				
						
						var interactionObj = {
							"hasResponded":false,
							"userIndex":-1,
							"entryIndex":-1,
							"valueIndex":-1,
							"valueJSON":{},
							"myVal":{},
							"selectedVals":[],
							"users":[],
							"usersFound":[],
							"datavals":[],
							"labels":[],
							"colors":[]							
						};
						
						for(var i=0; i<CSVal.demographics.get_all.Items.length; i++) {
							if(parseInt(CSVal.user.ID) == CSVal.demographics.get_all.Items[i].UserId) {
								interactionObj.userIndex = i;
								
								for(var e=0; e<CSVal.demographics.get_all.Items[i].EntryValues.length; e++) {
									if(CSVal.demographics.get_all.Items[i].EntryValues[e].FieldId == appData.FieldID) {
										interactionObj.entryIndex = e;										
										
										for(var v=0; v<CSVal.demographics.get_all.Items[i].EntryValues[e].Values.length; v++) {

											var entryValue = JSON.parse(CSVal.demographics.get_all.Items[i].EntryValues[e].Values[v]);

											if(entryValue.pollID == appData.Polls[p].PollID) {
												
												interactionObj.valueIndex = v;
												interactionObj.valueJSON = entryValue;
												interactionObj.selectedVals = entryValue.scaleID;
												interactionObj.hasResponded = true;
											}
										}
									}
								}
							}	
						}
						
						interactiondata.push(interactionObj);

						var cindex = p
						if(interactionObj.hasResponded) {
							buildResultsView(cindex);
							buildParticipantView(cindex);
						}
						else {
							buildParticipantView(cindex);
						}		
						
						var pollposition = $("#"+appData.Polls[p].PollContainer).position().top + 100;
						$("#"+appData.Polls[p].PollContainer+" .modal-dialog").css("margin-top",pollposition+"px");								
					}						
				}
			}
		});
		
	$('.pollcontainer button').unbind('click');			
		
	$('.pollcontainer button').bind('click',function() {
		
		if($(this)[0].hasAttribute("data-pollcontainer")) {
			
			var pollid = $(this).attr("data-pollcontainer");
			var mheight = $("#"+pollid+ " .modal-dialog").height();
			
			var offset = $("#"+pollid).offset();
			console.log(offset);
			setTimeout(function(){
				console.log($("#"+pollid).offset());
			},2000);
			
			$("#"+pollid+ " .modal-dialog").css("margin-top", offset.top+"px");
		}
	});
		
	}
}


function buildResultsView(p) {
	
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").html("");
	$("#"+appData.Polls[p].PollContainer+" .participantview .ratingscale").html("");
	
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").append("<div class='polltitle'>"+appData.Polls[p].Title+"</div>");
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").append("<p>"+appData.Polls[p].Description+"</p>");	
	
	
	interactiondata[p].datavals = [];
	interactiondata[p].labels = [];
	interactiondata[p].colors = [];
	interactiondata[p].usersFound = [];
	
	$('#'+appData.Polls[p].PollContainer+' .chart').html('<canvas id="chart'+(p+1)+'" width="400" height="300"></canvas>');
	
	//$(".resultsview").css("display","block");
	$("#"+appData.Polls[p].PollContainer+" .resultsview .polltitle").html(appData.Polls[p].Title);
	//$("#"+appData.Polls[p].PollContainer+" .resultsview .polldescription").html(appData.Polls[p].Description);
	$("#"+appData.Polls[p].PollContainer+" .resultsview .polldescription").html("");
	if(interactiondata[p].hasResponded) {
		for(var s=0; s<appData.Polls[p].Scale.length; s++) {
			if(appData.Polls[p].Scale[s].Id == interactiondata[p].valueJSON.scaleID[0]) {
				if(appData.Polls[p].Scale[s].Feedback !== undefined) {
					$("#"+appData.Polls[p].PollContainer+" .resultsview .polldescription").append("<p><strong>Based on your response:</strong> "+appData.Polls[p].Scale[s].Feedback+"</p>");
				}
				
			}
		}
	}	
	
	
	for(l=0; l<appData.Polls[p].Scale.length; l++) {
		
		var shortdesc;
		
		if(appData.Polls[p].Scale[l].ShortDesc !== undefined && appData.Polls[p].Scale[l].ShortDesc !== "" && appData.Polls[p].Scale[l].ShortDesc !== "none") {
			shortdesc = appData.Polls[p].Scale[l].ShortDesc;
		}
		else {
			shortdesc = appData.Polls[p].Scale[l].Descriptor;
			if(shortdesc.length > 40) {
				shortdesc = shortdesc.slice(0,40)+"...";
			}
		}

		interactiondata[p].labels.push(shortdesc);	
		interactiondata[p].colors.push(appData.Polls[p].Scale[l].Color);
		interactiondata[p].datavals.push(0);
	}

	for(var i=0; i<CSVal.demographics.get_all.Items.length; i++) {
		if(interactiondata[p].usersFound.indexOf(CSVal.demographics.get_all.Items[i].UserId) == -1) {
			for(var e=0; e<CSVal.demographics.get_all.Items[i].EntryValues.length; e++) {
				if(CSVal.demographics.get_all.Items[i].EntryValues[e].FieldId == appData.FieldID) {
					for(var v=0; v<CSVal.demographics.get_all.Items[i].EntryValues[e].Values.length; v++) {

						var entryValue = JSON.parse(CSVal.demographics.get_all.Items[i].EntryValues[e].Values[v]);

						if(entryValue.pollID == appData.Polls[p].PollID) {
							interactiondata[p].usersFound.push(CSVal.demographics.get_all.Items[i].UserId);
							for(var a=0; a<appData.Polls[p].Scale.length; a++) {
								//if(appData.Scale[a].Id == entryValue.scaleID) {
								if(entryValue.scaleID.indexOf(appData.Polls[p].Scale[a].Id) > -1) {
									interactiondata[p].datavals[a] += 1;
								}
							}
						}
					}
				}
			}
		}
	}
	
	var datafound = false;
	for(var d=0; d<interactiondata[p].datavals.length; d++) {
		if(interactiondata[p].datavals[d] > 0) {
			datafound = true;
			break;
		}
	}
	
	var totalresponses = 0;
	for(var r=0; r<interactiondata[p].datavals.length; r++) {
		totalresponses += interactiondata[p].datavals[r];
	}
	
	$("#"+appData.Polls[p].PollContainer+" .responsenum").text(totalresponses);
	$("#"+appData.Polls[p].PollContainer+" .totalresponses").css("display","block");
	
	if(datafound) {
		var data = {
			labels: interactiondata[p].labels,
			datasets: [
				{
					data: interactiondata[p].datavals,
					backgroundColor: interactiondata[p].colors,
				}]
		};

		var options = {
			animation:{
				animateScale:true,
			},
			legend:{
				//display: false,
				position: "bottom",
				onClick:function(event, legendItem) {}
			}
		};

		var ctx = document.getElementById("chart"+(p+1));
		var myPieChart = new Chart(ctx,{
			type: appData.Polls[p].GraphType,
			data: data,
			options: options
		});
	}
	else {
		$("#"+appData.Polls[p].PollContainer+" .chart").append("<p>There are no results to display.</p>");
	}

	if(appData.Polls[p].Feedback !== "none" && appData.Polls[p].Feedback !== "") {
		$("#"+appData.Polls[p].PollContainer+" .pollfeedback").html(appData.Polls[p].Feedback);
	}
	
	
}


function buildParticipantView(p) {
	
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").html("");
	$("#"+appData.Polls[p].PollContainer+" .participantview .ratingscale").html("");
	
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").append("<div class='polltitle'>"+appData.Polls[p].Title+"</div>");
	$("#"+appData.Polls[p].PollContainer+" .participantview .widgetdetails").append("<p>"+appData.Polls[p].Description+"</p>");
	
	var ratingselected = false;
	
	for(s=0; s<appData.Polls[p].Scale.length; s++) {
		if((interactiondata[p].userIndex > -1) && (interactiondata[p].entryIndex > -1) && (interactiondata[p].valueIndex > -1)) {

			//if(appData.Scale[s].Id == valueJSON.scaleID) {
			if(interactiondata[p].valueJSON.scaleID.indexOf(appData.Polls[p].Scale[s].Id) > -1) {
				var newbutton = "<li><a class='ratingoption userselected' data-id='"+appData.Polls[p].Scale[s].Id+"' href='javascript:setValue("+p+","+appData.Polls[p].Scale[s].Id+")' title='"+appData.Polls[p].Scale[s].Descriptor+"'><img src='data/images/"+appData.Polls[p].Scale[s].ImageFile+"'>"+appData.Polls[p].Scale[s].Descriptor+"</a></li>";
				ratingselected = true;
				//$("#"+appData.Polls[p].PollContainer+" .ratingselected").html("<img src='data/images/"+appData.Polls[p].Scale[s].ImageFile+"'>");

			}
			else {
				var newbutton = "<li><a class='ratingoption' data-id='"+appData.Polls[p].Scale[s].Id+"' href='javascript:setValue("+p+","+appData.Polls[p].Scale[s].Id+")' title='"+appData.Polls[p].Scale[s].Descriptor+"'><img class='desaturate' src='data/images/"+appData.Polls[p].Scale[s].ImageFile+"'>"+appData.Polls[p].Scale[s].Descriptor+"</a></li>";
			}

		}
		else {
			var newbutton = "<li><a class='ratingoption' data-id='"+appData.Polls[p].Scale[s].Id+"' href='javascript:setValue("+p+","+appData.Polls[p].Scale[s].Id+")' title='"+appData.Polls[p].Scale[s].Descriptor+"'><img class='desaturate' src='data/images/"+appData.Polls[p].Scale[s].ImageFile+"'>"+appData.Polls[p].Scale[s].Descriptor+"</a></li>";
		}


		$("#"+appData.Polls[p].PollContainer+" .participantview #"+appData.Polls[p].Scale[s].Container).append(newbutton);
	}


	

	//$(".participantview").css("display","block");
}


function setValue(p, valID) {
	
	var updatedata = false;
	
	if(appData.Polls[p].PollType == "Single") {
		interactiondata[p].selectedVals[0] = valID;
		updatedata = true;
	}
	else if(appData.Polls[p].PollType == "Multi") {
		if(interactiondata[p].selectedVals.indexOf(valID) == -1) {
			if(interactiondata[p].selectedVals.length < appData.Polls[p].MaxSelections) {
				interactiondata[p].selectedVals.push(valID);	
				updatedata = true;
			}
			else {
				console.log("already selected max");
			}
		}
		else {
			interactiondata[p].selectedVals.splice(selectedVals.indexOf(valID),1);
			updatedata = true;
		}
	}
	
	if(updatedata) {
		interactiondata[p].myVal = {
			"pollID": appData.Polls[p].PollID,
			"scaleID": interactiondata[p].selectedVals	
		};

		updateData(p);				

		$("#"+appData.Polls[p].PollContainer+" .participantview #ratingscale li a.ratingoption img").addClass("desaturate");
		$("#"+appData.Polls[p].PollContainer+" .participantview #ratingscale li a.ratingoption").each(function() {	
			console.log($(this));
			if(interactiondata[p].selectedVals.indexOf($(this).attr("data-id")) > -1) {
				$(this).find("img").removeClass("desaturate");
			}
		});	
	}


	
}


function updateData(p) {

	var newEntry = {
	  FieldId: appData.FieldID,
	  Name: appData.FieldName,
	  Values: []
	};
	
	pubsubz.subscribe('csval/get_demographics_user/'+CSVal.user.ID+"-"+refreshnum, function(result) {	

		var newDemoData;
		if(result.newUser) {
			
			newEntry.Values = [JSON.stringify(interactiondata[p].myVal)];
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
						
						if(tempval.pollID == appData.Polls[p].PollID) {
							valuefound = true;
							valueindex = j;
						}
					}
				}
			}
			
			if(!fieldfound) {
				newEntry.Values = [JSON.stringify(interactiondata[p].myVal)];
				newDemoData.EntryValues.push(newEntry);
			}
			else {
				if(!valuefound) {
					var tempvalues = newDemoData.EntryValues[fieldindex].Values;
					tempvalues.push(JSON.stringify(interactiondata[p].myVal));
					
					newEntry.Values = tempvalues;
					newDemoData.EntryValues[fieldindex] = newEntry;
				}
				else {
					var tempvalues = newDemoData.EntryValues[fieldindex].Values;
					tempvalues[valueindex] = JSON.stringify(interactiondata[p].myVal);
					
					newEntry.Values = tempvalues;
					newDemoData.EntryValues[fieldindex] = newEntry;
				}
				
			}
			
		}
		
		CSVal.put_demographics(CSVal.user.ID, newDemoData, p);						

	});

	CSVal.get_demographics_user(CSVal.user.ID);
}


function clearInput() {
	$("#exampleTextarea").val("");
	doneTyping();	
}


function showSaved(p) {
	$("#"+appData.Polls[p].PollContainer+" .updatetext").fadeIn(500);	
	setTimeout(function(){
		$("#"+appData.Polls[p].PollContainer+" .updatetext").fadeOut(1500);	
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
	if (bookmark !== undefined){
		route += "?bookmark=" + bookmark;
	}			
	var route = CSVal.routes.get_users.replace("ORGID", CSVal.context.ouID);
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
CSVal.put_demographics = function(UserID, demographicsData, p) {

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
			showSaved(p);
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