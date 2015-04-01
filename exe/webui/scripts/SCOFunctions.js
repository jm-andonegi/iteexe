/*******************************************************************************
** 
** Filename: SCOFunctions.js
**
** File Description: adaptation of SCOFunctions.js file from ADL Technical Team
** SCOFunctions.js works with SCORM12 and SCOFunctions2004.js with SCORM2004
** using SCORM_API_wrapper.js
**
** Adaptation to eXeLearning: José Miguel Andonegi jm.andonegi@gmail.com
**
********************************************************************************
**
This software is provided "AS IS," without a warranty of any kind.  
ALL EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING 
ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR 
NON-INFRINGEMENT, ARE HEREBY EXCLUDED.  ADL AND ITS LICENSORS SHALL NOT BE LIABLE 
FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR 
DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES.  IN NO EVENT WILL ADL OR ITS LICENSORS 
BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT, INDIRECT, SPECIAL, 
CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER CAUSED AND REGARDLESS OF THE 
THEORY OF LIABILITY, ARISING OUT OF THE USE OF OR INABILITY TO USE SOFTWARE, EVEN IF 
ADL HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

*****************************************************************************
*SCOFunctions2004.js code is licensed under the Creative Commons
Attribution-ShareAlike 3.0 Unported License.

To view a copy of this license:

     - Visit http://creativecommons.org/licenses/by-sa/3.0/ 
     - Or send a letter to
            Creative Commons, 444 Castro Street,  Suite 900, Mountain View,
            California, 94041, USA.

The following is a summary of the full license which is available at:

      - http://creativecommons.org/licenses/by-sa/3.0/legalcode

*****************************************************************************

Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)

You are free to:

     - Share : to copy, distribute and transmit the work
     - Remix : to adapt the work

Under the following conditions:

     - Attribution: You must attribute the work in the manner specified by 
       the author or licensor (but not in any way that suggests that they 
       endorse you or your use of the work).

     - Share Alike: If you alter, transform, or build upon this work, you 
       may distribute the resulting work only under the same or similar 
       license to this one.

With the understanding that:

     - Waiver: Any of the above conditions can be waived if you get permission 
       from the copyright holder.

     - Public Domain: Where the work or any of its elements is in the public 
       domain under applicable law, that status is in no way affected by the license.

     - Other Rights: In no way are any of the following rights affected by the license:

           * Your fair dealing or fair use rights, or other applicable copyright 
             exceptions and limitations;

           * The author's moral rights;

           * Rights other persons may have either in the work itself or in how the 
             work is used, such as publicity or privacy rights.

     - Notice: For any reuse or distribution, you must make clear to others the 
               license terms of this work.

****************************************************************************/
var startDate;
var exitPageStatus;

// Creating shortcut for less verbose code
var scorm = pipwerks.SCORM;

// This object will manage score related issues (including SCORM)
var exe_score_manager = null;

function calcScore()
{
	return exe_score_manager.calcScore();
}


// This class will manage all score related task, including:
//		· Score calculation
//		· SCORM related issues (saving score, recording interactions, ...)
//		· Form management in score related behaviour.
var smc_page = function (for_SCORM) {
	this.numQuestions = 0;
	this.rawScore = 0;
	this.actualScore = 0;
	this.idevice_data_list = [];
	if (for_SCORM == true)
		this.for_SCORM = true;
	else
		this.for_SCORM = false;
		
	this.score_msg = "";
	this.pass_rate = 50;
	this.interaction_id = 0;

	this.onLoad = function()
	{
		for(var i=0; i < this.idevice_data_list.length; i++)
		{
			this.idevice_data_list[i].onLoad();
		}		
	};

	this.calcScore = function(){
		if (this.for_SCORM == true)
		{
			// The student has stopped here.
			computeTime();
		}
		this.numQuestions = 0;
		this.rawScore = 0;
		// Calculate score
		for(var i=0; i < this.idevice_data_list.length; i++)
		{
			this.idevice_data_list[i].calcScore();
		}
		this.actualScore = Math.round(this.rawScore / this.numQuestions * 100);

		// Cambiar esto para poner como la nueva cadena
		alert(this.score_msg + " " + this.actualScore + "%");

		if (this.for_SCORM == true)
		{
			scorm.SetScoreRaw(this.actualScore+"" );
			scorm.SetScoreMax("100");
			  
			var mode = scorm.GetMode();

			if ( mode != "review"  &&  mode != "browse" ){
				if ( this.actualScore < this.pass_rate )
				{
					scorm.SetCompletionStatus("incomplete");
					scorm.SetSuccessStatus("failed");
				}
				else
				{
					scorm.SetCompletionStatus("completed");
					scorm.SetSuccessStatus("passed");
				}
				scorm.SetExit("");
				}

			exitPageStatus = true;

			scorm.save();

			scorm.quit();
		}
	};
};


// Contains all de data for quiztest idevices
var smc_quiztest = function (formid) {
	this.formid = formid;
	this.question_list = [];

	this.onLoad = function()
	{
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].onLoad();
		}		
	};

	this.calcScore = function(){
		// Disable the form submission
		document.getElementById("quizForm"+this.formid).submitB.disabled = true;

		// Calculate score
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].calcScore();
		}		
	};
};


var smc_quiztest_question = function (id,correct_answer) {
	this.id = id;
	this.type = "choice";
	this.correct_answer = correct_answer;

	this.onLoad = function()
	{
		return "";
	};

	this.calcScore = function(){
		exe_score_manager.numQuestions++;
		
		// Get the answer
		var student_response;
		var options = document.getElementsByName(this.id);
		for (var j=0; j < options.length; j++)
		{
			if (options[j].checked)
			{
				student_response = options[j].value;
				if(student_response == this.correct_answer)
				{
					exe_score_manager.rawScore++;
				}
				break;
			}
		}
		if(exe_score_manager.for_SCORM==true)
		{
			this.saveInteractionData();
		}
	};

	this.saveInteractionData = function(){
		var i = exe_score_manager.interaction_id;
		// Save interaction information
		scorm.SetInteractionValue("cmi.interactions." + i + ".id", this.id);
		scorm.SetInteractionValue("cmi.interactions." + i + ".type",this.type);
		scorm.SetInteractionValue("cmi.interactions." + i + ".correct_responses.0.pattern","0");
		
		// Get the answer
		var student_response;
		var options = document.getElementsByName(this.id);
		for (var j=0; j < options.length; j++)
		{
			if (options[j].checked)
			{
				student_response = options[j].value;
				scorm.SetInteractionValue("cmi.interactions."+i+".student_response",student_response);
				interaction_result = "cmi.interactions." + i + ".result";
				if(student_response == this.correct_answer)
				{
					scorm.SetInteractionValue(interaction_result,"correct");
				}
				else
				{
					scorm.SetInteractionValue(interaction_result,"wrong");
				}
				break;
			}
		}
		exe_score_manager.interaction_id++;
	};
};

var smc_cloze = function (formid) {
	this.formid = formid;

	this.onLoad = function()
	{
        var x = document.getElementsByName("submit"+this.formid);
        var i;
        for (i = 0; i < x.length; i++) 
        {
            x[i].style.visibility = "hidden";
        }
	};

	this.calcScore = function(){
		// Call 
		clozeSubmit(this.formid);
	};
}

var smc_lista = function (formid) {
	this.formid = formid;

	this.onLoad = function()
	{
        document.getElementById("getScore"+this.formid).style.visibility = "hidden";
        var x = document.getElementsByName("feedback"+this.formid);
        var i;
        for (i = 0; i < x.length; i++) 
        {
            x[i].style.visibility = "hidden";
        }
	};

	this.calcScore = function(){
		// Call 
		showClozeScore(this.formid,1);
	};
}

// Contains all de data for multichoice idevices
var smc_multichoice = function (id) {
	this.id = id;
	this.question_list = [];
	this.onLoad = function()
	{
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].onLoad();
		}		
	};

	this.calcScore = function(){
		// Calculate score
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].calcScore();
		}		
	};
};

var smc_multichoice_question = function (id,correct_answer) {
	this.id = id;
	this.ideviceid = id.substr(0,id.indexOf("_"));
	this.correct_answer = correct_answer;
	this.onLoad = function()
	{
		// Get the answer
		var options = document.getElementsByName("option"+this.id);
		for (var j=0; j < options.length; j++)
		{
			// Remove onclick function to avoid student viewing the feedback. The feedback will be shown after submission
			options[j].setAttribute ("onclick", null);
		}
	};

	this.calcScore = function(){
		exe_score_manager.numQuestions++;
		
		// Get the answer
		var options = document.getElementsByName("option"+this.id);
		var onclickevent;
		for (var j=0; j < options.length; j++)
		{
			if (options[j].checked)
			{
				if(j == this.correct_answer)
				{
					exe_score_manager.rawScore++;
				}
				// Show the feedback of the selected option
				getFeedback(j,options.length,this.id,"multi");
			}
			// Restore the event of the option (not working: ASK ABOUT This)
			options[j].addEventListener("click", function(){getFeedback(j,options.length,this.ideviceid,'multi');});
		}
		
		// Save SCORM interaction data
		if(exe_score_manager.for_SCORM==true)
		{
			this.saveInteractionData();
		}
	};
	this.saveInteractionData = function()
	{
		// Pending task
		return "";
	};
};

// Contains all de data for multiselect idevices
var smc_multiselect = function (id) {
	this.id = id;
	this.question_list = [];
	this.onLoad = function()
	{
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].onLoad();
		}		
	};
	this.calcScore = function(){
		// Calculate score
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].calcScore();
		}		
	};
};

var smc_multiselect_question = function (id) {
	this.id = id;
	this.option_list = [];
	this.onLoad = function()
	{
		// Disable the form submission. Find form by name. Shouldn't it be by id?
		var forms = document.getElementsByName("multi-select-form-" + this.id);
		var i;
		for (i = 0; i < forms.length; i++) 
		{
			forms[i].submitSelect.style.visibility = "hidden";
		}
	};

	this.calcScore = function(){		
		// Iterate through the options
		var option, optionid, students_answer, correct_answer;
		for (var i = 0; i < this.option_list.length; i++)
		{
			// We consider each option as a question
			exe_score_manager.numQuestions++;

			optionid = "op" + this.id + i;
			students_answer = document.getElementById(optionid).checked;
			if(document.getElementById(optionid).value == "True")
			{
				correct_answer = true;
			}else{
				correct_answer = false;
			}
			
			if (students_answer == correct_answer)
			{
				exe_score_manager.rawScore++;
			}
		}
		
		// Enable the form submission. Find form by name. Shouldn't it be by id?
		var forms = document.getElementsByName("multi-select-form-"+this.id);
		var i;
		for (i = 0; i < forms.length; i++) 
		{
			// Show the button
			forms[i].submitSelect.style.visibility = "visible";
			// Show the feedback
			showFeedback(forms[i].submitSelect,this.option_list.length,this.id);
		}
				
		// Save SCORM interaction data
		if(exe_score_manager.for_SCORM==true)
		{
			this.saveInteractionData();
		}
	};

	this.saveInteractionData = function()
	{
		// Pending task
		return "";
	};
};

var smc_multiselect_question_option = function (id,correct_option) {
	this.id = id;
	this.correct_option = correct_option;
	
	this.onLoad = function()
	{
	};

	this.calcScore = function(){
		if(exe_score_manager.for_SCORM==true)
		{
			this.saveInteractionData();
		}
	};

	this.saveInteractionData = function()
	{
		// Pending task
		return "";
	};
};

// Contains all de data for truefalse idevices
var smc_truefalse = function (id) {
	this.id = id;
	this.question_list = [];
	this.onLoad = function()
	{
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].onLoad();
		}		
	};
	this.calcScore = function(){
		// Calculate score
		for(var i=0; i < this.question_list.length; i++)
		{
			this.question_list[i].calcScore();
		}		
	};
};

// Contains all de data for truefalse questions
var smc_truefalse_question = function (id,isCorrect) {
	this.id = id;
	this.ideviceid = id.substr(0,id.indexOf("_"));
	this.isCorrect = isCorrect;
	this.onLoad = function()
	{
		// Get the answer
		var options = document.getElementsByName("option"+this.id);
		for (var j=0; j < options.length; j++)
		{
			// Remove onclick function to avoid student viewing the feedback. The feedback will be shown after submission
			options[j].setAttribute ("onclick", null);
		}
	};
	this.calcScore = function(){
		exe_score_manager.numQuestions++;
		
		// Get the answer
		var options = document.getElementsByName("option"+this.id);
		var onclickevent;
		// Option 0: true Option 1: false
		if(options.length == 2)
		{
			// User selected True
			if(options[0].checked == true)
			{
				if(this.isCorrect == true)
				{
					exe_score_manager.rawScore++;
				}
				// Show feedback
				getFeedback(0,2,this.id,'truefalse');
			}
			else // User selected False
			{
				if(this.isCorrect == false)
				{
					exe_score_manager.rawScore++;
				}
				// Show feedback
				getFeedback(1,2,this.id,'truefalse');
			}
			// Restore onclick event function to both options
			options[0].addEventListener("click", function(){getFeedback(0,options.length,this.ideviceid,'truefalse');});
			options[1].addEventListener("click", function(){getFeedback(1,options.length,this.ideviceid,'truefalse');});
		}
	};
};


function loadPage()
{
	var result = scorm.init();
	
	var status = scorm.GetCompletionStatus();

	if (status == "not attempted")
	{
		// the student is now attempting the lesson
		scorm.SetCompletionStatus("unknown");
	}

	exitPageStatus = false;
	startTimer();
}


function startTimer()
{
   startDate = new Date().getTime();
}

function computeTime()
{
   if ( startDate != 0 )
   {
      var currentDate = new Date().getTime();
      var elapsedMiliSeconds = (currentDate - startDate);
      var formattedTime = pipwerks.UTILS.convertTotalMiliSeconds(elapsedMiliSeconds);
   }
   else
   {
      formattedTime = pipwerks.UTILS.convertTotalMiliSeconds(0);
   }

   scorm.SetSessionTime(formattedTime);
}

function doBack()
{
   scorm.SetExit("suspend");

   computeTime();
   exitPageStatus = true;
   
   var result;

   result = scorm.save();

	// NOTE: LMSFinish will unload the current SCO.  All processing
	//       relative to the current page must be performed prior
	//		 to calling LMSFinish.   
   
   result = scorm.quit();
}

function doContinue( status )
{
	// Reinitialize Exit to blank
	scorm.SetExit("");

	var mode = scorm.GetMode();

	if ( mode != "review"  &&  mode != "browse" )
	{ 
		scorm.SetCompletionStatus(status);
	}

	computeTime();
	exitPageStatus = true;

	var result;
	result = scorm.save();
	// NOTE: LMSFinish will unload the current SCO.  All processing
	//       relative to the current page must be performed prior
	//		 to calling LMSFinish.   

	result = scorm.quit();
}

function doQuit()
{
	scorm.SetExit("suspend");

	computeTime();
	exitPageStatus = true;

	var result;

	result = scorm.save();

	// NOTE: LMSFinish will unload the current SCO.  All processing
	//       relative to the current page must be performed prior
	//		 to calling LMSFinish.   

	result = scorm.quit();
}

/*******************************************************************************
** The purpose of this function is to handle cases where the current SCO may be 
** unloaded via some user action other than using the navigation controls 
** embedded in the content.   This function will be called every time an SCO
** is unloaded.  If the user has caused the page to be unloaded through the
** preferred SCO control mechanisms, the value of the "exitPageStatus" var
** will be true so we'll just allow the page to be unloaded.   If the value
** of "exitPageStatus" is false, we know the user caused to the page to be
** unloaded through use of some other mechanism... most likely the back
** button on the browser.  We'll handle this situation the same way we 
** would handle a "quit" - as in the user pressing the SCO's quit button.

** eXe team: we've added this doLMSSetValue here to get tracking working with Moodle
** cmi.core.lesson_status is now set to 'completed' whenever a sco is unloaded.
** brent simpson. July 7, 2005. exe@auckland.ac.nz
*******************************************************************************/
function unloadPage()
{
	//console.trace('exitPageStatus'+exitPageStatus);

	var status;
	if (exitPageStatus != true)
	{
		status = scorm.GetCompletionStatus();
		// In SCORM12, information about completion and success is stored in the same place (cmi.core.lesson_status)
		if (status!="passed" && status!="failed")
		{
			scorm.SetCompletionStatus("completed");
		}
		doQuit();
	}

	// NOTE:  don't return anything that resembles a javascript
	//		  string from this function or IE will take the
	//		  liberty of displaying a confirm message box.
}


function goBack() {
	pipwerks.nav.goBack();
}

function goForward() {
	pipwerks.nav.goForward();
}
