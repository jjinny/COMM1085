var VideoPlusApp = {
	AppData : null,
	sceneNum: 0,
	maxScenes : null,
	containerRef : null,
	mobileDevice : false,
	activeActivity: false,
	ti : 1,
	currentAttempts: 0,
	normalState: null,
	completeState: null,
	wrongState: null,
	restartButton: null,
	startButton: null,
	nextButton: null,
	bulletAdded: [],
	popStarted: [],
	popCompleted: [],
	vidCompleted: false,
	correctCheck: [],
	nextJumpTime: -1,
	branchReqs: []
}

var vid;
var player;
var ytlooper;

VideoPlusApp.setupApp = function(file) {
	questionFile = file;

	VideoPlusApp.containerRef = document.getElementById(location);
	VideoPlusApp.getAppData(appBuild);

}


VideoPlusApp.getAppData = function(callback) {
  var jqxhr = $.getJSON(questionFile, function(data) {
    VideoPlusApp.AppData = data;
    callback(VideoPlusApp.AppData);
  });

  // if the json data fails inform the users ang give some data to developers using the debug console.
  jqxhr.fail(function(e) {
    console.log("ERROR!!: failed to load data from specified file. Ensure file is at that location and that JSON data is vaild. (tip: use a vaildator like: http://jsonformatter.curiousconcept.com/ )");
    console.log(e);
  });	
}


function appBuild() {
	
	if(VideoPlusApp.AppData.Video.Type == "Source") {
		var newvid = document.createElement('video');
		newvid.className = "video";
		newvid.id = VideoPlusApp.AppData.Video.VideoID;
		newvid.width = VideoPlusApp.AppData.Video.Width;
		for(var s=0; s<VideoPlusApp.AppData.Video.SourceData.Sources.length; s++) {
			var newsrc = document.createElement('source');
			newsrc.type = "video/"+VideoPlusApp.AppData.Video.SourceData.Sources[s].Type;
			newsrc.src = VideoPlusApp.AppData.Video.SourceData.FolderPath+VideoPlusApp.AppData.Video.SourceData.Sources[s].Filename;	
			newvid.appendChild(newsrc);
		}
		newvid.ontimeupdate = function() {videoListener()};
		newvid.onended = function() { VideoPlusApp.vidCompleted = true};
		newvid.onloadeddata  = function() {
			appBuildLoad();
		};

		vid = newvid;
		$("#"+VideoPlusApp.AppData.Video.ContainID).append(vid);
	}
	else if(VideoPlusApp.AppData.Video.Type == "YouTube") {
		// This code loads the IFrame Player API code asynchronously.
		var tag = document.createElement("script");
		tag.src = "//www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName("script")[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		// This function creates an <iframe> (and YouTube player)
		// after the API code downloads.
		
		var ytcontrols = 0;
		if(VideoPlusApp.AppData.Video.Controls) {
			ytcontrols = 1;
		}

		window.onYouTubeIframeAPIReady = function() {

			player = new YT.Player(ytplayer, {
				"height": VideoPlusApp.AppData.Video.Height,
				"width": VideoPlusApp.AppData.Video.Width,
				"videoId": VideoPlusApp.AppData.Video.YouTubeData.videoId,
				"playerVars": {
					"rel": 0,
					"autoplay": 0,
					"controls": ytcontrols
				},
				"events": {
					"onReady": onPlayerReady,
					"onStateChange": onPlayerStateChange

				}
			});
		}

		// The API will call this function when the video player is ready.
		// This automatically starts the video playback when the player is loaded.
		function onPlayerReady(event) {
			appBuildLoad();
		}

		// The API calls this function when the player's state changes.
		function onPlayerStateChange(event) {
			var time;
			if (event.data == YT.PlayerState.PLAYING) {
					ytlooper = setInterval(function(){
					videoListener();
					//console.log(player.getCurrentTime());
				},500);
				time = player.getCurrentTime();
				//
			}
			else {
				clearInterval(ytlooper);
			}
		}
		
		function pauseVideo() {
			player.pauseVideo();
		}
		
	}
	
}


function appBuildLoad() {


	var vidwidth =  $("#"+VideoPlusApp.AppData.Video.ContainID).outerWidth();	
	
	if(VideoPlusApp.AppData.Video.PreviewImage.HasImage) {
		$("#vidpreview").css("min-height",VideoPlusApp.AppData.Video.Height+"px");
		$("#vidpreview").css("background-image","url(data/images/"+VideoPlusApp.AppData.Video.PreviewImage.FileName+")");

		$("#"+VideoPlusApp.AppData.Video.ContainID).append("<a href='javascript:previewStart()' class='playpause'></a>");	
	}
	else {
		if(VideoPlusApp.AppData.Video.Type == "YouTube") {
			$("#ytplayer").css("visibility","visible");
		}
	}
	
	if(VideoPlusApp.AppData.Video.Type == "Source") {
		if(VideoPlusApp.AppData.Video.Controls) {
			$("#"+VideoPlusApp.AppData.Video.VideoID).attr("controls","controls");
			$("#"+VideoPlusApp.AppData.Video.VideoID).bind("click", function () {
				var vid = $(this).get(0);
				if (vid.paused) {
				  vid.play();
				} else {
				  vid.pause();
				}
			});
		}
		else {
			if(!VideoPlusApp.AppData.Video.PreviewImage.HasImage) {
				$("#"+VideoPlusApp.AppData.Video.ContainID).append("<a href='javascript:startVid()' class='playpause'></a>");	
			}
		}

		vid.currentTime = VideoPlusApp.AppData.Video.StartTime;
	}
	else if(VideoPlusApp.AppData.Video.Type == "YouTube") {
		if(VideoPlusApp.AppData.Video.StartTime > 0) {
			player.seekTo(VideoPlusApp.AppData.Video.StartTime);
			player.playVideo();
			player.pauseVideo();
		}

	}
	
	
	for(i=0; i<VideoPlusApp.AppData.Popups.length; i++) {
		
		var VP_closeButton = document.createElement("button");
		VP_closeButton.id = "VP_continueButton";
		VP_closeButton.setAttribute("class", "VP_popUpButton");
		VP_closeButton.setAttribute("title", "Close the question");
		VP_closeButton.href = "#";
		VP_closeButton.setAttribute("onClick", 'popupClose('+i+')');		
		
		//label for the submit button
		var VP_closeLabel = document.createElement("span");
		VP_closeLabel.setAttribute("class", "VP_buttonLabel");
		VP_closeLabel.innerHTML = "Continue";
		
			//adds the submit button to the pop up
		VP_closeButton.appendChild(VP_closeLabel);		
		
		if(VideoPlusApp.AppData.Popups[i].Type == "Question") {
			popupNum = i;
		
			//loads and adds the question for the quiz to the pop up
			var VP_quizText = document.createElement("p");
			VP_quizText.id = "VP_quizText";
			VP_quizText.innerHTML = VideoPlusApp.AppData.Popups[i].Question.questionText;
			//VP_question.appendChild(VP_quizText);
			
			//loads and adds the fieldset for the quiz to the pop up
			var VP_fieldSet = document.createElement("fieldset");
			VP_fieldSet.id = "VP_fieldSet"+i;
			VP_fieldSet.innerHTML = "<legend>Answers:</legend>";
			//VP_question.appendChild(VP_fieldSet);
			
			//loads all of the answers for the quiz, builds the inputs for them, and adds them to the pop up
			for (var j = 0; j < VideoPlusApp.AppData.Popups[i].Question.answers.length; j++) {
				//checks to see which answer is correct, and saves it's index for later
				if (VideoPlusApp.AppData.Popups[i].Question.answers[j].correct == true) {
					correctAnswer = j;
				}
		
				var VP_answer = document.createElement("div");
				VP_answer.setAttribute("class", "VP_answer");
		
				var VP_input = document.createElement("input");
				VP_input.setAttribute("class", "VP_input");
				VP_input.setAttribute("type", "radio");
				VP_input.setAttribute("name", "qu"+i);
				VP_input.setAttribute("value", j);
				VP_input.id = "qu" + i+"-"+j;
		
				var VP_label = document.createElement("label");
				VP_label.setAttribute("for", "qu" + i+"-"+j);
				VP_label.setAttribute("class", "VP_label");
				VP_label.innerHTML = VideoPlusApp.AppData.Popups[i].Question.answers[j].answerText;
		
				VP_answer.appendChild(VP_input);
				VP_answer.appendChild(VP_label);
				VP_fieldSet.appendChild(VP_answer);
			}
	
		
			//builds the submit button for the pop up window (only gets built for assessment type pop ups)
			var VP_submitButton = document.createElement("button");
			VP_submitButton.id = "VP_submitButton";
			VP_submitButton.setAttribute("class", "VP_popUpButton");
			VP_submitButton.setAttribute("title", "Submits your answer");
			VP_submitButton.href = "#";
			VP_submitButton.setAttribute("onClick", 'EvaluateScore('+popupNum+')');			
		
			//label for the submit button
			var VP_submitLabel = document.createElement("span");
			VP_submitLabel.setAttribute("class", "VP_buttonLabel");
			VP_submitLabel.innerHTML = "Submit Answer";
		
			//adds the submit button to the pop up
			VP_submitButton.appendChild(VP_submitLabel);
			//$(VP_submitButton).prependTo(VP_bottomButtonSet);
			//VP_bottomButtonSet.appendChild(VP_submitButton);
			

			var newModal = '<div class="modal fade vpModal" id="vpModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="vpModalLabel"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><h4 class="modal-title" id="vpModalLabel">'+VideoPlusApp.AppData.Popups[i].Question.title+'</h4></div><div class="modal-body"><section></section></div><div class="modal-footer"></div></div></div></div>';
			
			$("#vpcontain").append(newModal);
			$("#vpModal"+i+" .modal-body section").append(VP_quizText);
			$("#vpModal"+i+" .modal-body section").append(VP_fieldSet);
			
			$("#vpModal"+i+" .modal-footer").append(VP_submitButton);
			$("#vpModal"+i+" .modal-footer").append(VP_closeButton);
			
			$("#vpModal"+i+" #VP_continueButton").css("display","none");	
			
			if(VideoPlusApp.AppData.Popups[i].Enforce) {
				$("#vpModal"+i).attr("data-backdrop","static");
				$("#vpModal"+i).attr("data-keyboard","false");
			}
			else {
				$("#vpModal"+i+" .modal-header").prepend('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>');	
			}
			

			
			
		}

		else if(VideoPlusApp.AppData.Popups[i].Type == "Branching") {
			popupNum = i;
		
			//loads and adds the question for the quiz to the pop up
			var VP_quizText = document.createElement("p");
			VP_quizText.id = "VP_branchText";
			VP_quizText.innerHTML = VideoPlusApp.AppData.Popups[i].Branching.questionText;
			//VP_question.appendChild(VP_quizText);
			
			//loads and adds the fieldset for the quiz to the pop up
			var VP_fieldSet = document.createElement("fieldset");
			VP_fieldSet.id = "VP_fieldSet"+i;
			VP_fieldSet.innerHTML = "<legend>Answers:</legend>";
			//VP_question.appendChild(VP_fieldSet);
			
			//loads all of the answers for the quiz, builds the inputs for them, and adds them to the pop up
			for (var j = 0; j < VideoPlusApp.AppData.Popups[i].Branching.answers.length; j++) {
				//checks to see which answer is correct, and saves it's index for later
				if (VideoPlusApp.AppData.Popups[i].Branching.answers[j].correct == true) {
					correctAnswer = j;
				}
		
				var VP_answer = document.createElement("div");
				VP_answer.setAttribute("class", "VP_answer");
		
				var VP_input = document.createElement("input");
				VP_input.setAttribute("class", "VP_input");
				VP_input.setAttribute("type", "radio");
				VP_input.setAttribute("name", "qu"+i);
				VP_input.setAttribute("value", j);
				VP_input.setAttribute("data-jumpto",VideoPlusApp.AppData.Popups[i].Branching.answers[j].jumpTo);
				VP_input.id = "qu" + i+"-"+j;
		
				var VP_label = document.createElement("label");
				VP_label.setAttribute("for", "qu" + i+"-"+j);
				VP_label.setAttribute("class", "VP_label");
				VP_label.innerHTML = VideoPlusApp.AppData.Popups[i].Branching.answers[j].answerText;
		
				VP_answer.appendChild(VP_input);
				VP_answer.appendChild(VP_label);
				VP_fieldSet.appendChild(VP_answer);
			}
	
		
			//builds the submit button for the pop up window (only gets built for assessment type pop ups)
			var VP_submitButton = document.createElement("button");
			VP_submitButton.id = "VP_submitButton";
			VP_submitButton.setAttribute("class", "VP_popUpButton");
			VP_submitButton.setAttribute("title", "Submits your answer");
			VP_submitButton.href = "#";
			VP_submitButton.setAttribute("onClick", 'EvaluateBranch('+popupNum+')');			
		
			//label for the submit button
			var VP_submitLabel = document.createElement("span");
			VP_submitLabel.setAttribute("class", "VP_buttonLabel");
			VP_submitLabel.innerHTML = "Submit Answer";
		
			//adds the submit button to the pop up
			VP_submitButton.appendChild(VP_submitLabel);
			//$(VP_submitButton).prependTo(VP_bottomButtonSet);
			//VP_bottomButtonSet.appendChild(VP_submitButton);
			

			var newModal = '<div class="modal fade vpModal" id="vpModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="vpModalLabel"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><h4 class="modal-title" id="vpModalLabel">'+VideoPlusApp.AppData.Popups[i].Branching.title+'</h4></div><div class="modal-body"><section></section></div><div class="modal-footer"></div></div></div></div>';
			
			$("#vpcontain").append(newModal);
			$("#vpModal"+i+" .modal-body section").append(VP_quizText);
			$("#vpModal"+i+" .modal-body section").append(VP_fieldSet);
			
			$("#vpModal"+i+" .modal-footer").append(VP_submitButton);
			$("#vpModal"+i+" .modal-footer").append(VP_closeButton);
			
			$("#vpModal"+i+" #VP_continueButton").css("display","none");	
			
			if(VideoPlusApp.AppData.Popups[i].Enforce) {
				$("#vpModal"+i).attr("data-backdrop","static");
				$("#vpModal"+i).attr("data-keyboard","false");
			}
			else {
				$("#vpModal"+i+" .modal-header").prepend('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>');	
			}
			

			
			
		}		
		
		
		else if(VideoPlusApp.AppData.Popups[i].Type == "Information") {
			popupNum = i;
			
			var newModal = '<div class="modal fade vpModal" id="vpModal'+i+'" tabindex="-1" role="dialog" aria-labelledby="vpModalLabel"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><h4 class="modal-title" id="vpModalLabel">'+VideoPlusApp.AppData.Popups[i].Information.title+'</h4></div><div class="modal-body"></div><div class="modal-footer"></div></div></div></div>';
			
			
			$("#vpcontain").append(newModal);
			
			if(VideoPlusApp.AppData.Popups[i].Enforce) {
				$("#vpModal"+i).attr("data-backdrop","static");
				$("#vpModal"+i).attr("data-keyboard","false");
			}
			else {
				$("#vpModal"+i+" .modal-header").prepend('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>');	
			}
			
			
			$("#vpModal"+i+" .modal-footer").append(VP_closeButton);
			
			if(VideoPlusApp.AppData.Popups[i].Information.text !== "none" && VideoPlusApp.AppData.Popups[i].Information.text !== undefined) {
				$("#vpModal"+i+" .modal-body").append("<p>"+VideoPlusApp.AppData.Popups[i].Information.text+"</p>");
			}
			
		
			if(VideoPlusApp.AppData.Popups[i].Information.Media.length > 0) {
				for (var j = 0; j < VideoPlusApp.AppData.Popups[i].Information.Media.length; j++) { 
					VideoPlusApp.EmbedMedia("page", $("#vpModal"+i+" .modal-body"), VideoPlusApp.AppData.Popups[i].Information.Media[j]);
				}		
			}


		}
	
	
		$('#vpModal'+i).on('hidden.bs.modal', function (e) {
			var popupNum = parseInt($(this).attr("id").slice(7));
			if(!VideoPlusApp.vidCompleted) {
				if(VideoPlusApp.AppData.Video.Type == "YouTube") {
					player.playVideo();
				}
				else {
					vid.play();
				}
			}
			
					
			if(VideoPlusApp.popCompleted.indexOf(popupNum) == -1) {
				
				VideoPlusApp.popCompleted.push(popupNum);VideoPlusApp.popCompleted.push(popupNum);
				
				if(VideoPlusApp.AppData.Popups[popupNum].ViewLater) {
					$("#"+VideoPlusApp.AppData.Video.ContainID).append("<a class='popLink' href='javascript:popupOpen("+popupNum+")'>"+VideoPlusApp.AppData.Popups[popupNum].ShortTitle+"</a>");
				}
			}
		});		
	}
	
	var vposition = $("#"+VideoPlusApp.AppData.Video.ContainID).offset();
	var vptop = vposition.top;
	//console.log(vptop);
	$(".vpModal .modal-dialog").css("margin-top",vptop+"px");
	
	
	for(i=0; i<VideoPlusApp.AppData.Bullets.Lists.length; i++) {
		if(VideoPlusApp.AppData.Bullets.Lists[i].ListType == "ordered") {
			var newlist = document.createElement("ol");
			newlist.id = "list"+i;
			newlist.classList = VideoPlusApp.AppData.Bullets.Lists[i].listClasses;
			
		}
		else if(VideoPlusApp.AppData.Bullets.Lists[i].ListType == "unordered") {
			var newlist = document.createElement("ul");
			newlist.id = "list"+i;
			newlist.classList = VideoPlusApp.AppData.Bullets.Lists[i].listClasses;

		}
		
		$("#"+VideoPlusApp.AppData.Bullets.Lists[i].ContainID).append(newlist);
		
		if(VideoPlusApp.AppData.Bullets.Lists[i].DisplayType == "highlight"){
			for(j=0; j<VideoPlusApp.AppData.Bullets.Lists[i].Items.length; j++) {
				VideoPlusApp.bulletAdded.push(i+"-"+j);
				var VP_newlistitem = document.createElement("li");
				VP_newlistitem.id = "listitem-"+i+"-"+j;
				
				var VP_itemicon = document.createElement("i");
				VP_itemicon.classList = VideoPlusApp.AppData.Bullets.Lists[i].iClasses;
				//label for the submit button
				var VP_listitemtext = document.createElement("span");
				VP_listitemtext.innerHTML = VideoPlusApp.AppData.Bullets.Lists[i].Items[j].Text;
				
				VP_newlistitem.appendChild(VP_itemicon);
				VP_newlistitem.appendChild(VP_listitemtext);
				
				$("#list"+i).append(VP_newlistitem);
			}	
		}	
	}
}


function popupClose(popupNum) {
	
	if(VideoPlusApp.AppData.Popups[popupNum].Type == "Branching") {
		
		if(VideoPlusApp.nextJumpTime > -1) {
			if(VideoPlusApp.AppData.Video.Type == "YouTube") {
				player.seekTo(VideoPlusApp.nextJumpTime);
				VideoPlusApp.nextJumpTime = -1;				
				
			}
			else {
				vid.currentTime = VideoPlusApp.nextJumpTime;
				VideoPlusApp.nextJumpTime = -1;			
				vid.play();
			}
		}
	}
	$('#vpModal'+popupNum).modal('toggle');
}


function popupOpen(popupNum) {
	
	if(VideoPlusApp.AppData.Popups[popupNum].PauseVideo) {
		if(VideoPlusApp.AppData.Video.Type == "YouTube") {
			player.pauseVideo();
		}
		else {
			vid.pause();
		}

	}
	
	if(VideoPlusApp.AppData.Popups[popupNum].Type == "Question") {
		questionRefresh(popupNum);	
	}
	else if(VideoPlusApp.AppData.Popups[popupNum].Type == "Branching") {
		branchRefresh(popupNum);	
	}
		
	$('#vpModal'+popupNum).modal('toggle');
}



function questionRefresh(popupNum) {

	var i = popupNum;

	//loads and adds the question for the quiz to the pop up
	var VP_quizText = document.createElement("p");
	VP_quizText.id = "VP_quizText";
	VP_quizText.innerHTML = VideoPlusApp.AppData.Popups[i].Question.questionText;
	//VP_question.appendChild(VP_quizText);
	
	//loads and adds the fieldset for the quiz to the pop up
	var VP_fieldSet = document.createElement("fieldset");
	VP_fieldSet.id = "VP_fieldSet"+i;
	VP_fieldSet.innerHTML = "<legend>Answers:</legend>";
	//VP_question.appendChild(VP_fieldSet);
	
	//loads all of the answers for the quiz, builds the inputs for them, and adds them to the pop up
	for (var j = 0; j < VideoPlusApp.AppData.Popups[i].Question.answers.length; j++) {
		//checks to see which answer is correct, and saves it's index for later
		if (VideoPlusApp.AppData.Popups[i].Question.answers[j].correct == true) {
			correctAnswer = j;
		}

		var VP_answer = document.createElement("div");
		VP_answer.setAttribute("class", "VP_answer");

		var VP_input = document.createElement("input");
		VP_input.setAttribute("class", "VP_input");
		VP_input.setAttribute("type", "radio");
		VP_input.setAttribute("name", "qu"+i);
		VP_input.setAttribute("value", j);
		VP_input.id = "qu" + i+"-"+j;

		var VP_label = document.createElement("label");
		VP_label.setAttribute("for", "qu" + i+"-"+j);
		VP_label.setAttribute("class", "VP_label");
		VP_label.innerHTML = VideoPlusApp.AppData.Popups[i].Question.answers[j].answerText;

		VP_answer.appendChild(VP_input);
		VP_answer.appendChild(VP_label);
		VP_fieldSet.appendChild(VP_answer);
	}

	//builds the submit button for the pop up window (only gets built for assessment type pop ups)
	var VP_submitButton = document.createElement("button");
	VP_submitButton.id = "VP_submitButton";
	VP_submitButton.setAttribute("class", "VP_popUpButton");
	VP_submitButton.setAttribute("title", "Submits your answer");
	VP_submitButton.href = "#";
	VP_submitButton.setAttribute("onClick", 'EvaluateScore('+popupNum+')');			

	//label for the submit button
	var VP_submitLabel = document.createElement("span");
	VP_submitLabel.setAttribute("class", "VP_buttonLabel");
	VP_submitLabel.innerHTML = "Submit Answer";

	//adds the submit button to the pop up
	VP_submitButton.appendChild(VP_submitLabel);
	//$(VP_submitButton).prependTo(VP_bottomButtonSet);
	//VP_bottomButtonSet.appendChild(VP_submitButton);
	
	$("#vpModal"+i+" .modal-body section").html("");
	$("#vpModal"+i+" .modal-body section").append(VP_quizText);
	$("#vpModal"+i+" .modal-body section").append(VP_fieldSet);
	
	$("#vpModal"+popupNum+" #VP_submitButton").removeAttr("disabled");
	$("#vpModal"+popupNum+" #VP_submitButton").css("display","inline-block");
	
	$("#vpModal"+popupNum+" #VP_retryButton").remove();
			
}


function branchRefresh(popupNum) {

	var i = popupNum;

	//loads and adds the question for the quiz to the pop up
	var VP_quizText = document.createElement("p");
	VP_quizText.id = "VP_branchText";
	VP_quizText.innerHTML = VideoPlusApp.AppData.Popups[i].Branching.questionText;
	//VP_question.appendChild(VP_quizText);
	
	//loads and adds the fieldset for the quiz to the pop up
	var VP_fieldSet = document.createElement("fieldset");
	VP_fieldSet.id = "VP_fieldSet"+i;
	VP_fieldSet.innerHTML = "<legend>Answers:</legend>";
	//VP_question.appendChild(VP_fieldSet);
	
	//loads all of the answers for the quiz, builds the inputs for them, and adds them to the pop up
	for (var j = 0; j < VideoPlusApp.AppData.Popups[i].Branching.answers.length; j++) {

		var VP_answer = document.createElement("div");
		VP_answer.setAttribute("class", "VP_answer");

		var VP_input = document.createElement("input");
		VP_input.setAttribute("class", "VP_input");
		VP_input.setAttribute("type", "radio");
		VP_input.setAttribute("name", "qu"+i);
		VP_input.setAttribute("value", j);
		VP_input.setAttribute("data-jumpto",VideoPlusApp.AppData.Popups[i].Branching.answers[j].jumpTo);		
		VP_input.id = "qu" + i+"-"+j;

		var VP_label = document.createElement("label");
		VP_label.setAttribute("for", "qu" + i+"-"+j);
		VP_label.setAttribute("class", "VP_label");
		VP_label.innerHTML = VideoPlusApp.AppData.Popups[i].Branching.answers[j].answerText;

		VP_answer.appendChild(VP_input);
		VP_answer.appendChild(VP_label);
		VP_fieldSet.appendChild(VP_answer);
	}

	//builds the submit button for the pop up window (only gets built for assessment type pop ups)
	var VP_submitButton = document.createElement("button");
	VP_submitButton.id = "VP_submitButton";
	VP_submitButton.setAttribute("class", "VP_popUpButton");
	VP_submitButton.setAttribute("title", "Submits your answer");
	VP_submitButton.href = "#";
	VP_submitButton.setAttribute("onClick", 'EvaluateBranch('+popupNum+')');			

	//label for the submit button
	var VP_submitLabel = document.createElement("span");
	VP_submitLabel.setAttribute("class", "VP_buttonLabel");
	VP_submitLabel.innerHTML = "Submit Answer";

	//adds the submit button to the pop up
	VP_submitButton.appendChild(VP_submitLabel);
	//$(VP_submitButton).prependTo(VP_bottomButtonSet);
	//VP_bottomButtonSet.appendChild(VP_submitButton);
	
	$("#vpModal"+i+" .modal-body section").html("");
	$("#vpModal"+i+" .modal-body section").append(VP_quizText);
	$("#vpModal"+i+" .modal-body section").append(VP_fieldSet);
	
	$("#vpModal"+popupNum+" #VP_submitButton").removeAttr("disabled");
	$("#vpModal"+popupNum+" #VP_submitButton").css("display","inline-block");
	
	$("#vpModal"+popupNum+" #VP_retryButton").remove();
			
}




function EvaluateScore(popupNum) {
	
	for (var j = 0; j < VideoPlusApp.AppData.Popups[popupNum].Question.answers.length; j++) {
		//checks to see which answer is correct, and saves it's index for later
		if (VideoPlusApp.AppData.Popups[popupNum].Question.answers[j].correct == true) {
			correctAnswer = j;
		}
	}
	
	//gets the value associated with the answer that you chose
	var idNum = $('input[name=qu'+popupNum+']:checked').val();
	
	$('#vpModal'+popupNum+' #VP_feedback').remove();
	
	if(idNum == undefined) {
		var VP_feedback = document.createElement("p");
		VP_feedback.id = "VP_feedback";
		VP_feedback.innerHTML = "<strong>Feedback: You must select an answer.</strong>";			

		//VP_question.appendChild(VP_feedback);
		$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
	}
	else {
		
		$('input[name=qu'+popupNum+']').attr("disabled","disabled");
		
		//selects the container for the chosen answer
		
		var questionCont = $("#qu" + popupNum+"-"+idNum).parent();
		//var questionCont = $("#vpModal"+popupNum+" .modal-body section");
	
		//disables the submit button to prevent re-submits, and enables the finish button
		$("#vpModal"+popupNum+" #VP_submitButton").attr("disabled","disabled");
		$("#vpModal"+popupNum+" #VP_submitButton").css("display","none");
		//document.getElementById("VP_finishButton").disabled = false;
	
		//styles the container of the answer that was chosen
		questionCont.attr("style", "background:#D8D8D8;");
	
		//checks to see if feedback needs to be provided, if so, it loads the feedback associated with the chosen answer and adds it to the pop up
		if (VideoPlusApp.AppData.Popups[popupNum].Question.feedbacktext == true) {
			if(VideoPlusApp.AppData.Popups[popupNum].Question.answers[idNum].feedback !== "none") {
				var VP_feedback = document.createElement("p");
				VP_feedback.id = "VP_feedback";
				VP_feedback.innerHTML = "<strong>Feedback: " + VideoPlusApp.AppData.Popups[popupNum].Question.answers[idNum].feedback + "</strong>";
		
				//VP_question.appendChild(VP_feedback);
				$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
			}
			else {
			//compares the chosen answer to the correct one, and assign's a correctness value accordingly
				if (idNum == correctAnswer) {
						var VP_feedback = document.createElement("p");
						VP_feedback.id = "VP_feedback";
						VP_feedback.innerHTML = "<strong>Feedback: You answered correctly!</strong>";
				}
				else {
						var VP_feedback = document.createElement("p");
						VP_feedback.id = "VP_feedback";
						VP_feedback.innerHTML = "<strong>Feedback: You answered incorrectly!</strong>";
				}
			}
	
		}
		

		if (VideoPlusApp.AppData.Popups[popupNum].MustRetry) {
			if (idNum == correctAnswer) {
				//if(VideoPlusApp.popCompleted.indexOf(popupNum) == -1) {

					//adds the submit button to the pop up				
					$("#vpModal"+popupNum+" #VP_continueButton").css("display","inline-block");
					
				//}
			}
			else {
				var VP_retryButton = document.createElement("button");
				VP_retryButton.id = "VP_retryButton";
				VP_retryButton.setAttribute("class", "VP_popUpButton");
				VP_retryButton.setAttribute("title", "Retry the question");
				VP_retryButton.href = "#";
				VP_retryButton.setAttribute("onClick", 'questionRefresh('+popupNum+')');			
				
				//label for the submit button
				var VP_retryLabel = document.createElement("span");
				VP_retryLabel.setAttribute("class", "VP_buttonLabel");
				VP_retryLabel.innerHTML = "Retry Question";
				
					//adds the submit button to the pop up
				VP_retryButton.appendChild(VP_retryLabel);
				
				$("#vpModal"+popupNum+" .modal-footer").prepend(VP_retryButton);	
			}
			
		}
		else {
			//if(VideoPlusApp.popCompleted.indexOf(popupNum) == -1) {
				//adds the submit button to the pop up				
				$("#vpModal"+popupNum+" #VP_continueButton").css("display","inline-block");
			//}
		}
			
			

			//VP_question.appendChild(VP_feedback);
			$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
			

	
		if(VideoPlusApp.AppData.Popups[popupNum].Question.feedbackicons == true) {	
		
			//loads the correct and wrong indicators for visual feedback
			var correct = "<img class=\"correct\" src=\"../img/Right_16.png\" alt=\"right check mark\" disabled/>";
			var wrong = "<img class=\"wrong\" src=\"../img/Wrong_16.png\" alt=\"wrong x\" disabled/>";
			
			//assigns the correct and wrong visual indicators
			$("#vpModal"+popupNum + " .VP_answer").each(function(index) {
				if (index == correctAnswer) {
					$(correct).appendTo(this);
				}
				else {
					$(wrong).appendTo(this);
				}
			});
		}
	}
}



function EvaluateBranch(popupNum) {
	
	
	
	VideoPlusApp.nextJumpTime = $('input[name=qu'+popupNum+']:checked').attr("data-jumpto");

	//gets the value associated with the answer that you chose
	var idNum = $('input[name=qu'+popupNum+']:checked').val();
	

	$('#vpModal'+popupNum+' #VP_feedback').remove();
	
	if(idNum == undefined) {
		var VP_feedback = document.createElement("p");
		VP_feedback.id = "VP_feedback";
		VP_feedback.innerHTML = "<strong>Feedback: You must select an answer.</strong>";			

		//VP_question.appendChild(VP_feedback);
		$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
	}
	else {
		VideoPlusApp.branchReqs.push(VideoPlusApp.AppData.Popups[popupNum].Branching.answers[idNum].reqId);
		$('input[name=qu'+popupNum+']').attr("disabled","disabled");
		
		//selects the container for the chosen answer
		
		var questionCont = $("#qu" + popupNum+"-"+idNum).parent();
		//var questionCont = $("#vpModal"+popupNum+" .modal-body section");
	
		//disables the submit button to prevent re-submits, and enables the finish button
		$("#vpModal"+popupNum+" #VP_submitButton").attr("disabled","disabled");
		$("#vpModal"+popupNum+" #VP_submitButton").css("display","none");
		//document.getElementById("VP_finishButton").disabled = false;
	
		//styles the container of the answer that was chosen
		questionCont.attr("style", "background:#D8D8D8;");
	
		//checks to see if feedback needs to be provided, if so, it loads the feedback associated with the chosen answer and adds it to the pop up
		if (VideoPlusApp.AppData.Popups[popupNum].Branching.feedbacktext == true) {
			if(VideoPlusApp.AppData.Popups[popupNum].Branching.answers[idNum].feedback !== "none") {
				var VP_feedback = document.createElement("p");
				VP_feedback.id = "VP_feedback";
				VP_feedback.innerHTML = "<strong>" + VideoPlusApp.AppData.Popups[popupNum].Branching.answers[idNum].feedback + "</strong>";
		
				//VP_question.appendChild(VP_feedback);
				$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
			}
		}
		

		//VP_question.appendChild(VP_feedback);
		$("#vpModal"+popupNum+" .modal-body section").append(VP_feedback);
		$("#vpModal"+popupNum+" #VP_continueButton").css("display","inline-block");
	
	}
}


function previewStart() {
	
	$("#vidpreview").css("display","none");
	$(".playpause").fadeOut(200);	
	if(VideoPlusApp.AppData.Video.Type == "YouTube") {
		$("#ytplayer").css("visibility","visible");
		player.playVideo();
	}
	else {
		vid.play();
	}
}


function startVid() {
	$("#"+VideoPlusApp.AppData.Video.VideoID).bind("click", function () {
		var vid = $(this).get(0);
		if (vid.paused) {
		  vid.play();
		} else {
		  vid.pause();
		}
	});	
	
	$(".playpause").fadeOut(200);
	var vid = $("#"+VideoPlusApp.AppData.Video.VideoID).get(0);
	vid.play();
}



function videoListener() {
	
	if(VideoPlusApp.AppData.Video.Type == "YouTube") {
		vid = {
			"currentTime":player.getCurrentTime()
		}
	}
	
	for(i=0; i<VideoPlusApp.AppData.Popups.length; i++) {

		if(vid.currentTime >= VideoPlusApp.AppData.Popups[i].StartTime) {
		
			if(VideoPlusApp.popStarted.indexOf(i) == -1) {
				
				if(VideoPlusApp.AppData.Popups[i].Type == "Branching") {

					var popBranch = true;
					for(j=0; j<VideoPlusApp.AppData.Popups[i].PreReqIds.length; j++) {
						if(VideoPlusApp.branchReqs.indexOf(VideoPlusApp.AppData.Popups[i].PreReqIds[j]) == -1) {
							popBranch = false;
						}	
					}
					
					if(popBranch) {
						if(VideoPlusApp.AppData.Popups[i].PauseVideo) {
							if(VideoPlusApp.AppData.Video.Type == "YouTube") {
								player.pauseVideo();
							}
							else {
								vid.pause();
							}
						}
						
						VideoPlusApp.popStarted.push(i);
						$('#vpModal'+i).modal('toggle');
					}
					
				}
				else {
					if(VideoPlusApp.AppData.Popups[i].PauseVideo) {
						if(VideoPlusApp.AppData.Video.Type == "YouTube") {
							player.pauseVideo();
						}
						else {
							vid.pause();
						}
						
					}
					
					VideoPlusApp.popStarted.push(i);
					$('#vpModal'+i).modal('toggle');
				}
				

			}
		}

	}	


	for(i=0; i<VideoPlusApp.AppData.Bullets.Lists.length; i++) {

		for(j=0; j<VideoPlusApp.AppData.Bullets.Lists[i].Items.length; j++) {
			if(VideoPlusApp.AppData.Bullets.Lists[i].DisplayType=="appear") {
				if(vid.currentTime > VideoPlusApp.AppData.Bullets.Lists[i].Items[j].StartTime && VideoPlusApp.bulletAdded.indexOf(i+"-"+j) == -1) {
					VideoPlusApp.bulletAdded.push(i+"-"+j);
					var VP_newlistitem = document.createElement("li");
					VP_newlistitem.id = "listitem-"+i+"-"+j;
					
					var VP_itemicon = document.createElement("i");
					VP_itemicon.classList = VideoPlusApp.AppData.Bullets.Lists[i].iClasses;
					
					//label for the submit button
					var VP_listitemtext = document.createElement("span");
					VP_listitemtext.innerHTML = VideoPlusApp.AppData.Bullets.Lists[i].Items[j].Text;
					
					VP_newlistitem.appendChild(VP_itemicon);
					VP_newlistitem.appendChild(VP_listitemtext);
					$("#list"+i).append(VP_newlistitem);
				}
				
				if(!VideoPlusApp.vidCompleted) {
					if(vid.currentTime < VideoPlusApp.AppData.Bullets.Lists[i].Items[j].StartTime && VideoPlusApp.bulletAdded.indexOf(i+"-"+j) !== -1){
						$("#listitem-"+i+"-"+j).remove();
						var itemindex = VideoPlusApp.bulletAdded.indexOf(i+"-"+j);
						VideoPlusApp.bulletAdded.splice(itemindex,1);
					}
				}
				
			}
			else if(VideoPlusApp.AppData.Bullets.Lists[i].DisplayType=="highlight") {
				if(vid.currentTime > VideoPlusApp.AppData.Bullets.Lists[i].Items[j].StartTime && vid.currentTime < VideoPlusApp.AppData.Bullets.Lists[i].Items[j].EndTime) {
					if(VideoPlusApp.AppData.Bullets.Lists[i].HighlightCol !== "none") {
						$("#listitem-"+i+"-"+j).css("color",VideoPlusApp.AppData.Bullets.Lists[i].HighlightCol);
					}
					$("#listitem-"+i+"-"+j).css("font-weight","bold");
				}
				else {
					$("#listitem-"+i+"-"+j).css("color","initial");
					$("#listitem-"+i+"-"+j).css("font-weight","normal");
				}
			}
		}
	}
}




/**
 * Function: EmbedMedia
 * 
 * Takes the passed object data and embeds it according to it's type and whether it's a pop up or pre/post/pop activity content. 
 * 
 * Parameters:
 * 
 *   type         - String
 *   containerRef - String
 *   mediaData    - Object
 * 
 */
VideoPlusApp.EmbedMedia = function(type, containerRef, mediaData) {
    var mediaDomObj = document.createElement("div");
    mediaDomObj.setAttribute('class', 'HS_Media')

    switch(mediaData.type) {
      	case "link":
          	var mediaDomContent = document.createElement("a");
          	mediaDomContent.setAttribute('class', 'HS_MediaLink');
          	mediaDomContent.setAttribute('href', mediaData.src);
          	mediaDomContent.setAttribute('target', "_blank");

          	if(mediaData.description) {
            	mediaDomContent.innerHTML = mediaData.description
          	} 
          	else {
            	mediaDomContent.innerHTML = "Link"
          	}
          	mediaDomObj.appendChild(mediaDomContent);

          	break;

      	case "audio":
			var mediaDomContent = document.createElement("audio");
			mediaDomContent.id = mediaData.id;
			mediaDomContent.setAttribute('class', 'HS_MediaAudio');
			mediaDomContent.setAttribute('target', "_blank");

			mediaDomContent.innerHTML = "<source src=\"" + mediaData.mp3 + "\" type=\"audio/mpeg\">" + 
									    "<source src=\"" + mediaData.ogg + "\" type=\"audio/ogg\">" +
									    "<source src=\"" + mediaData.wav + "\" type=\"audio/wav\"> Your browser does not support the audio tag.";
			mediaDomObj.appendChild(mediaDomContent);

			var HS_audioButton = document.createElement("button");
			HS_audioButton.setAttribute("class", "HS_audioButton");
			HS_audioButton.setAttribute("title", "Play Audio Button");
			HS_audioButton.onclick = function() {
				var audioClip = document.getElementById(mediaData.id);
				audioClip.play();
			};
			mediaDomObj.appendChild(HS_audioButton);
			break;

      	case "image":
          	if(mediaData.mediaLink != "none") {
            	var mediaDomLink = document.createElement("a");
            	mediaDomLink.setAttribute('class', 'HS_MediaImage');
            	mediaDomLink.setAttribute('href', mediaData.mediaLink);
            	mediaDomLink.setAttribute('target', "_blank");
          	}

         	var mediaDomContent = document.createElement("img");

          	if(mediaData.mediaLink  == "none") {
            	mediaDomContent.setAttribute('class', 'HS_MediaImage');
          	}

         	mediaDomContent.setAttribute('src', mediaData.src);

          	if (type == "window") {
         	 	mediaDomContent.setAttribute('width', '100%');
         	 	mediaDomContent.setAttribute('height', $("#HS_imageMap").height() / 2);
         	}
         	else {
          		if(mediaData.width != "none") {
            		mediaDomContent.setAttribute('width', mediaData.width);
          		}
          		else {
	           		mediaDomContent.setAttribute('width', '420');
	        	}

          		if(mediaData.height != "none"){
            		mediaDomContent.setAttribute('height', mediaData.height);
          		}
          		else {
	              	mediaDomContent.setAttribute('height', '315');
	        	}
         	}

          	mediaDomObj.setAttribute('style', 'text-align:center;');

          	if(mediaData.description) {
            	mediaDomContent.setAttribute('alt', mediaData.description)
          	} 
          	if(mediaData.mediaLink  == "none") {
            	mediaDomObj.appendChild(mediaDomContent)
          	} 
          	else {
            	mediaDomLink.appendChild(mediaDomContent)
            	mediaDomObj.appendChild(mediaDomLink)
          	}
          
          	break;

      	case "YouTubeVideo":
          	validSrc = VideoPlusApp.validateYouTubeLink(mediaData.src)
          	if(validSrc){
            	var mediaDomContent = document.createElement("iframe");
            	mediaDomContent.setAttribute('class', 'HS_MediaEmbeddedVideo');

            	if (type == "window") {
            		mediaDomContent.setAttribute('width', '100%');
					mediaDomContent.setAttribute('height', ($(HS_questionContainer).width()*.5625));
            	}
            	else {
            		if(mediaData.width != "none"){
	              		mediaDomContent.setAttribute('width', mediaData.width);
	            	} 
	            	else {
	              		mediaDomContent.setAttribute('width', '420');
	            	}

	            	if(mediaData.height != "none"){
	              		mediaDomContent.setAttribute('height', mediaData.height);
	            	} 
	            	else {
	              		mediaDomContent.setAttribute('height', '315');
	            	}
            	}

            	mediaDomContent.setAttribute('frameborder', '0');
            	mediaDomContent.setAttribute('allowfullscreen', 'true');
           	 	mediaDomContent.setAttribute('style', 'padding-bottom: 10px 0px;')

            	mediaDomContent.setAttribute('src', validSrc);
            	mediaDomObj.setAttribute('style', 'text-align:center;');

            	if(mediaData.description) {
             		mediaDomContent.setAttribute('alt', mediaData.description)
           		} 

            	mediaDomObj.appendChild(mediaDomContent)

/*
            	var mediaDomLink = document.createElement("a");
            	mediaDomLink.setAttribute('class', 'HS_MediaAltLink');
           		mediaDomLink.setAttribute('href', mediaData.altLink);
            	mediaDomLink.setAttribute('target', "_blank");
            	mediaDomLink.innerHTML = "Alternate Link."

            	mediaDomObj.appendChild(mediaDomLink)
*/
          	}

          	break;

      case "text":
      	  var mediaDomContent = document.createElement("p");
          mediaDomContent.setAttribute('class', 'HS_MediaText');
          mediaDomContent.setAttribute('target', "_blank");
          mediaDomContent.innerHTML = mediaData.content;
          mediaDomObj.appendChild(mediaDomContent);

          break;

      default:
          break;
    }


    containerRef.append(mediaDomObj);
}

/**
 * Function: validateYouTubeLink
 * 
 * Takes the passed string and checks to see if it is a valid YouTube link.
 * 
 * Parameters:
 * 
 *   src - String
 * 
 * Returns:
 * 
 *   A valid Youtube link(if it validates).
 */
VideoPlusApp.validateYouTubeLink = function(src) {
  	if(src.indexOf("www.youtube.com") !== -1) {
    	if(src.indexOf("</iframe>") == -1) {
	      	if(src.indexOf("watch?v=") != -1) {
	        	code = src.slice(src.indexOf("?v=")+3);
	        	return "https://www.youtube.com/embed/"+code;
	      	} 
	      	else {
	        	return false;
	      	}
    	} 
    	else {
      		// they grabbed the embed code probably
     		if(src.indexOf("https://www.youtube.com/embed/") !== -1) {
        		return link.slice(link.indexOf("src")+5, link.indexOf("\"", link.indexOf("src")+5));
      		} 
      		else {
        		return false;
      		}
    	}
  	} 
  	else {
    	return false;
  	}
}


