// JavaScript Document

	var dnAppdata;

	$(document).ready(function () {
		$.getJSON("data/" + datafilename2, function (data) {
			dnAppdata = data;
			appInit();
		});
	});

	function appInit() {
		var buttonhtml = '<div class="btn-group btn-group-justified mb-3" role="group" aria-label="..."><div class="btn-group" role="group"><button id="prevstep" type="button" class="btn btn-primary" disabled="disabled">'+dnAppdata.Navigation.ButtonPrev+'</button></div><div class="btn-group" role="group"><button id="nextstep" type="button" class="btn btn-primary" onClick="diagramNext(1)">'+dnAppdata.Navigation.ButtonNext+'</button></div></div>';
		$("#"+dnAppdata.ContainerID).append(buttonhtml);
		if(dnAppdata.Navigation.ShowProgress) {
			$("#"+dnAppdata.ContainerID).append('<div class="text-center"><p id="diagramprogress">'+dnAppdata.StepText+' 1 of '+dnAppdata.Steps.length+'</p></div>');
		}					
		
		var imagehtml = '<img id="stepimage" class="img-responsive" src="'+dnAppdata.Steps[0].Image.FilePath+dnAppdata.Steps[0].Image.FileName+'" alt="'+dnAppdata.Steps[0].Image.AltText+'" />';
		
		if(dnAppdata.Layout.TextPosition !== "none" && dnAppdata.Layout.TextPosition !== "") {
			
			var apphtml = '<div class="row">';
			var textcol = dnAppdata.Layout.TextColumns;
			if(textcol == 0) {
				textcol = 12;
			}
			var imgcol = 12 - dnAppdata.Layout.TextColumns;
			if(imgcol == 0) {
				imgcol = 12;
			}
			if(dnAppdata.Layout.TextPosition == "bottom") {
				textcol = 12;
				imgcol = 12;
			}			
			var diagramhtml = '<div class="col-sm-'+imgcol+'">';

				diagramhtml += imagehtml;
				diagramhtml += '</div>';
			
			var texthtml = 	'<div class="col-sm-'+textcol+'">';
			
				if(dnAppdata.Layout.TextStyle.toLowerCase() == "list") {
					texthtml += '<ol id="diagramlist" class="box-number">';
					for(var s=0; s<dnAppdata.Steps.length; s++) {
						if(dnAppdata.Steps[s].HTML !== "" && dnAppdata.Steps[s].HTML !== "none") {
							texthtml += '<li class="imagemap-appear imagemap-hidden" id="imagemap-step'+s+'">'+dnAppdata.Steps[s].HTML+'</li>';
						}
					}
					
					texthtml += '</ol>';
				}
				else if(dnAppdata.Layout.TextStyle.toLowerCase() == "html") {
					texthtml += '<div>';
					for(var s=0; s<dnAppdata.Steps.length; s++) {
						if(dnAppdata.Steps[s].HTML !== "" && dnAppdata.Steps[s].HTML !== "none") {
							texthtml += '<div class="imagemap-appear imagemap-hidden" id="imagemap-step'+s+'">'+dnAppdata.Steps[s].HTML+'</div>';
						}
					}
					texthtml += '</div>';
				}
			
				texthtml += '</div>';
			
			
			if(dnAppdata.Layout.TextPosition.toLowerCase() == "left") {
				apphtml += texthtml + diagramhtml;
			}
			else if (dnAppdata.Layout.TextPosition.toLowerCase() == "right") {
				apphtml += diagramhtml + texthtml;
			}
			else if (dnAppdata.Layout.TextPosition.toLowerCase() == "bottom") {
				apphtml += diagramhtml + texthtml;			
			}
			
			apphtml += '</div>';
			$("#"+dnAppdata.ContainerID).append(apphtml);
		}
		else {
			$("#"+dnAppdata.ContainerID).append(imagehtml);
		}

		$('#imagemap-step'+0).removeClass("imagemap-hidden");		
		
	}

	function diagramNext(index) {
		$('#stepimage').attr('src',dnAppdata.Steps[index].Image.FilePath+dnAppdata.Steps[index].Image.FileName);
		$('#stepimage').attr('alt',dnAppdata.Steps[index].Image.AltText);
		
		if(dnAppdata.Navigation.ShowProgress) {
			$('#diagramprogress').text(dnAppdata.StepText+' '+(index+1)+' of '+dnAppdata.Steps.length);
		}
		
		if(dnAppdata.Layout.TextDisplay.toLowerCase() == "single") {
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
		if(index < ((dnAppdata.Steps.length)-1)) {
			$('#nextstep').removeAttr('disabled');
			$('#nextstep').attr('onClick','diagramNext('+(index+1)+')');
		}
		else {
			$('#nextstep').attr('disabled','disabled');
			$('#nextstep').removeAttr('onClick');
		}

	}
		