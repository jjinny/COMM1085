// JavaScript Document

	var dnappdata;

	$(document).ready(function () {
		$.getJSON("data/" + datafilename, function (data) {
			dnappdata = data;
			appInit();
		});
	});

	function appInit() {
		console.log(dnappdata);
		
		for(var a=0; a<dnappdata.Activities.length; a++) {
			var buttonhtml = '<div class="btn-group btn-group-justified" role="group" aria-label="..."><div class="btn-group" role="group"><button id="prevstep'+a+'" type="button" class="btn btn-primary" disabled="disabled">'+dnappdata.Activities[a].Navigation.ButtonPrev+'</button></div><div class="btn-group" role="group"><button id="nextstep'+a+'" type="button" class="btn btn-primary" onClick="diagramNext('+a+',1)">'+dnappdata.Activities[a].Navigation.ButtonNext+'</button></div></div>';
			$("#"+dnappdata.Activities[a].ContainerID).append(buttonhtml);
			if(dnappdata.Activities[a].Navigation.ShowProgress) {
				$("#"+dnappdata.Activities[a].ContainerID).append('<div class="text-center"><p id="diagramprogress'+a+'">'+dnappdata.Activities[a].StepText+' 1 of '+dnappdata.Activities[a].Steps.length+'</p></div>');
			}					

			var imagehtml = '<img id="stepimage'+a+'" class="img-responsive" src="'+dnappdata.Activities[a].Steps[0].Image.FilePath+dnappdata.Activities[a].Steps[0].Image.FileName+'" alt="'+dnappdata.Activities[a].Steps[0].Image.AltText+'" />';

			if(dnappdata.Activities[a].Layout.TextPosition !== "none" && dnappdata.Activities[a].Layout.TextPosition !== "") {

				var apphtml = '<div class="row">';
				var textcol = dnappdata.Activities[a].Layout.TextColumns;
				if(textcol == 0) {
					textcol = 12;
				}
				var imgcol = 12 - dnappdata.Activities[a].Layout.TextColumns;
				if(imgcol == 0) {
					imgcol = 12;
				}
				if(dnappdata.Activities[a].Layout.TextPosition == "bottom") {
					textcol = 12;
					imgcol = 12;
				}			
				var diagramhtml = '<div class="col-sm-'+imgcol+'">';

					diagramhtml += imagehtml;
					diagramhtml += '</div>';

				var texthtml = 	'<div class="col-sm-'+textcol+'">';

					if(dnappdata.Activities[a].Layout.TextStyle.toLowerCase() == "list") {
						texthtml += '<ol id="diagramlist'+a+'" class="box-number">';
						for(var s=0; s<dnappdata.Activities[a].Steps.length; s++) {
							if(dnappdata.Activities[a].Steps[s].HTML !== "" && dnappdata.Activities[a].Steps[s].HTML !== "none") {
								texthtml += '<li class="imagemap-appear imagemap-hidden" id="imagemap-step-'+a+'-'+s+'">'+dnappdata.Activities[a].Steps[s].HTML+'</li>';
							}
						}

						texthtml += '</ol>';
					}
					else if(dnappdata.Activities[a].Layout.TextStyle.toLowerCase() == "html") {
						texthtml += '<div>';
						for(var s=0; s<dnappdata.Activities[a].Steps.length; s++) {
							if(dnappdata.Activities[a].Steps[s].HTML !== "" && dnappdata.Activities[a].Steps[s].HTML !== "none") {
								texthtml += '<div class="imagemap-appear imagemap-hidden" id="imagemap-step-'+a+'-'+s+'">'+dnappdata.Activities[a].Steps[s].HTML+'</div>';
							}
						}
						texthtml += '</div>';
					}

					texthtml += '</div>';


				if(dnappdata.Activities[a].Layout.TextPosition.toLowerCase() == "left") {
					apphtml += texthtml + diagramhtml;
				}
				else if (dnappdata.Activities[a].Layout.TextPosition.toLowerCase() == "right") {
					apphtml += diagramhtml + texthtml;
				}
				else if (dnappdata.Activities[a].Layout.TextPosition.toLowerCase() == "bottom") {
					apphtml += diagramhtml + texthtml;			
				}

				apphtml += '</div>';
				$("#"+dnappdata.Activities[a].ContainerID).append(apphtml);
			}
			else {
				$("#"+dnappdata.Activities[a].ContainerID).append(imagehtml);
			}

			$('#imagemap-step-0-0').removeClass("imagemap-hidden");	
		}
		
	
		
	}

	function diagramNext(aindex, index) {
		$('#stepimage'+aindex).attr('src',dnappdata.Activities[aindex].Steps[index].Image.FilePath+dnappdata.Activities[aindex].Steps[index].Image.FileName);
		$('#stepimage'+aindex).attr('alt',dnappdata.Activities[aindex].Steps[index].Image.AltText);
		
		if(dnappdata.Activities[aindex].Navigation.ShowProgress) {
			$('#diagramprogress'+aindex).text(dnappdata.Activities[aindex].StepText+' '+(index+1)+' of '+dnappdata.Activities[aindex].Steps.length);
		}
		
		if(dnappdata.Activities[aindex].Layout.TextDisplay.toLowerCase() == "single") {
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
		if(index < ((dnappdata.Activities[aindex].Steps.length)-1)) {
			$('#nextstep'+aindex).removeAttr('disabled');
			$('#nextstep'+aindex).attr('onClick','diagramNext('+(aindex)+','+(index+1)+')');
		}
		else {
			$('#nextstep'+aindex).attr('disabled','disabled');
			$('#nextstep'+aindex).removeAttr('onClick');
		}

	}
		