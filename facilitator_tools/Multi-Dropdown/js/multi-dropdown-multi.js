		var appdata;

		function checkAnswer(a, index) {
			$("#feedback-" + a + "-" + index).text("");

			var thisval = $("#sel-" + a + "-" + index).val();
			var thiscorrect = false;

			var inputblank = false;
			if ($("#sel-" + a + "-" + index).val() == "" || $("#sel-" + a + "-" + index).val() == -1) {
				inputblank = true;
			}

			if (inputblank) {
				$("#feedback-" + a + "-" + index).text("You must select a response.");
			} else {

				$("#submit-" + a + "-" + index).css("display", "none");
				$("#sel-" + a + "-" + index).attr("disabled", "disabled");

				if (!appdata.Activities[a].Questions[index].Answer.AutoDisplay) {
					$("#feedback-" + a + "-" + index).append(appdata.Activities[a].Questions[index].Answer.FeedbackText);
				}

				if (thisval == appdata.Activities[a].Questions[index].Answer.Correct[0]) {
					thiscorrect = true;
				}

				if (thiscorrect) {
					$("#sel-" + a + "-" + index).addClass("correct");
					$("#feedbackicon-" + a + "-" + index).addClass("correct");
				} else {
					$("#sel-" + a + "-" + index).addClass("incorrect");
					$("#feedbackicon-" + a + "-" + index).addClass("incorrect");
				}

			}
		}

		function shuffle(array) {
			var currentIndex = array.length,
				temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}

			return array;
		}



		function resetAll(a) {

			$("#mi-table-" + a).html('<tr><th id="column-question-' + a + '">' + appdata.Activities[(a - 1)].TitleCol1 + '</th><th id="column-input-' + a + '">' + appdata.Activities[(a - 1)].TitleCol2 + '</th><th id="column-feedback-' + a + '">Feedback</th><th id="column-feedbackicon-' + a + '"></th></tr>');
			initMI(appdata);

		}



		function setupHTML(data) {
			for (var a = 0; a < data.Activities.length; a++) {

				var inithtml = '<button class="btn btn-large prime-bg btn-check" id="submit-all-' + (a + 1) + '" onclick="resetAll(' + (a + 1) + ')">Reset Activity</button><table id="mi-table-' + (a + 1) + '" class="table mi-table"><tr><th id="column-question-' + (a + 1) + '">' + data.Activities[a].TitleCol1 + '</th><th id="column-input-' + (a + 1) + '">' + data.Activities[a].TitleCol2 + '</th><th id="column-feedback-' + (a + 1) + '">Feedback</th><th id="column-feedbackicon-' + (a + 1) + '"></th></tr></table>';
				$("#" + data.Activities[a].ContainerID).append(inithtml);
			}
		}



		function initMI(data) {

			for (var a = 0; a < data.Activities.length; a++) {


				if (data.Activities[a].Randomize) {
					data.Activities[a].Questions = shuffle(data.Activities[a].Questions);
					data.Activities[a].Randomize = false;
				}

				for (var i = 0; i < data.Activities[a].Questions.length; i++) {
					var newrow = "<tr id='qindex-" + a + "-" + i + "'>";
					newrow += "<td>" + data.Activities[a].Questions[i].Text + "</td><td>";
					newrow += '<div class="form-group" style="width: 150px;"><select class="form-control" id="sel-' + a + "-" + i + '">';
					newrow += '<option value="-1"></option>'
					for (var j = 0; j < data.Activities[a].Questions[i].Options.length; j++) {
						newrow += '<option value="' + data.Activities[a].Questions[i].Options[j].Val + '">' + data.Activities[a].Questions[i].Options[j].Text + '</option>';
					}
					newrow += '</select></div>';
					newrow += "</td><td class='col-fb'><button class='btn btn-primary btn-check' id='submit-" + i + "' onClick='checkAnswer(" + a + "," + i + ")'>Check Answer</button><div id='feedback-" + a + "-" + i + "'></div></td><td><div class='feedbackicon' id='feedbackicon-" + a + "-" + i + "'></div></td>";
					newrow += "</tr>";

					$("#mi-table-" + (a + 1)).append(newrow);
				}

			}

		}


		$(document).ready(function () {
			$.getJSON(datafilepath, function (data) {
				appdata = data;
				setupHTML(appdata);
				initMI(appdata);
			});
		});
