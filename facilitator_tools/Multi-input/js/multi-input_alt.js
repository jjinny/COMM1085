// JavaScript Document// js for multi-input activity
// written by Nathan Gardi, 2017
	
		var mappdata;
	
		function checkAnswer(index) {
			$("#feedback-"+index).text("");
			
			var inputblank = false;
			for(var j=0; j<mappdata.Questions[index].Fields.length; j++){
				if($("#input-"+index+"-"+j).val() == "") {
					inputblank = true;
				}
			}
			
			if(inputblank) {
				$("#feedback-"+index).text("You must input a value.");
			}
			
			else {
				var overallcorrect = true;

				for(var j=0; j<mappdata.Questions[index].Fields.length; j++) {
					
					var thisval = $("#input-"+index+"-"+j).val();

					if(mappdata.Questions[index].Fields[j].AnswerType == "number") {
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


							if(mappdata.Questions[index].Fields[j].Answer.HasRange) {
								if(thisval >= mappdata.Questions[index].Fields[j].Answer.Correct[0] && thisval <= mappdata.Questions[index].Fields[j].Answer.Correct[1]) {
									$("#input-"+index+"-"+j).addClass("correct");
									//$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
								}
								else {
									overallcorrect = false;
									$("#input-"+index+"-"+j).addClass("incorrect");
									//$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
								}
								
								if(mappdata.Questions[index].Fields[j].Answer.AutoDisplay) {
								
									if(mappdata.Questions[index].Fields[j].PreText !== "" && mappdata.Questions[index].Fields[j].PreText !== "none") {
										$("#feedback-"+index).append("<p>The correct answer for "+mappdata.Questions[index].Fields[j].PreText+" is anywhere between "+mappdata.Questions[index].Fields[j].Answer.Correct[0]+" and "+mappdata.Questions[index].Fields[j].Answer.Correct[1]+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
									}
									else {
										$("#feedback-"+index).append("<p>The correct answer is anywhere between "+mappdata.Questions[index].Fields[j].Answer.Correct[0]+" and "+mappdata.Questions[index].Fields[j].Answer.Correct[1]+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
									}
								}
							}

							else {

                if(!mappdata.Questions[index].Fields[j].Answer.CaseSensitive) {
                	var matchfound = false;
                	for(var t=0; t < mappdata.Questions[index].Fields[j].Answer.Correct.length; t++) {
                		if (thisval.toLowerCase() === mappdata.Questions[index].Fields[j].Answer.Correct[t].toLowerCase()) {
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
                  if (mappdata.Questions[index].Fields[j].Answer.Correct.indexOf(thisval) > -1) {
                    $("#input-" + index + "-" + j).addClass("correct");
                    //$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
                  }
                  else {
                    overallcorrect = false;
                    $("#input-" + index + "-" + j).addClass("incorrect");
                    //$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
                  }
                }
								
								if(mappdata.Questions[index].Fields[j].Answer.AutoDisplay) {
									if(mappdata.Questions[index].Fields[j].Answer.Correct.length > 1) {
										var answerlist = "";
										for(var i=0; i<mappdata.Questions[index].Fields[j].Answer.Correct.length; i++) {
											answerlist += mappdata.Questions[index].Fields[j].Answer.Correct[i];
											if(i !== mappdata.Questions[index].Fields[j].Answer.Correct.length-1) {
												answerlist+= ", ";
											}
										}
										if(mappdata.Questions[index].Fields[j].PreText !== "" && mappdata.Questions[index].Fields[j].PreText !== "none") {
											$("#feedback-"+index).append("<p>Any of the following answers can be correct for "+mappdata.Questions[index].Fields[j].PreText+" "+answerlist+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
										}
										else {
											$("#feedback-"+index).append("<p>Any of the following answers can be correct: "+answerlist+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
										}


									}
									else {
										if(mappdata.Questions[index].Fields[j].PreText !== "" && mappdata.Questions[index].Fields[j].PreText !== "none") {
											$("#feedback-"+index).append("<p>The correct answer for "+mappdata.Questions[index].Fields[j].PreText+" is "+mappdata.Questions[index].Fields[j].Answer.Correct[0]+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
										}
										else {
											$("#feedback-"+index).append("<p>The correct answer is "+mappdata.Questions[index].Fields[j].Answer.Correct[0]+" "+mappdata.Questions[index].Fields[j].Units+".</p>");
										}
									}
								}

							}

							if(mappdata.Questions[index].Fields[j].Answer.FeedbackText !== "" && mappdata.Questions[index].Fields[j].Answer.FeedbackText !== "none") {
								$("#feedback-"+index).append("<p>"+mappdata.Questions[index].Fields[j].Answer.FeedbackText+"</p>");
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
			
			for(var a=0; a<mappdata.Questions.length; a++) {
				$("#feedback-"+a).html("");
				var overallcorrect = true;
				for(var j=0; j<mappdata.Questions[a].Fields.length; j++) {
					
					var thisval = $("#input-"+a+"-"+j).val();

					if(mappdata.Questions[a].Fields[j].AnswerType == "number") {
						thisval = parseFloat(thisval);
					}
					
					$("#input-"+a+"-"+j).attr("disabled","disabled");
					$("#submit-"+a).css("display","none");

					if(mappdata.Questions[a].Fields[j].Answer.HasRange) {
						if(thisval >= mappdata.Questions[a].Fields[j].Answer.Correct[0] && thisval <= mappdata.Questions[a].Fields[j].Answer.Correct[1]) {
							$("#input-"+a+"-"+j).addClass("correct");
							//$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
						}
						else {
							overallcorrect = false;
							$("#input-"+a+"-"+j).addClass("incorrect");
							//$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
						}

						if(mappdata.Questions[a].Fields[j].Answer.AutoDisplay) {

							if(mappdata.Questions[a].Fields[j].PreText !== "" && mappdata.Questions[a].Fields[j].PreText !== "none") {
								$("#feedback-"+a).append("<p>The correct answer for "+mappdata.Questions[a].Fields[j].PreText+" is anywhere between "+mappdata.Questions[a].Fields[j].Answer.Correct[0]+" and "+mappdata.Questions[a].Fields[j].Answer.Correct[1]+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
							}
							else {
								$("#feedback-"+a).append("<p>The correct answer is anywhere between "+mappdata.Questions[a].Fields[j].Answer.Correct[0]+" and "+mappdata.Questions[a].Fields[j].Answer.Correct[1]+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
							}
						}
					}

					else {

            if(!mappdata.Questions[a].Fields[j].Answer.CaseSensitive) {
              var matchfound = false;
              for(var t=0; t < mappdata.Questions[a].Fields[j].Answer.Correct.length; t++) {
                if (thisval.toLowerCase() === mappdata.Questions[a].Fields[j].Answer.Correct[t].toLowerCase()) {
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
              if (mappdata.Questions[a].Fields[j].Answer.Correct.indexOf(thisval) > -1) {
                $("#input-" + a + "-" + j).addClass("correct");
                //$("#input-"+index+"-"+j).css({"background-color":"#00b44f","color":"#FFFFFF"});
              }
              else {
                overallcorrect = false;
                $("#input-" + a + "-" + j).addClass("incorrect");
                //$("#input-"+index+"-"+j).css({"background-color":"#ec0044","color":"#FFFFFF"});
              }
            }



						if(mappdata.Questions[a].Fields[j].Answer.AutoDisplay) {
							if(mappdata.Questions[a].Fields[j].Answer.Correct.length > 1) {
								var answerlist = "";
								for(var i=0; i<mappdata.Questions[a].Fields[j].Answer.Correct.length; i++) {
									answerlist += mappdata.Questions[a].Fields[j].Answer.Correct[i];
									if(i !== mappdata.Questions[a].Fields[j].Answer.Correct.length-1) {
										answerlist+= ", ";
									}
								}
								if(mappdata.Questions[a].Fields[j].PreText !== "" && mappdata.Questions[a].Fields[j].PreText !== "none") {
									$("#feedback-"+a).append("<p>Any of the following answers can be correct for "+mappdata.Questions[a].Fields[j].PreText+" "+answerlist+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
								}
								else {
									$("#feedback-"+a).append("<p>Any of the following answers can be correct: "+answerlist+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
								}


							}
							else {
								if(mappdata.Questions[a].Fields[j].PreText !== "" && mappdata.Questions[a].Fields[j].PreText !== "none") {
									$("#feedback-"+a).append("<p>The correct answer for "+mappdata.Questions[a].Fields[j].PreText+" is "+mappdata.Questions[a].Fields[j].Answer.Correct[0]+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
								}
								else {
									$("#feedback-"+a).append("<p>The correct answer is "+mappdata.Questions[a].Fields[j].Answer.Correct[0]+" "+mappdata.Questions[a].Fields[j].Units+".</p>");
								}
							}
						}

					}

					if(mappdata.Questions[a].Fields[j].Answer.FeedbackText !== "" && mappdata.Questions[a].Fields[j].Answer.FeedbackText !== "none") {
						$("#feedback-"+a).append("<p>"+mappdata.Questions[a].Fields[j].Answer.FeedbackText+"</p>");
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
			
			$("#mi-table").html('<tr><th id="column-question">Question</th><th id="column-input"> Answer</th><th id="column-feedback"></th><th id="column-feedbackicon"></th></tr>');
			initMI(mappdata);
			
		}


		function initMI(mdata) {
			  for(var i=0; i<mdata.Questions.length; i++) {
				  var newrow = "<tr id='qindex-"+i+"'>";
				  newrow += "<td>"+mdata.Questions[i].Text+"</td><td>";
				  	for(var j=0; j<mdata.Questions[i].Fields.length; j++) {
					  if(mdata.Questions[i].Fields[j].PreText !== "" && mdata.Questions[i].Fields[j].PreText !== "none") {
						  newrow += mdata.Questions[i].Fields[j].PreText + " ";
					  }	
					  newrow += "<input id='input-"+i+"-"+j+"'";
						if(mdata.Questions[i].Fields[j].AnswerType == "number") {
							newrow+= " type='number'"
						}
						if($.isNumeric(mdata.Questions[i].Fields[j].MinAccepted)) {
							newrow+= " min='"+mdata.Questions[i].Fields[j].MinAccepted+"'";
						}
						if($.isNumeric(mdata.Questions[i].Fields[j].MaxAccepted)) {
							newrow+= " max='"+mdata.Questions[i].Fields[j].MaxAccepted+"'";
						}
					  newrow += ">";
					  if((mdata.Questions[i].Fields[j].Units !== null) && (mdata.Questions[i].Fields[j].Units !== "") && (mdata.Questions[i].Fields[j].Units !== "none")) {
						 newrow += " "+mdata.Questions[i].Fields[j].Units;
					  }	
					  if(j < (mdata.Questions[i].Fields.length - 1)) {
						  newrow += ", <br>";
					  }
					}
				  newrow += "</td><td><button class='btn btn-primary btn-check' id='submit-"+i+"' onClick='checkAnswer("+i+")'>Check Answer</button><div id='feedback-"+i+"'></div></td><td><div class='feedbackicon' id='feedbackicon-"+i+"'></div></td>";
				  newrow += "</tr>";
				  $("#mi-table").append(newrow);
			  }	
		}

	
        $(document).ready(function () {
	$.getJSON( "data/"+datafilename, function( mdata ) {
			  mappdata = mdata;
		  initMI(mappdata);
			});
        });
