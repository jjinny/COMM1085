/* Custom Inline Assessment */

var CSVal, pubsubz, valence_req, valence_auth, errorPrompt;
var DiscTitle = ["Writing Activities", "Textbook Activities"];
var DiscTitleIndex = -1;
var DiscussForID = -1;
var DiscussTopID = -1;

var FeedbackOptions = [];
var FeedbackSelected = -1;

var numTopicPostsChecked = 0;

var MyPosts = [];

var isPublished = false;

CSVal.post_post = function(ForID, TopID, postObj) {

   var newroute = CSVal.routes.post_post;
   newroute = newroute.replace("ORGID", CSVal.context.ouID);
   newroute = newroute.replace("TOPICID", TopID);
   newroute = newroute.replace("FORUMID", ForID);

   valence_req
      .post(newroute)
      .send(postObj)
      .use(valence_auth)
      .end(function(err, response) {
         if (err !== null) {
            errorPrompt(err, newroute, "alert");
            return false;
         } else {
			MyPosts.push(response.body);
            $("#update-info #ui-date").text(processDate(response.body.DatePosted));
			$("#update-info").css("display","block");
         }
      });
};

CSVal.update_post = function(ForID, TopID, PostID, postObj) {

   var newroute = CSVal.routes.update_post;
   newroute = newroute.replace("ORGID", CSVal.context.ouID);
   newroute = newroute.replace("TOPICID", TopID);
   newroute = newroute.replace("FORUMID", ForID);
   newroute = newroute.replace("POSTID", PostID);

   valence_req
      .put(newroute)
      .send(postObj)
      .use(valence_auth)
      .end(function(err, response) {
         if (err !== null) {
            errorPrompt(err, newroute, "alert");
            return false;
         } else {
			 var tdate = new Date();
		   $("#update-info #ui-date").text(processDate(tdate));

         }
      });
};



// Process Date String
function processDate(dateString) {

   var dayArray = [];
   dayArray[0] = 'Sun';
   dayArray[1] = 'Mon';
   dayArray[2] = 'Tue';
   dayArray[3] = 'Wed';
   dayArray[4] = 'Thu';
   dayArray[5] = 'Fri';
   dayArray[6] = 'Sat';
   var monthArray = [];
   monthArray[0] = 'January';
   monthArray[1] = 'February';
   monthArray[2] = 'March';
   monthArray[3] = 'April';
   monthArray[4] = 'May';
   monthArray[5] = 'June';
   monthArray[6] = 'July';
   monthArray[7] = 'August';
   monthArray[8] = 'September';
   monthArray[9] = 'October';
   monthArray[10] = 'November';
   monthArray[11] = 'December';

   var postDateObj = new Date(dateString);
   var weekDay = dayArray[postDateObj.getDay()];
   var month = monthArray[postDateObj.getMonth()];
   var monthDay = postDateObj.getDate();
   var year = postDateObj.getFullYear();
   var minutes = postDateObj.getMinutes();

   if (minutes < 10) {
      minutes = "0" + minutes;
   }

   var hours;
   var amPm;

   if (postDateObj.getHours() > 11) {
      hours = postDateObj.getHours() - 12;
      if (hours === 0) {
      	hours = 12;
      }
      amPm = 'pm';
   } else {
      hours = postDateObj.getHours();
      amPm = 'am';
   }

   if (hours === 0) {
      hours = 12;
   }
   var postDate = weekDay + ' ' + month + ' ' + monthDay + ', ' + year + ' | ' + hours + ':' + minutes + amPm;
   return postDate;

}


function editorInit() {
		/** Default editor configuration **/
	$('#editor').trumbowyg({
		autogrow: true,
		btns: [
			//['viewHTML'],
			['formatting'],
			'btnGrp-semantic',
			//['superscript', 'subscript'],
			//['link'],
			//['insertImage'],
			'btnGrp-justify',
			'btnGrp-lists',
			['horizontalRule'],
			['removeformat'],
			['fullscreen']
		],
		removeformatPasted: true
	});		
	
	if(isPublished) {
		$('#editor').trumbowyg('disable');
	}
	
	$(".answer_input").on("click", function() {
		$('.answer_input').wrapInner('<p></p>');
	});	
	
	
	
	
	
}





function loadOriginalHTML() {
	$('#editorload').load(htmlfilename, function() {
		
		//console.log($('#editorload')[0].children);

		for(var c=0; c<$('#editorload')[0].children.length; c++) {
			if($('#editorload')[0].children[c].className == "htmlcontent") {
				$('#editor').append($('#editorload')[0].children[c].innerHTML);
			}
		}
		
		editorInit();

	});
}


function reviewOriginal() {
	
	$('#writingModalLabel').text('Review Original');
	
	$('#writingModal .modal-body').load(htmlfilename, function() {
		$('#writingModal').modal('show');

	});
}


function reviewAnswer() {
	$('#writingModalLabel').text('Review Answer');
	
	$('#writingModal .modal-body').load(answerfilename, function() {
		$('#writingModal').modal('show');

	});
}



/* Comment begins here

	var xhr= new XMLHttpRequest();
	xhr.open('GET', '07_activity_putting_it_together_instructor.html', true);
	xhr.onreadystatechange= function() {
		if (this.readyState!==4) return;
		if (this.status!==200) return; // or whatever error handling you want
		console.log(this);
		document.getElementById('editor').innerHTML= this.responseText;



	};
	xhr.send();	

Comment ends here*/

function saveDraft() {
	
	var edithtml = $('#editor').trumbowyg('html');
	
	 newpost = {
		"ParentPostId": null,
		"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Edited Activity (Draft)",
		"Message": {
		   "Content": edithtml,
		   "Type": "Html"
		},
		"IsAnonymous": false
	 }

	 updatepost = {
		"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Edited Activity (Draft)",
		"Message": {
		   "Content": edithtml,
		   "Type": "Html"
		},
	 }


	 var existingPostNum = -1;


	  if (MyPosts.length > 0) {
		 MyPosts[0].Message.Html = edithtml;
		 existingPostNum = MyPosts[0].PostId;
	  }


	 if (existingPostNum > -1) {
		CSVal.update_post(DiscussForID, DiscussTopID, existingPostNum, updatepost);
	 } else {
		CSVal.post_post(DiscussForID, DiscussTopID, newpost);
	 }
	
}

function savePublish() {
	
	var $modal = $("#editor").trumbowyg("openModal", {
		title: "Publish Confirmation",
		content: "<p>Are you sure you are ready to publish your work? Once you have done this you will no longer be able to edit.</p>"
	});
	
	// Listen clicks on modal box buttons
	$modal.on('tbwconfirm', function(e){
		savePublish2();
		$("#editor").trumbowyg("closeModal");
	});
	$modal.on('tbwcancel', function(e){
		$("#editor").trumbowyg("closeModal");
	});		
	

	
}


function savePublish2() {
	
	$('#update-info #ui-status').text('Published');
	var edithtml = $('#editor').trumbowyg('html');
	
	 newpost = {
		"ParentPostId": null,
		"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Edited Activity (Published)",
		"Message": {
		   "Content": edithtml,
		   "Type": "Html"
		},
		"IsAnonymous": false
	 }

	 updatepost = {
		"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Edited Activity (Published)",
		"Message": {
		   "Content": edithtml,
		   "Type": "Html"
		},
	 }


	 var existingPostNum = -1;


	  if (MyPosts.length > 0) {
		 MyPosts[0].Message.Html = edithtml;
		 existingPostNum = MyPosts[0].PostId;
	  }


	 if (existingPostNum > -1) {
		CSVal.update_post(DiscussForID, DiscussTopID, existingPostNum, updatepost);
	 } else {
		CSVal.post_post(DiscussForID, DiscussTopID, newpost);
	 }
	
	
	var isPublished = true;
	$('#editor').trumbowyg('disable');	
	
	if(answerfilename !== undefined && answerfilename !== null && answerfilename !== "") {
		$("#btn-save-draft").attr("disabled","disabled");
		$("#btn-save-publish").attr("disabled","disabled");
		$("#btn-review-answer").removeAttr("disabled");
	}

}


pubsubz.subscribe('csval/init', function() {

   if (DiscTitle.length > 0) {
      CSVal.get_forums();
   } else {
      $("#inlinefeedback").css("display", "block");
   }

});

pubsubz.subscribe('csval/get_topics', function() {
   var forumindex = -1;
   var topicindex = -1;
   for (var i = 0; i < CSVal.disc.Forums.length; i++) {
	   for(var d=0; d<DiscTitle.length; d++) {
		   if(CSVal.disc.Forums[i].Name === DiscTitle[d]) {
			   	
			    DiscTitleIndex = d;
			   	forumindex = i;			 
			    DiscussForID = CSVal.disc.Forums[i].ForumId;
		   }
		  
	   }
	   
	  if(DiscTitleIndex > -1) {
		 
		 for (var j = 0; j < CSVal.disc.Forums[i].Topics.length; j++) {
			 
			if (CSVal.disc.Forums[i].Topics[j].Name === window.parent.$(".d2l-page-header .d2l-page-title").text()) {
			   DiscussTopID = CSVal.disc.Forums[i].Topics[j].TopicId;
			   topicindex = j;
			   pubsubz.subscribe('csval/get_posts/' + DiscussForID + '/' + CSVal.disc.Forums[i].Topics[j].TopicId, function(ReturnObj) {
				  numTopicPostsChecked += 1;
				  
				  for (var p = 0; p < ReturnObj.PostsObj.length; p++) {
					 if (CSVal.user.Identifier === (String(ReturnObj.PostsObj[p].PostingUserId)) && !(ReturnObj.PostsObj[p].IsDeleted)) {
						MyPosts.push(ReturnObj.PostsObj[p]);
					 }
				  }
				  
				  if(MyPosts.length > 0) {
					  isPublished = true;
					  
					  var response = $($.parseHTML(MyPosts[0].Message.Html));
					  
					  for(a=0; a<$(MyPosts[0].Message.Html).length; a++) {
						  for(var q=0; q<appdata.Questions.length; q++) {
							  if($(MyPosts[0].Message.Html)[a].id == "answer-"+q) {
								  $('#editor-'+q).trumbowyg('html', $(MyPosts[0].Message.Html)[a].innerHTML);
							  }
						  }
						  
					  }
				  }
				   else {
					   
				   }

			   });

			   CSVal.get_posts(DiscussForID, CSVal.disc.Forums[i].Topics[j].TopicId);

			}

		 }

	  } 

   }

});


function checkAnswer(index) {
	
	var edithtml = $('#editor-'+index).trumbowyg('html');

	if(edithtml.length >= appdata.Questions[index].MinCharacters) {
		$('#feedback-'+index).html(appdata.Questions[index].Answer);
		$('#feedback-'+index).css('display','block');
		$('#btn-multi-check-'+index).css('display','none');
		
		$('#editor-'+index).trumbowyg('disable');	
		
	}
	else {
		$('#feedback-'+index).text('You must enter a longer response before checking the answer.');
		$('#feedback-'+index).css('display','block');
	}
	
	if(DiscussForID !== -1 && DiscussTopID !== -1) {
		
		var edithtml = "";

		for(var q=0; q<appdata.Questions.length; q++) {
			edithtml += "<h3>"+appdata.Questions[q].Title+"</h3><div id='answer-"+q+"' style='margin-bottom:20px'>"+$('#editor-'+q).trumbowyg('html')+"</div>";
		}

		
		 newpost = {
			"ParentPostId": null,
			"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Response",
			"Message": {
			   "Content": edithtml,
			   "Type": "Html"
			},
			"IsAnonymous": false
		 }

		 updatepost = {
			"Subject": CSVal.user.FirstName+" "+CSVal.user.LastName+"'s Response",
			"Message": {
			   "Content": edithtml,
			   "Type": "Html"
			},
		 }


		 var existingPostNum = -1;


		  if (MyPosts.length > 0) {
			 MyPosts[0].Message.Html = edithtml;
			 existingPostNum = MyPosts[0].PostId;
		  }


		 if (existingPostNum > -1) {
			CSVal.update_post(DiscussForID, DiscussTopID, existingPostNum, updatepost);
		 } else {
			CSVal.post_post(DiscussForID, DiscussTopID, newpost);
		 }

	}

	
}


$.getJSON('data/' + jsonfilename , function( data ) {
	appdata = data;
	
	for(var q=0; q<appdata.Questions.length; q++) {
		$('#editzone').append('<div id="editquestion-'+q+'"></div>');
		$('#editquestion-'+q).append('<h3>'+appdata.Questions[q].Title+'</h3>');
		$('#editquestion-'+q).append('<p>'+appdata.Questions[q].Text+'</p>');
		
		var editdom = '<div id="editor-'+q+'"';
		if(appdata.Questions[q].Placeholder !== "none" && appdata.Questions[q].Placeholder !== ""){
			editdom += ' placeholder="'+appdata.Questions[q].Placeholder+'"';
		}
		editdom += '></div>';
		
		$('#editquestion-'+q).append(editdom);
		$('#editor-'+q).trumbowyg({
			autogrow: true,
			btns: [
				//['viewHTML'],
				['formatting'],
				'btnGrp-semantic',
				//['superscript', 'subscript'],
				//['link'],
				//['insertImage'],
				'btnGrp-justify',
				'btnGrp-lists',
				['horizontalRule'],
				['removeformat'],
				['fullscreen']
			],
			removeformatPasted: true
		});	
		
		if(appdata.Questions[q].PrePopulated !== "none" && appdata.Questions[q].PrePopulated !== "") {
			$('#editor-'+q).trumbowyg('html', appdata.Questions[q].PrePopulated);
		}
		
		$('#editquestion-'+q).append('<button class="btn btn-primary TES-multi-check" id="btn-multi-check-'+q+'" onClick="checkAnswer('+q+')">Check Answer</button>');
		$('#editquestion-'+q).append('<div class="TES-feedback" id="feedback-'+q+'"></div>');
		$('#editquestion-'+q).append('<div class="clearfix"></div>');
	}
	
	
	CSVal.init();
});

