// js for multi-input activity
// written by Nathan Gardi, 2017
	
		var appdataMiMi;
	
		function checkAnswer(index) {
			$("#feedback-"+index).text("");
			
			var inputblank = false;
			for(var j=0; j<appdataMi.QuestionText[index].Fields.length; j++){
				if($("#input-"+index+"-"+j).val() == "") {
					inputblank = true;
				}
			}

			if(inputblank) {
				$("#feedback-"+index).text("You must input a value.");
			}

			else {
				var overallcorrect = true;

				for(var j=0; j<appdataMi.QuestionText[index].Fields.length; j++) {

					var thisval = $("#input-"+index+"-"+j).val();

					if(appdataMi.QuestionText[index].Fields[j].AnswerType == "number") {
						thisval = parseFloat(thisval);
					}

					if(thisval !== "") {

						/*var outofrange = false;

						if(thisval < parseFloat($("#input-"+index+"-"+j).attr("min"))) {
							outofrange = true;
							anyoutofrange = true;
						}

						if(thisval > parseFloat($("#input-"+index+"-"+j).attr("max"))) {
							outofrange = true;
							anyoutofrange = true;
						}

						if(outofrange) {
							$("#feedback-"+index).text("Your value must be between "+$("#input-"+index+"-"+j).attr("min")+" and "+$("#input-"+index+"-"+j).attr("max")+" inclusive");
						}
						else {
						*/

							$("#input-"+index+"-"+j).attr("disabled","disabled");
							$("#submit-"+index).css("display","none");


							if(appdataMi.QuestionText[index].Fields[j].Answer.HasRange) {
								if(thisval >= appdataMi.QuestionText[index].Fields[j].Answer.Correct[0] && thisval <= appdataMi.QuestionText[index].Fields[j].Answer.Correct[1]) {
									$("#input-"+index+"-"+j).addClass("correct");
									//$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
								}
								else {
									overallcorrect = false;
									$("#input-"+index+"-"+j).addClass("incorrect");
									//$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
								}

								if(appdataMi.QuestionText[index].Fields[j].Answer.AutoDisplay) {

									if(appdataMi.QuestionText[index].Fields[j].PreText !== "" && appdataMi.QuestionText[index].Fields[j].PreText !== "none") {
										$("#feedback-"+index).append("<p>The correct answer for "+appdataMi.QuestionText[index].Fields[j].PreText+" is anywhere between "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[0]+" and "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[1]+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
									}
									else {
										$("#feedback-"+index).append("<p>The correct answer is anywhere between "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[0]+" and "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[1]+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
									}
								}
							}

							else {

                if(!appdataMi.QuestionText[index].Fields[j].Answer.CaseSensitive) {
                	var matchfound = false;
                	for(var t=0; t < appdataMi.QuestionText[index].Fields[j].Answer.Correct.length; t++) {
                		if (thisval.toLowerCase() === appdataMi.QuestionText[index].Fields[j].Answer.Correct[t].toLowerCase()) {
                      $("#input-" + index + "-" + j).addClass("correct");
                      matchfound = true;
										}
									}

									if (!matchfound) {
                    overallcorrect = false;
                    $("#input-" + index + "-" + j).addClass("incorrect");
									}

								}
								else {
                  if (appdataMi.QuestionText[index].Fields[j].Answer.Correct.indexOf(thisval) > -1) {
                    $("#input-" + index + "-" + j).addClass("correct");
                    //$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
                  }
                  else {
                    overallcorrect = false;
                    $("#input-" + index + "-" + j).addClass("incorrect");
                    //$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
                  }
                }

								if(appdataMi.QuestionText[index].Fields[j].Answer.AutoDisplay) {
									if(appdataMi.QuestionText[index].Fields[j].Answer.Correct.length > 1) {
										var answerlist = "";
										for(var i=0; i<appdataMi.QuestionText[index].Fields[j].Answer.Correct.length; i++) {
											answerlist += appdataMi.QuestionText[index].Fields[j].Answer.Correct[i];
											if(i !== appdataMi.QuestionText[index].Fields[j].Answer.Correct.length-1) {
												answerlist+= ", ";
											}
										}
										if(appdataMi.QuestionText[index].Fields[j].PreText !== "" && appdataMi.QuestionText[index].Fields[j].PreText !== "none") {
											$("#feedback-"+index).append("<p>Any of the following answers can be correct for "+appdataMi.QuestionText[index].Fields[j].PreText+" "+answerlist+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
										}
										else {
											$("#feedback-"+index).append("<p>Any of the following answers can be correct: "+answerlist+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
										}


									}
									else {
										if(appdataMi.QuestionText[index].Fields[j].PreText !== "" && appdataMi.QuestionText[index].Fields[j].PreText !== "none") {
											$("#feedback-"+index).append("<p>The correct answer for "+appdataMi.QuestionText[index].Fields[j].PreText+" is "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[0]+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
										}
										else {
											$("#feedback-"+index).append("<p>The correct answer is "+appdataMi.QuestionText[index].Fields[j].Answer.Correct[0]+" "+appdataMi.QuestionText[index].Fields[j].Units+".</p>");
										}
									}
								}

							}

							if(appdataMi.QuestionText[index].Fields[j].Answer.FeedbackText2 !== "" && appdataMi.QuestionText[index].Fields[j].Answer.FeedbackText2 !== "none") {
								$("#feedback-"+index).append("<p>"+appdataMi.QuestionText[index].Fields[j].Answer.FeedbackText2+"</p>");
							}
						/*}*/
					}
				}


				if(overallcorrect) {
					$("#feedbackicon-"+index).addClass("correct");
				}
				else {
					$("#feedbackicon-"+index).addClass("incorrect");
				}

			}
		}


		function checkAll() {

			for(var a=0; a<appdataMi.QuestionText.length; a++) {
				$("#feedback-"+a).html("");
				var overallcorrect = true;
				for(var j=0; j<appdataMi.QuestionText[a].Fields.length; j++) {

					var thisval = $("#input-"+a+"-"+j).val();

					if(appdataMi.QuestionText[a].Fields[j].AnswerType == "number") {
						thisval = parseFloat(thisval);
					}

					$("#input-"+a+"-"+j).attr("disabled","disabled");
					$("#submit-"+a).css("display","none");

					if(appdataMi.QuestionText[a].Fields[j].Answer.HasRange) {
						if(thisval >= appdataMi.QuestionText[a].Fields[j].Answer.Correct[0] && thisval <= appdataMi.QuestionText[a].Fields[j].Answer.Correct[1]) {
							$("#input-"+a+"-"+j).addClass("correct");
							//$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
						}
						else {
							overallcorrect = false;
							$("#input-"+a+"-"+j).addClass("incorrect");
							//$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
						}

						if(appdataMi.QuestionText[a].Fields[j].Answer.AutoDisplay) {

							if(appdataMi.QuestionText[a].Fields[j].PreText !== "" && appdataMi.QuestionText[a].Fields[j].PreText !== "none") {
								$("#feedback-"+a).append("<p>The correct answer for "+appdataMi.QuestionText[a].Fields[j].PreText+" is anywhere between "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[0]+" and "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[1]+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
							}
							else {
								$("#feedback-"+a).append("<p>The correct answer is anywhere between "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[0]+" and "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[1]+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
							}
						}
					}

					else {

            if(!appdataMi.QuestionText[a].Fields[j].Answer.CaseSensitive) {
              var matchfound = false;
              for(var t=0; t < appdataMi.QuestionText[a].Fields[j].Answer.Correct.length; t++) {
                if (thisval.toLowerCase() === appdataMi.QuestionText[a].Fields[j].Answer.Correct[t].toLowerCase()) {
                  $("#input-" + a + "-" + j).addClass("correct");
                  matchfound = true;
                }
              }

              if (!matchfound) {
                overallcorrect = false;
                $("#input-" + a + "-" + j).addClass("incorrect");
              }

            }
            else {
              if (appdataMi.QuestionText[a].Fields[j].Answer.Correct.indexOf(thisval) > -1) {
                $("#input-" + a + "-" + j).addClass("correct");
                //$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
              }
              else {
                overallcorrect = false;
                $("#input-" + a + "-" + j).addClass("incorrect");
                //$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
              }
            }



						if(appdataMi.QuestionText[a].Fields[j].Answer.AutoDisplay) {
							if(appdataMi.QuestionText[a].Fields[j].Answer.Correct.length > 1) {
								var answerlist = "";
								for(var i=0; i<appdataMi.QuestionText[a].Fields[j].Answer.Correct.length; i++) {
									answerlist += appdataMi.QuestionText[a].Fields[j].Answer.Correct[i];
									if(i !== appdataMi.QuestionText[a].Fields[j].Answer.Correct.length-1) {
										answerlist+= ", ";
									}
								}
								if(appdataMi.QuestionText[a].Fields[j].PreText !== "" && appdataMi.QuestionText[a].Fields[j].PreText !== "none") {
									$("#feedback-"+a).append("<p>Any of the following answers can be correct for "+appdataMi.QuestionText[a].Fields[j].PreText+" "+answerlist+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
								}
								else {
									$("#feedback-"+a).append("<p>Any of the following answers can be correct: "+answerlist+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
								}


							}
							else {
								if(appdataMi.QuestionText[a].Fields[j].PreText !== "" && appdataMi.QuestionText[a].Fields[j].PreText !== "none") {
									$("#feedback-"+a).append("<p>The correct answer for "+appdataMi.QuestionText[a].Fields[j].PreText+" is "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[0]+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
								}
								else {
									$("#feedback-"+a).append("<p>The correct answer is "+appdataMi.QuestionText[a].Fields[j].Answer.Correct[0]+" "+appdataMi.QuestionText[a].Fields[j].Units+".</p>");
								}
							}
						}

					}

					if(appdataMi.QuestionText[a].Fields[j].Answer.FeedbackText2 !== "" && appdataMi.QuestionText[a].Fields[j].Answer.FeedbackText2 !== "none") {
						$("#feedback-"+a).append("<p>"+appdataMi.QuestionText[a].Fields[j].Answer.FeedbackText2+"</p>");
					}

				}
				

				if(overallcorrect) {
					$("#feedbackicon-"+a).addClass("correct");
				}
				else {
					$("#feedbackicon-"+a).addClass("incorrect");
				}
			}
		}


		function resetAll() {
			
			$("#mi-table2").html('<tr><th id="column-question2">Question</th><th id="column-input2"> Answer</th><th id="column-feedback2"></th><th id="column-feedbackicon2"></th></tr>');
			initMI2(appdataMi);
			
		}


		function initMI2(data) {
			  for(var i=0; i<data.QuestionText.length; i++) {
				  var newrow = "<tr id='qindex-"+i+"'>";
				  newrow += "<td>"+data.QuestionText[i].Text+"</td><td>";
				  	for(var j=0; j<data.QuestionText[i].Fields.length; j++) {
					  if(data.QuestionText[i].Fields[j].PreText !== "" && data.QuestionText[i].Fields[j].PreText !== "none") {
						  newrow += data.QuestionText[i].Fields[j].PreText + " ";
					  }	
					  newrow += "<input id='input-"+i+"-"+j+"'";
						if(data.QuestionText[i].Fields[j].AnswerType == "number") {
							newrow+= " type='number'"
						}
						if($.isNumeric(data.QuestionText[i].Fields[j].MinAccepted)) {
							newrow+= " min='"+data.QuestionText[i].Fields[j].MinAccepted+"'";
						}
						if($.isNumeric(data.QuestionText[i].Fields[j].MaxAccepted)) {
							newrow+= " max='"+data.QuestionText[i].Fields[j].MaxAccepted+"'";
						}
					  newrow += ">";
					  if((data.QuestionText[i].Fields[j].Units !== null) && (data.QuestionText[i].Fields[j].Units !== "") && (data.QuestionText[i].Fields[j].Units !== "none")) {
						 newrow += " "+data.QuestionText[i].Fields[j].Units;
					  }	
					  if(j < (data.QuestionText[i].Fields.length - 1)) {
						  newrow += ", <br>";
					  }
					}
				  newrow += "</td><td><button class='btn btn-primary btn-check' id='submit-"+i+"' onClick='checkAnswer("+i+")'>Check Answer</button><div id='feedback-"+i+"'></div></td><td><div class='feedbackicon' id='feedbackicon-"+i+"'></div></td>";
				  newrow += "</tr>";
				  $("#mi-table2").append(newrow);
			  }	
		}

	
        $(document).ready(function () {
	$.getJSON( "data/"+datafilename, function( data ) {
			  appdataMi = data;
		  initMI2(appdataMi);
			});
        });
