/** @namespace trivia */
const trivia = {};

// global variables
trivia.openTriviaBaseUrl = `https://opentdb.com/api.php?`;

trivia.categoriesUrl = `https://opentdb.com/api_category.php`;

trivia.sessionToken = `https://opentdb.com/api.php?amount=10&token=YOURTOKENHERE`;


trivia.questions;

trivia.categories;



/** setup trivia game based on user input */
trivia.setup = async function() {
	const $categoriesSelect = $('div.setup select#category');

	const categories = await $.ajax(trivia.categoriesUrl);
	// console.log(categories);

	// set global variable with all potential categories
	trivia.categories = categories.trivia_categories.slice();
	// console.log('trivia.categories: ', trivia.categories);

	// append category options to html
	trivia.categories.forEach(element => {
		$categoriesSelect.append(`<option value="${element.id}">${element.name}</option>`);
	});

	trivia.getInput();
}



/**
 * Get input from user and send request for trivia data on form submit
 */
trivia.getInput = function() {
	$('div.setup form').on('submit', function() {
		// reset previous game
		// trivia.reset();

		const numQuestions = ($('input#numQuestions').val());
		const category = $('select#category option:selected').val();
		const difficulty = $('select#difficulty option:selected').val();
		const type = $('select#type option:selected').val();
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
		const response = await $.ajax(`${trivia.openTriviaBaseUrl}amount=${amount}&category=${category}&difficulty=${difficulty}&type=${type}`);
		
		trivia.questions = response.results;

		// console.log(trivia.allQuestions);

		// Display questions to user
		trivia.displayQuestion();
	} catch(err) {
		console.log(err);
	};
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


/** Display question & answer to user */
trivia.displayQuestion = function() {
	console.log(trivia.questions);

	const numQuestions = trivia.questions.length;

	let currentIndex = 0;
	let currentQuestion = trivia.questions[currentIndex];

	let answers = currentQuestion.incorrect_answers.slice();
	answers.push(currentQuestion.correct_answer);

	// console.log(answers);

	const randomizedAnswers = trivia.randomizeAnswers(answers);
	
	// get index of correct answer in randomized array
	const correctIndex = randomizedAnswers.indexOf(currentQuestion.correct_answer);
	
	console.log(correctIndex);

	console.log(randomizedAnswers);

	// append question to html
	$('div.question').append(`
		<p>${currentQuestion.question}</p>
	`);


	for (let i in randomizedAnswers) {
		let questionHTML = ``;
		questionHTML += `
			<span>
				<input type="radio" name="answer" id="answer-${i}" value="${i}">
				<label for="answer-${i}">${randomizedAnswers[i]}</label>
			</span>`;

		// append answers to html
		$('fieldset.answer').append(questionHTML);
	};


	// listen for answer submit
	$('div.answer-container button').on('click', function() {
		const $answer = $('fieldset.answer').find('input:checked');
		if (parseInt($answer.val()) === correctIndex) {
			console.log('Correct!');
		} else {
			console.log('Incorrect :(');
			$answer.siblings(`label[for="answer-${$answer.val()}"]`).addClass('incorrect');
		}
		$(`fieldset.answer label[for="answer-${correctIndex}"]`).addClass('correct');
	});

	
};


/** Reset game */
// trivia.reset = function() {
// 	$('div.question').empty();
// 	$('fieldset.answer').empty().append('<legend>Answer:</legend>');
// };





// initialize trivia
trivia.init = () => {
	trivia.setup();
	// trivia.getTrivia();
	// trivia.setQuestion();
};

// document ready
$(() => {
	trivia.init();
});