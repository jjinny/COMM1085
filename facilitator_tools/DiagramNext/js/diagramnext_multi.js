// JavaScript Document

	var appdata;

	$(document).ready(function () {
		$.getJSON("data/" + datafilename, function (data) {
			appdata = data;
			appInit();
		});
	});

	function appInit() {
		console.log(appdata);
		
		for(var a=0; a<appdata.Activities.length; a++) {
			var buttonhtml = '<div class="btn-group btn-group-justified" role="group" aria-label="..."><div class="btn-group" role="group"><button id="prevstep'+a+'" type="button" class="btn btn-primary" disabled="disabled">'+appdata.Activities[a].Navigation.ButtonPrev+'</button></div><div class="btn-group" role="group"><button id="nextstep'+a+'" type="button" class="btn btn-primary" onClick="diagramNext('+a+',1)">'+appdata.Activities[a].Navigation.ButtonNext+'</button></div></div>';
			$("#"+appdata.Activities[a].ContainerID).append(buttonhtml);
			if(appdata.Activities[a].Navigation.ShowProgress) {
				$("#"+appdata.Activities[a].ContainerID).append('<div class="text-center"><p id="diagramprogress'+a+'">'+appdata.Activities[a].StepText+' 1 of '+appdata.Activities[a].Steps.length+'</p></div>');
			}					

			var imagehtml = '<img id="stepimage'+a+'" class="img-responsive" src="'+appdata.Activities[a].Steps[0].Image.FilePath+appdata.Activities[a].Steps[0].Image.FileName+'" alt="'+appdata.Activities[a].Steps[0].Image.AltText+'" />';

			if(appdata.Activities[a].Layout.TextPosition !== "none" && appdata.Activities[a].Layout.TextPosition !== "") {

				var apphtml = '<div class="row">';
				var textcol = appdata.Activities[a].Layout.TextColumns;
				if(textcol == 0) {
					textcol = 12;
				}
				var imgcol = 12 - appdata.Activities[a].Layout.TextColumns;
				if(imgcol == 0) {
					imgcol = 12;
				}
				if(appdata.Activities[a].Layout.TextPosition == "bottom") {
					textcol = 12;
					imgcol = 12;
				}			
				var diagramhtml = '<div class="col-sm-'+imgcol+'">';

					diagramhtml += imagehtml;
					diagramhtml += '</div>';

				var texthtml = 	'<div class="col-sm-'+textcol+'">';

					if(appdata.Activities[a].Layout.TextStyle.toLowerCase() == "list") {
						texthtml += '<ol id="diagramlist'+a+'" class="box-number">';
						for(var s=0; s<appdata.Activities[a].Steps.length; s++) {
							if(appdata.Activities[a].Steps[s].HTML !== "" && appdata.Activities[a].Steps[s].HTML !== "none") {
								texthtml += '<li class="imagemap-appear imagemap-hidden" id="imagemap-step-'+a+'-'+s+'">'+appdata.Activities[a].Steps[s].HTML+'</li>';
							}
						}

						texthtml += '</ol>';
					}
					else if(appdata.Activities[a].Layout.TextStyle.toLowerCase() == "html") {
						texthtml += '<div>';
						for(var s=0; s<appdata.Activities[a].Steps.length; s++) {
							if(appdata.Activities[a].Steps[s].HTML !== "" && appdata.Activities[a].Steps[s].HTML !== "none") {
								texthtml += '<div class="imagemap-appear imagemap-hidden" id="imagemap-step-'+a+'-'+s+'">'+appdata.Activities[a].Steps[s].HTML+'</div>';
							}
						}
						texthtml += '</div>';
					}

					texthtml += '</div>';


				if(appdata.Activities[a].Layout.TextPosition.toLowerCase() == "left") {
					apphtml += texthtml + diagramhtml;
				}
				else if (appdata.Activities[a].Layout.TextPosition.toLowerCase() == "right") {
					apphtml += diagramhtml + texthtml;
				}
				else if (appdata.Activities[a].Layout.TextPosition.toLowerCase() == "bottom") {
					apphtml += diagramhtml + texthtml;			
				}

				apphtml += '</div>';
				$("#"+appdata.Activities[a].ContainerID).append(apphtml);
			}
			else {
				$("#"+appdata.Activities[a].ContainerID).append(imagehtml);
			}

			$('#imagemap-step-0-0').removeClass("imagemap-hidden");	
		}
		
	
		
	}

	function diagramNext(aindex, index) {
		$('#stepimage'+aindex).attr('src',appdata.Activities[aindex].Steps[index].Image.FilePath+appdata.Activities[aindex].Steps[index].Image.FileName);
		$('#stepimage'+aindex).attr('alt',appdata.Activities[aindex].Steps[index].Image.AltText);
		
		if(appdata.Activities[aindex].Navigation.ShowProgress) {
			$('#diagramprogress'+aindex).text(appdata.Activities[aindex].StepText+' '+(index+1)+' of '+appdata.Activities[aindex].Steps.length);
		}
		
		if(appdata.Activities[aindex].Layout.TextDisplay.toLowerCase() == "single") {
			$('.imagemap-appear').addClass('imagemap-hidden');
		}
		
		$('#imagemap-step-'+aindex+'-'+index).removeClass("imagemap-hidden");	

		if(index > 0) {
			$('#prevstep'+aindex).removeAttr('disabled');
			$('#prevstep'+aindex).attr('onClick','diagramNext('+(aindex)+','+(index-1)+')');
		}
		else {
			$('#prevstep'+aindex).attr('disabled','disabled');
			$('#prevstep'+aindex).removeAttr('onClick');
		}
		if(index < ((appdata.Activities[aindex].Steps.length)-1)) {
			$('#nextstep'+aindex).removeAttr('disabled');
			$('#nextstep'+aindex).attr('onClick','diagramNext('+(aindex)+','+(index+1)+')');
		}
		else {
			$('#nextstep'+aindex).attr('disabled','disabled');
			$('#nextstep'+aindex).removeAttr('onClick');
		}

	}
		