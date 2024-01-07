/*---------------------------------------------------------------------------------------------
 *  Copyright (c) urobot2011. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

function tokenizer(input){
	input = input.replace(/\t/gi, '    ');
	let tokens = [];
	let token = '';
	let startLength = 0;
	let stringDelimiter = null;
	let noteDelimiter = null;

	const tripleCharTokens = [
		'...'
	];
	const doubleCharTokens = [
		'!=', '==', '<=', '>=', '||', '&&', '--',
		'++', '+=', '-=', '*=', '/=', '%=', '->', '=>', '..'
	];
	const singleCharTokens = [
		' ', '\n', '\\', '(', ')', '[', ']',
		'{', '}', ',', '.', ':', '=', '+',
		'-', '*', '/', '%','!', '<', '>', '@'
	];

	function previousTokenPush(i){
		if(token !== ''){
			tokens.push({value: token, start: startLength, end: i});
		}
		token = '';
	}

	for(let i = 0; i < input.length; i++){
		let char = input[i];
		let char2;
		let char3;

		if(i < input.length - 1){ 
			char2 = char+input[i+1];
		}
		if(i < input.length - 2){ 
			char3 = char2+input[i+2];
		}

		if(char2 === '//' || char2 === '/*' || char2 === '*/'){
			if(char2 === '/*'){
				noteDelimiter = '/*';
			} else if(char2 === '*/'){
				noteDelimiter = null;
			} else {
				noteDelimiter = '//';
			}

			i++;
			continue;
		}

		if(noteDelimiter !== null){
			if(noteDelimiter === '//' && char === '\n') noteDelimiter = null;
			continue;
		}
		
		if(char === '"' || char === "'" || char === "`"){
			if(stringDelimiter !== null && char === stringDelimiter){
				token += char;
				stringDelimiter = null;
				previousTokenPush(i + 1);
			} else if(stringDelimiter === null){
				stringDelimiter = char; // Store the delimiter to match it when closing the string
				startLength = i;
				token += char;
			} else {
				token += char; // If a different delimiter is encountered inside a string, treat it as part of the string
			}
			
			continue; 
		}

		if(stringDelimiter !== null){
			token += char; 
			continue; 
		}

		if(char === '\t') continue;

		if(tripleCharTokens.includes(char3)){
			previousTokenPush(i);
			i++;
			tokens.push({value: char3, start: i-1, end: ++i});
		} else if(doubleCharTokens.includes(char2)){
			previousTokenPush(i);
			tokens.push({value: char2, start: i, end: ++i});
		} else if(singleCharTokens.includes(char)){
			previousTokenPush(i);

			if(![' ', '\n'].includes(char)){
				tokens.push({value: char, start: i, end: i+1});
			}
		} else {
			if(token === '') startLength = i;
			token += char;
		}
	}

	// Push the last non-empty token after loop ends

	previousTokenPush(input.length);

	return {input, tokens: tokens.filter((token) => Boolean(token.value))}; 
}

function lexer({input, tokens}){
	tokens = structuredClone(tokens);

	const punctuations = [
		'(', ')', '{', '}', '[', ']', '\\', ',', '.', '->', '=>', ':', ';', '\n'
	];
	const operators = [
		'!=', '==', '<=', '>=', '||', '&&', 
		'=', '+', '-', '*', '/', '%', '!',
		'<', '>', '--', '++', '+=', '-=', 
		'*=', '/=', '%=', '...', '@', '..'
	];
	
	for(let i = 0; i < tokens.length; i++){
		let token = tokens[i];
		if(token.value[0] === '"' || token.value[0] === "'" || token.value[0] === "`"){
			token.type = 'literal';
			token.value = token.value.slice(1, -1);
		} else if(punctuations.includes(token.value)){
			token.type = 'punctuation';
		} else if(operators.includes(token.value)){
			token.type = 'operator';
		} else if(!isNaN(token.value)){
			token.type = 'number';
		} else {
			token.type = 'id';
		}
	}

	return {input, tokens: tokens.filter((token) => Boolean(token.value))};
}
