/* Nathan Kanigsberg
Project 2 - Juno College JavaScript Course
August 12, 2020 */

/** @namespace trivia */
const trivia = {};

/** @type {string} trivia endpoint url*/
trivia.openTriviaBaseUrl = `https://opentdb.com/api.php?`;

/** @type {string} trivia categories url */
trivia.categoriesUrl = `https://opentdb.com/api_category.php`;

/** @type {array} array of question objects pulled from API */
trivia.questions = [];

/** @type {array} array of categories pulled from API*/
trivia.categories = [];

/** @type {number} the index of the current question */
trivia.currentIndex = 0;

/** @type {object} the current question object */
trivia.currentQuestion = {};

/** @type {number} number of correct answers */
trivia.correct = 0;

/** @type {number} number of incorrect answers */
trivia.incorrect = 0;

/** @type {number} number of remaining questions */
trivia.remaining = 0;

/** @type {number} the timer */
trivia.timer;


/**
 * Update score display
 */
trivia.updateScore = function() {
	$('div.score-timer span.score-correct').text(trivia.correct);
	$('div.score-timer span.score-incorrect').text(trivia.incorrect);
	$('div.score-timer span.score-remaining').text(trivia.remaining);
};


/**
 * Display loading symbol to user while waiting for API
 * @param {boolean} isLoading - true if API data still loading, false otherwise
 */
trivia.loading = function(isLoading) {
	if (isLoading) {
		$('div.setup').append('<div class="loading-bar"></div>');
	} else {
		$('div.setup').find('div.loading-bar').remove();
	}
};


/** 
 * Setup trivia game based on user input 
 */
trivia.setup = async function() {
	// add number next to slider
	$('div.setup span.range-value').text(`${$('div.setup input[type="range"]').val()}`);
	
	/** @type {JQuery} category select element */
	const $categoriesSelect = $('div.setup select#category');

	/** @type {object} category data from API */
	const categories = await $.ajax(trivia.categoriesUrl);

	// set global variable with all potential categories
	trivia.categories = categories.trivia_categories.slice();

	// append category options to html
	trivia.categories.forEach(element => {
		$categoriesSelect.append(`<option value="${element.id}">${element.name}</option>`);
	});

	// update number next to slider
	$('div.setup input[type="range"]').on('input', function() {
		$('div.setup span.range-value').text(`${$(this).val()}`);
	});

	// start getting input from user
	trivia.getInput();
}


/**
 * Get input from user and send request for trivia data on form submit
 * @param {JQuery} $button - the button to listen to
 */
trivia.getInput = function($button = $('div.setup button')) {
	$button.on('click', function() {
		// reset previous game
		trivia.reset();

		// indicate loading to user
		trivia.loading(true);

		// change button text
		$('div.setup button').text('Start Again');
		
		/** @type {number} */
		const numQuestions = ($('input#numQuestions').val());
		/** @type {number} */
		const category = ($('select#category option:selected').val());
		/** @type {string} */
		const difficulty = ($('select#difficulty option:selected').val());
		/** @type {string} */
		const type = ($('select#type option:selected').val());

		// send API request
		trivia.getTrivia(numQuestions, category, difficulty, type);
	});
};



/**
 * Get trivia data from API
 * @param {number} amount
 * @param {number} category 
 * @param {string} difficulty 
 * @param {string} type 
 */
trivia.getTrivia = async function(amount, category, difficulty, type) {
	try {
		/** @type {object} the API response object */
		const response = await $.ajax(`${trivia.openTriviaBaseUrl}amount=${amount}&category=${category}&difficulty=${difficulty}&type=${type}`);

		// check for errors
		trivia.responseError(response.response_code);
		
		// set questions array to results
		trivia.questions = response.results;

		// update remaining questions
		trivia.remaining = trivia.questions.length;

		// update score
		trivia.updateScore();

		// remove loading bar
		trivia.loading(false);

		// set the timer
		trivia.setTimer(15);

		// Display question to user
		trivia.displayQuestion();

		// display answers to user
		trivia.displayAnswers();

	} catch(err) {
		console.log(err);
	};
};


/** 
 * Display warning to user if an error code recieved from API 
 * @param {number} code
 */
trivia.responseError = function(code) {
	if (code === 1) {
		$('div.setup').append('<p class="message incorrect">Not enough matching questions in database</p>');
	} else if (code === 2) {
		$('div.setup').append('<p class="message incorrect">Error - try again</p>');
	}
}


/** 
 * Display question to user 
 */
trivia.displayQuestion = function() {
	// set current quesion
	trivia.currentQuestion = trivia.questions[trivia.currentIndex];
	
	// append question to html
	$('div.question').append(`
		<p>${trivia.currentQuestion.question}</p>
	`);
};


/**
 * Randomize the array of answers passed as argument
 * @param {array} answers 
 */
trivia.randomizeAnswers = function(answers) {
	const answersClone = answers.slice();
	let randomizedAnswers = [];

	// loop through answers and append random answer to new array
	for (let i in answers) {
		const rand = Math.floor(Math.random() * answersClone.length);
		randomizedAnswers.push(answersClone[rand]);
		answersClone.splice(rand, 1);
	}

	// return the new array
	return randomizedAnswers;
};


/** 
 * Display answer to user and listen for submit
 */
trivia.displayAnswers = function() {
	/** @type {JQuery} the div to generate answers within */
	const $answerOptions = $('div.answer div.answer-options');
		/** @type {JQuery} the div to generate buttons (& warnings) within */
	const $answerButton = $('div.answer div.answer-button');

	/** @type {array} array containing (initially) the incorrect answers */
	let answers = trivia.currentQuestion.incorrect_answers.slice();
		
	//add correct answers to array
	answers.push(trivia.currentQuestion.correct_answer);

	/** @type {array} array of randomized answers */
	const randomizedAnswers = trivia.randomizeAnswers(answers);

	// set correct index
	trivia.correctIndex = randomizedAnswers.indexOf(trivia.currentQuestion.correct_answer);

	// append each answer to html
	for (let i in randomizedAnswers) {
		let questionHTML = ``;
		questionHTML += `
			<span class="answer-option">
				<input type="radio" name="answer" id="answer-${i}" value="${i}">
				<label for="answer-${i}">${randomizedAnswers[i]}</label>
			</span>`;

		// append answers to html
		$answerOptions.append(questionHTML);
	};

	// append answer button to html
	$answerButton.append(`<button type="submit" class="submit">Submit</button>`);

	// listen for input and check answers
	trivia.checkAnswers($answerOptions, $answerButton);
};


/**
 * Listen for input, check answers, and display result
 * @param {JQuery} $answerOptions - the answers
 * @param {JQuery} $answerButton - button & warnings
 */
trivia.checkAnswers = function($answerOptions, $answerButton) {
	/** @type {boolean} true if an answer is checked, false otherwise */
	let buttonChecked = false;
	
	// set buttonChecked to true on click of an answer
	$('div.answer-options').on('click', 'input', function() {
		buttonChecked = true;
	});

	// listen for answer submit
	$('div.answer button.submit').on('click', function() {
		
		// remove warnings
		$('div.answer-button').find('p').remove();
		
		if (buttonChecked) {
			// reset timer
			clearInterval(trivia.timer);
			trivia.setTimer(0);

			/** @type {JQuery} the checked answer input element */
			const $answer = $answerOptions.find('input:checked');
		
			// if answer is correct
			// @ts-ignore
			if (parseInt($answer.val()) === trivia.correctIndex) {
				// increment correct answers
				trivia.correct++;

				// append 'correct' message to html
				$answerButton.append('<p class="message correct">Correct!</p>')

			} else { //if answer is incorrect
				// increment incorrect answers
				trivia.incorrect++;

				// colour incorrect guess
				$answer.parent('span').addClass('incorrect');

				// append 'incorrect' message to html
				$answerButton.append('<p class="message incorrect">Sorry, wrong answer</p>')
			}

			// colour correct answer
			$(`div.answer input[value="${trivia.correctIndex}"]`).parent('span').addClass('correct');

			// decrement remaining questions
			trivia.remaining--;

			// update score
			trivia.updateScore();

			// remove button 
			$('div.answer button').remove();

			// if no more questions
			if (trivia.remaining === 0) {
				
				// empty any messages
				$answerButton.empty();

				// append 'play again' button and message to html
				$answerButton.append(`
					<button type="submit" class="play-again">Play Again</button>
					<div class="game-over">
						<h4>Game Over!</h4>
						<p>You got <span class="correct">${trivia.correct}</span> correct and <span class="incorrect">${trivia.incorrect}</span> incorrect. Play Again?
					</div>
					`);
		
				// allow play again button to trigger new game
				trivia.getInput($('div.answer-button').find('button'));

			} else { //if there are still more questions
				trivia.nextQuestion();
			};

		} else { //if a button is not checked
			// append 'pick answer' message to html
			$answerButton.append('<p class="message incorrect">Pick an answer!</p>')
		};
	});
};


/** 
 * Move to next question 
 */
trivia.nextQuestion = function() {
	/** @type {JQuery} the answer form */
	const $answer = $('div.answer form');
	/** @type {JQuery} the answer button & warning div*/
	const $answerButton = $('div.answer-button');

	// add 'next question' button to html
	$answerButton.prepend(`<button type="submit">Next Question</button>`);

	// on click of 'next question' button
	$answer.on('click', 'button', function() {
		// clean up existing html
		trivia.cleanUp();

		// increment current question index
		trivia.currentIndex++;

		// display next question
		trivia.displayQuestion();

		// display answers
		trivia.displayAnswers();

		// start timer
		trivia.setTimer(15);

		// remove listener
		$answer.off();
	});
};


/**
 * Sets the timer
 * @param {number} time - how long to set the timer in seconds
 */
trivia.setTimer = function(time) {
	/** @type {JQuery} the timer */
	const $timer = $('div.score-timer span.timer-value');

	/** @type {number} the time remaining */
	let seconds = time;

	// set colour to green
	$timer.removeClass('red yellow').addClass('green');

	// if there is still time left
	if (time > 0) {
		$timer.text(seconds);
		trivia.timer = setInterval(function() {
			seconds--;
			$timer.text(seconds);

			// colour timer based on time left
			if ( ( seconds / time ) < 0.33 ) {
				$timer.removeClass('green yellow').addClass('red');
			} else if ( ( seconds / time ) < 0.67 ) {
				$timer.removeClass('green red').addClass('yellow');
			} else {
				$timer.removeClass('yellow red').addClass('green');
			};

			// if time is up
			if (seconds === 0) {
				clearInterval(trivia.timer);
				$timer.text('Time\'s up!');

				// lose round
				trivia.incorrect++;
				trivia.remaining--;

				// update score
				trivia.updateScore();

				// colour correct answer
				$(`div.answer input[value="${trivia.correctIndex}"]`).parent('span').addClass('incorrect');

				// append 'out of time' message to html
				$('.answer-button').append('<p class="message incorrect">Out of time!</p>')

				// remove button 
				$('div.answer button').remove();

				// prepare next question
				trivia.nextQuestion();
			};
		}, 1000);

	 } else { // if there is no time left
		$timer.text('--');
		clearInterval(trivia.timer);
	};
};


/** Remove warnings, question and answers */
trivia.cleanUp = function() {
	$('div.question').empty();
	$('div.answer-options').empty();
	$('div.answer-button').empty()
	$('div.setup').find('p.message').remove();
};


/** Reset game */
trivia.reset = function() {
	trivia.cleanUp();

	clearInterval(trivia.timer);

	trivia.currentIndex = 0;
	trivia.correct = 0;
	trivia.incorrect = 0;
	trivia.remaining = 0;

	trivia.updateScore();
};



/** initialize trivia */
trivia.init = () => {
	trivia.setup();
};

/** document ready */
$(() => {
	trivia.init();
});