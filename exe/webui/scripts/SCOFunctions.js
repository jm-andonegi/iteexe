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

// Contains all the information for score and interaction management
var exe_SCORM_data_class = function () {
	this.numQuestions = 0;
	this.rawScore = 0;
	this.actualScore = 0;
	this.idevice_data_list = [];
	this.score_msg = "";
	this.pass_rate = 50;
};

function calcScore()
{
	return exe_SCORM_data.calcScore();
}

var exe_SCORM_data = new exe_SCORM_data_class();

exe_SCORM_data_class.calcScore = function(){
	// The student has stopped here.
    computeTime();
    exe_SCORM_data.numQuestions = 0;
    exe_SCORM_data.rawScore = 0;
	// Calculate score
	for(var i=0; i < exe_SCORM_data.idevice_data_list.length; i++)
	{
		exe_SCORM_data.idevice_data_list[i].calcScore();
	}
	exe_SCORM_data.actualScore = Math.round(exe_SCORM_data.rawScore / exe_SCORM_data.numQuestions * 100);
	alert(exe_SCORM_data.score_msg + " " + exe_SCORM_data.actualScore + "%");

	scorm.SetScoreRaw(exe_SCORM_data.actualScore+"" );
	scorm.SetScoreMax("100");
          
	var mode = scorm.GetMode();

	if ( mode != "review"  &&  mode != "browse" ){
		if ( exe_SCORM_data.actualScore < exe_SCORM_data.pass_rate )
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
};


// Contains all de data for quiztest idevices

var quiztest_data = function (formid) {
	this.formid = formid;
	this.question_list = [];
};

quiztest_data.calcScore = function(){

	// Disable the form submission
	quizform = document.getElementById(this.formid);
	quizform.submitB.disabled = true;

	// Calculate score
	for(var i=0; i < this.question_list.length; i++)
	{
		question_list[i].calcScore(i);
	}

	
};

var quiztest_data_question = function (id,type,correct_answer) {
  this.id = id;
  this.type = type;
  this.correct_answer = correct_answer;
};


quiztest_data_question.calcScore = function(i){
    exe_SCORM_data.numQuestions++;
		
	// Save interaction information
	interaction_id = "cmi.interactions." + i + ".id";
	scorm.SetInteractionValue(interaction_id, this.id);
	interaction_type = "cmi.interactions." + i + ".type";
	scorm.SetInteractionValue(interaction_type,this.type);
	interaction_pattern = "cmi.interactions." + i + ".correct_responses.0.pattern";
	scorm.SetInteractionValue(interaction_pattern,"0");
	
	// Get the answer
	var student_response;
	var options = document.getElementsByName(this.id);
	for (var j=0; j < options.length; j++)
	{
		if (options[j].checked)
		{
			student_response = options[j].value;
			interaction_student_response = "cmi.interactions."+i+".student_response";
			scorm.SetInteractionValue(interaction_student_response,student_response);
			interaction_result = "cmi.interactions." + i + ".result";
			if(options[j].value == this.correct_answer)
			{
				scorm.SetInteractionValue(interaction_result,"correct");
				exe_SCORM_data.rawScore++;
				break;
			}
			else
			{
				scorm.SetInteractionValue(interaction_result,"wrong");
			}
		}
	}
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

	exe_SCORM_data.numQuestions = 0;
	exe_SCORM_data.rawScore = 0;
	exe_SCORM_data.actualScore = 0;
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
