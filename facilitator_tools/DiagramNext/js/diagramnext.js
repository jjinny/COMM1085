// JavaScript Document

	var appdata;

	$(document).ready(function () {
		$.getJSON("data/" + datafilename, function (data) {
			appdata = data;
			appInit();
		});
	});

	function appInit() {
		var buttonhtml = '<div class="btn-group btn-group-justified" role="group" aria-label="..."><div class="btn-group" role="group"><button id="prevstep" type="button" class="btn btn-primary" disabled="disabled">'+appdata.Navigation.ButtonPrev+'</button></div><div class="btn-group" role="group"><button id="nextstep" type="button" class="btn btn-primary" onClick="diagramNext(1)">'+appdata.Navigation.ButtonNext+'</button></div></div>';
		$("#"+appdata.ContainerID).append(buttonhtml);
		if(appdata.Navigation.ShowProgress) {
			$("#"+appdata.ContainerID).append('<div class="text-center"><p id="diagramprogress">'+appdata.StepText+' 1 of '+appdata.Steps.length+'</p></div>');
		}					
		
		var imagehtml = '<img id="stepimage" class="img-responsive" src="'+appdata.Steps[0].Image.FilePath+appdata.Steps[0].Image.FileName+'" alt="'+appdata.Steps[0].Image.AltText+'" />';
		
		if(appdata.Layout.TextPosition !== "none" && appdata.Layout.TextPosition !== "") {
			
			var apphtml = '<div class="row">';
			var textcol = appdata.Layout.TextColumns;
			if(textcol == 0) {
				textcol = 12;
			}
			var imgcol = 12 - appdata.Layout.TextColumns;
			if(imgcol == 0) {
				imgcol = 12;
			}
			if(appdata.Layout.TextPosition == "bottom") {
				textcol = 12;
				imgcol = 12;
			}			
			var diagramhtml = '<div class="col-sm-'+imgcol+'">';

				diagramhtml += imagehtml;
				diagramhtml += '</div>';
			
			var texthtml = 	'<div class="col-sm-'+textcol+'">';
			
				if(appdata.Layout.TextStyle.toLowerCase() == "list") {
					texthtml += '<ol id="diagramlist" class="box-number">';
					for(var s=0; s<appdata.Steps.length; s++) {
						if(appdata.Steps[s].HTML !== "" && appdata.Steps[s].HTML !== "none") {
							texthtml += '<li class="imagemap-appear imagemap-hidden" id="imagemap-step'+s+'">'+appdata.Steps[s].HTML+'</li>';
						}
					}
					
					texthtml += '</ol>';
				}
				else if(appdata.Layout.TextStyle.toLowerCase() == "html") {
					texthtml += '<div>';
					for(var s=0; s<appdata.Steps.length; s++) {
						if(appdata.Steps[s].HTML !== "" && appdata.Steps[s].HTML !== "none") {
							texthtml += '<div class="imagemap-appear imagemap-hidden" id="imagemap-step'+s+'">'+appdata.Steps[s].HTML+'</div>';
						}
					}
					texthtml += '</div>';
				}
			
				texthtml += '</div>';
			
			
			if(appdata.Layout.TextPosition.toLowerCase() == "left") {
				apphtml += texthtml + diagramhtml;
			}
			else if (appdata.Layout.TextPosition.toLowerCase() == "right") {
				apphtml += diagramhtml + texthtml;
			}
			else if (appdata.Layout.TextPosition.toLowerCase() == "bottom") {
				apphtml += diagramhtml + texthtml;			
			}
			
			apphtml += '</div>';
			$("#"+appdata.ContainerID).append(apphtml);
		}
		else {
			$("#"+appdata.ContainerID).append(imagehtml);
		}

		$('#imagemap-step'+0).removeClass("imagemap-hidden");		
		
	}

	function diagramNext(index) {
		$('#stepimage').attr('src',appdata.Steps[index].Image.FilePath+appdata.Steps[index].Image.FileName);
		$('#stepimage').attr('alt',appdata.Steps[index].Image.AltText);
		
		if(appdata.Navigation.ShowProgress) {
			$('#diagramprogress').text(appdata.StepText+' '+(index+1)+' of '+appdata.Steps.length);
		}
		
		if(appdata.Layout.TextDisplay.toLowerCase() == "single") {
			$('.imagemap-appear').addClass('imagemap-hidden');
		}
		
		$('#imagemap-step'+index).removeClass("imagemap-hidden");	

		if(index > 0) {
			$('#prevstep').removeAttr('disabled');
			$('#prevstep').attr('onClick','diagramNext('+(index-1)+')');
		}
		else {
			$('#prevstep').attr('disabled','disabled');
			$('#prevstep').removeAttr('onClick');
		}
		if(index < ((appdata.Steps.length)-1)) {
			$('#nextstep').removeAttr('disabled');
			$('#nextstep').attr('onClick','diagramNext('+(index+1)+')');
		}
		else {
			$('#nextstep').attr('disabled','disabled');
			$('#nextstep').removeAttr('onClick');
		}

	}
		