// JavaScript Document


var thisorthatdata;
var currentquestionindex = [];
var currentuserscore = [];

$(document).ready(function () {
	console.log("data/" + datafilename);
	$.getJSON("data/" + datafilename, function (data) {
		thisorthatdata = data;
		initActivity();
	});
});


function initActivity() {
	
	for(var a=0; a<thisorthatdata.ActivityList.length; a++) {
		
		var htmlbuilding = "";
		htmlbuilding += "<div id='section-"+a+"'>";
		
		if($.isNumeric(thisorthatdata.ActivityList[a].MaxQuestions)) {
			if(thisorthatdata.ActivityList[a].MaxQuestions < 1) {
				thisorthatdata.ActivityList[a].MaxQuestions = 99999;
			}
		}
		else {
			thisorthatdata.ActivityList[a].MaxQuestions = 99999;
		}


		if(thisorthatdata.ActivityList[a].Randomization) {
			var tempQ = thisorthatdata.ActivityList[a].Questions;
			shuffle(tempQ);
		}

		for(var q=0; q<Math.min(thisorthatdata.ActivityList[a].Questions.length, thisorthatdata.ActivityList[a].MaxQuestions); q++) {
			
			htmlbuilding += "<div class='row questionblock' id='question-"+a+"-"+q+"'>";
			htmlbuilding += "<div class='col-md-12'>";
			htmlbuilding += "<h"+thisorthatdata.HeadingLevel+">"

			if(thisorthatdata.ActivityList[a].Layout == "single") {
				htmlbuilding += "Question "+(q+1)+" of "+Math.min(thisorthatdata.ActivityList[a].Questions.length, thisorthatdata.ActivityList[a].MaxQuestions);
			}

			htmlbuilding += "</h"+thisorthatdata.ActivityList[a].HeadingLevel+">";
			htmlbuilding += "<p>"+thisorthatdata.ActivityList[a].Questions[q].Text+"</p>";
			htmlbuilding += "</div>";
			for(var i=0; i<thisorthatdata.ActivityList[a].Questions[q].Answers.length; i++) {
				if(thisorthatdata.ActivityList[a].Questions[q].Answers.length == 2) {
					htmlbuilding += "<div class='col-md-6'>";
				}
				else if(thisorthatdata.ActivityList[a].Questions[q].Answers.length == 3) {
					htmlbuilding += "<div class='col-md-4'>";
				}
				else if(thisorthatdata.ActivityList[a].Questions[q].Answers.length == 4) {
					htmlbuilding += "<div class='col-md-3'>";
				}
				else {
					console.log("I dont know what to do");
				}

				htmlbuilding += "<a class='answerblock' id='S"+a+"Q"+q+"A"+i+"' href='javascript:checkAnswer("+a+","+q+","+i+")'>"+thisorthatdata.ActivityList[a].Questions[q].Answers[i].Text+"</a>";
				htmlbuilding += "</div>";

			}

			htmlbuilding += "<div class='col-md-12'><div class='feedbackblock' id='feedbackS"+a+"Q"+q+"'></div></div>";
			htmlbuilding += "</div>";

			
		}

		htmlbuilding += "</div>";

		$("#"+thisorthatdata.ActivityList[a].ContainerID).append(htmlbuilding);
		
		if(thisorthatdata.ActivityList[a].Layout == "stacked") {
			$("#section-"+a+" .questionblock").addClass("displayed");
		}
		else if(thisorthatdata.ActivityList[a].Layout = "single") {
			$("#section-"+a+" .questionblock").first().addClass("displayed");
			$("#section-"+a).append("<button class='checkanswerbtn btn btn-primary' disabled='disabled'>Next Question</button>");
			$("#section-"+a).append("<div class='clearfix'></div>");
		}			
		
		currentquestionindex.push(0);
		currentuserscore.push(0);

	}

	
	
}


function checkAnswer(sindex, qindex, aindex) {
	
	$("#question-"+sindex+"-"+qindex+" .answerblock").removeAttr("href");
	$("#S"+sindex+"Q"+qindex+"A"+aindex).addClass("selected");
	
	if(thisorthatdata.ActivityList[sindex].IsScored) {
		if(thisorthatdata.ActivityList[sindex].Questions[qindex].Answers[aindex].Feedback.IsCorrect) {
			currentuserscore[sindex]++;
			$("#feedbackS"+sindex+"Q"+qindex).append("<p>Your answer was correct.</p>");
		}
		else {
			$("#feedbackS"+sindex+"Q"+qindex).append("<p>Your answer was incorrect.</p>");
		}
		
	}
	
	if(thisorthatdata.HasFeedback) {
		$("#feedbackQ"+qindex).append("<p>"+thisorthatdata.ActivityList[sindex].Questions[qindex].Answers[aindex].Feedback.Text+"</p>");
	}
	
	$("#section-"+sindex+" .checkanswerbtn").removeAttr("disabled");
	$("#section-"+sindex+" .checkanswerbtn").attr("onClick","changeQuestion("+sindex+","+(currentquestionindex[sindex]+1)+")");
	
	if(Math.min(thisorthatdata.ActivityList[sindex].Questions.length, thisorthatdata.ActivityList[sindex].MaxQuestions) == (qindex+1)) {
		$("#section-"+sindex+" .checkanswerbtn").text("Review");
		$("#section-"+sindex+" .checkanswerbtn").attr("onClick","loadPostPage("+sindex+")");
	}
	
	currentquestionindex[sindex]++;
	
}


function changeQuestion(section,index) {
	$("#section-"+section+" .questionblock.displayed").removeClass("displayed");
	$("#question-"+section+"-"+index).addClass("displayed");
	
	$("#section-"+section+" .checkanswerbtn").attr("disabled","disabled");
	$("#section-"+section+" .checkanswerbtn").removeAttr("onClick");
	
	
	if(Math.min(thisorthatdata.ActivityList[section].Questions.length, thisorthatdata.ActivityList[section].MaxQuestions) == (index+1)) {
		$("#section-"+section+" .checkanswerbtn").text("Review");
		$("#section-"+section+" .checkanswerbtn").attr("onClick","loadPostPage("+section+")");
	}
	
}



function loadPostPage(section) {
	$("#section-"+section).html('');
	if(thisorthatdata.ActivityList[section].IsScored) {
		$("#"+section).append("<p>You answered correctly on "+currentuserscore[section]+" out of "+Math.min(thisorthatdata.ActivityList[section].Questions.length, thisorthatdata.ActivityList[section].MaxQuestions)+" questions.");
	}
	
	$("#section-"+section).append(thisorthatdata.PostQuiz);
}



function shuffle(arra1) {
    var ctr = arra1.length, temp, index;

// While there are elements in the array
    while (ctr > 0) {
// Pick a random index
        index = Math.floor(Math.random() * ctr);
// Decrease ctr by 1
        ctr--;
// And swap the last element with it
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}