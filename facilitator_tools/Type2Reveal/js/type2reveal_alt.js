// JavaScript Document

var trappdata;

$(document).ready(function () {
	$.getJSON( "data/"+datafilename, function( data ) {
	  	trappdata = data;
		buildType2();
		
	});
});


function buildType2() {
	
	$('#type2reveal').html('');
	$('#type2reveal').append('<a href="javascript:buildType2()" class="btn btn-primary" id="resetT2R">Reset Activity</a>')
	
	for(var q=0; q<trappdata.Questions.length; q++) {
		
		var newquestion = '<div class="row t2ritem">';
		newquestion += '<div class="col-sm-12"><strong>'+trappdata.Questions[q].QuestionText+'</strong>';
		if(trappdata.Questions[q].InputType == "text" && trappdata.Questions[q].KeyWords.length > 0) {
			newquestion += '<br><em>Key Words: '+trappdata.Questions[q].KeyWords.length+'</em>';
		}
		newquestion += '</div>';
		newquestion += '<div class="col-sm-8">';
		if(trappdata.Questions[q].InputType == "text") {
			newquestion += '<textarea rows="4" id="t2rinput-'+q+'" data-qindex="'+q+'"></textarea>';
		}
		else {
			newquestion += '<input type="'+trappdata.Questions[q].InputType+'" id="t2rinput-'+q+'" data-qindex="'+q+'">'
		}
		
		newquestion += '</div>';
		newquestion += '<div class="col-sm-4"><a class="btn btn-primary disabled" role="button" id="t2rbtn-'+q+'" data-toggle="collapse" aria-expanded="false" aria-controls="t2ranswer-'+q+'" href="#t2ranswer-'+q+'">'+trappdata.Questions[q].ButtonText+'</a>';
		
		if(trappdata.Questions[q].InputType == "text" && trappdata.Questions[q].MinCharacters > 0) {
			newquestion += '<br>Characters Remaining: <span id="t2rcharcount-'+q+'">'+trappdata.Questions[q].MinCharacters+'</span>';
		}
		
		newquestion += '</div>';
		newquestion += '<div class="col-sm-12"><div id="t2ranswer-'+q+'" class="collapse" data-qindex="'+q+'"><strong>Answer: </strong>'+trappdata.Questions[q].AnswerText;
		if(trappdata.Questions[q].InputType == "text" && trappdata.Questions[q].KeyWords.length > 0) {
			newquestion += '<br><em>Key Words: '
				for(var w=0; w<trappdata.Questions[q].KeyWords.length; w++) {
					newquestion += trappdata.Questions[q].KeyWords[w];
					if(w !== (trappdata.Questions[q].KeyWords.length - 1)) {
						newquestion += ', ';
					}
				}
			newquestion += '</em>';
		}		
		
		newquestion += '</div></div>';
		newquestion += '</div>';
		$('#type2reveal').append(newquestion);
		
		
		if(trappdata.Questions[q].InputType == "text") {
			$('#t2rinput-'+q).keypress( _.debounce( function(){

				var qindex = parseInt($(this).attr("data-qindex"));

				if($(this).val().length > trappdata.Questions[qindex].MinCharacters) {
					$('#t2rcharcount-'+qindex).text(0);
					$('#t2rbtn-'+qindex).removeClass('disabled');
				}
				else {
					$('#t2rcharcount-'+qindex).text(trappdata.Questions[qindex].MinCharacters - $(this).val().length);
				}

			}, 500 ) );	

	
		}
		
		else if(trappdata.Questions[q].InputType == "number") {
			
			$('#t2rinput-'+q).bind('keyup input change', function(){
				
				var qindex = parseInt($(this).attr("data-qindex"));
				
				if($(this).val() !== "") {
					$('#t2rbtn-'+qindex).removeClass('disabled');
				}
			});			
			
			
		}
		
		
		$('#t2ranswer-'+q).on('shown.bs.collapse', function () {

			var qindex = $(this).attr('data-qindex');
			$('#t2rbtn-'+qindex).removeAttr("href");
			$('#t2rinput-'+qindex).attr("disabled","disabled");

			if(trappdata.Questions[qindex].InputType == "text" && trappdata.Questions[qindex].KeyWords.length > 0) {
				$('#t2rinput-'+qindex).highlightTextarea({
					words: trappdata.Questions[qindex].KeyWords,
					caseSensitive: false
				});

			}

		});		


/*		    var index = textarea.innerText.indexOf("@twitter");
                if( index >= 0)
                    textarea.setSelectionRange(index, index + 8);
            });*/
		
		
	}
	
}



// JavaScript Document