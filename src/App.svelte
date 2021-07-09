<script>
	import {resultHistory, testFont} from './stores'
	import AreYouSureButton from './AreYouSureButton.svelte'
	let currentInput = ""
	let startText = "--"
	// const startText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ullamcorper neque eu ullamcorper sodales. Etiam sodales elit vel lectus laoreet pellentesque. Phasellus massa augue, accumsan sit amet nisl nec, aliquam efficitur sem. Morbi tempor, dolor vel pellentesque iaculis, sapien felis bibendum ipsum, et condimentum nulla odio a dui. Nam quis neque euismod, varius sem at, auctor sapien. Donec ullamcorper est ornare posuere cursus. Donec mollis blandit tincidunt. Etiam id felis a est mollis vulputate. Donec sagittis turpis id sem condimentum condimentum. Vestibulum varius lacinia justo at gravida."
	// const startText = "An easier start text."
	let letters = []
	let gameStatus = 'loading';
	let numLettersTyped = 0;
	let numCorrectLetters = 0;
	let numWordsTyped = 0;
	let millisecondsSpent = 0;
	let startTime = 0;
	async function oraclePopulate(size=100){
		startText = ""
		while (startText.length<size){
			let data = await fetch('https://oracle.cy2.me/api')
			data = await data.text()
			let illegalMatch = data.match(/[^a-zA-Z0-9 !@#$%^&*()\[\]{};':",./<>?`~\\|]*/g).filter(letter=>letter!="")
			// console.log(illegalMatch.length>0)
			if (illegalMatch.length>0) continue;
			if(startText.length>0) startText+=" ";
			startText+=data
		}
		while(startText.indexOf('  ')>-1){
			console.log('removing spaces')
			startText = startText.replaceAll('  ', ' ')
		}
		gameStatus='pre'
	}
	$: {
		numWordsTyped = currentInput.indexOf(" ")==-1?0:currentInput.split(" ").length
		numLettersTyped = Math.min(currentInput.length, startText.length)
		if(currentInput.length===1 && millisecondsSpent===0){
			startTime = parseInt(Date.now().toPrecision())
			gameStatus = 'running'
		}
		if(gameStatus=='running'){
			millisecondsSpent = parseInt(Date.now().toPrecision())-startTime
		}
		if (currentInput == '\x0a' && currentInput.length===1){
			currentInput = "";
		}
		numCorrectLetters = 0;
		letters = startText.split("").map((originalChar, i)=>{
			let letter = originalChar
			let status = 'untyped'
			const inputChar = currentInput.charAt(i)=="\xa0"?" ":currentInput.charAt(i)
			// console.log(startText.charCodeAt(i), currentInput.charCodeAt(i))
			if(i>currentInput.length-1){}
			else if(originalChar == inputChar){
				status = 'correct';
				numCorrectLetters++;
			}
			else if(originalChar != inputChar){
				status = 'incorrect';
			}
			return {letter, status}
		})
		if(numLettersTyped>=startText.length && gameStatus=='running'){
			// console.log('switched game status')
			gameStatus='post'
			// const currentHistory = $resultHistory?$resultHistory:[]
			// console.log(currentHistory)
			// console.log(numCorrectLetters, numLettersTyped)
			resultHistory.set([{
				wpm: Math.round(numWordsTyped/(millisecondsSpent/60000)), 
				cpm: Math.round(numLettersTyped/(millisecondsSpent/60000)),
				acc: Math.round((numCorrectLetters/numLettersTyped)*100),
				// letters: letters.map(elem=>({'l':elem.letter, 's':elem.status})),
				original:startText,
				userInput:currentInput,
				timestamp: new Date(Date.now()).toISOString(),
				duration: millisecondsSpent,
			}, ...$resultHistory])
		}
		// numLettersTyped = Math.min(currentInput.length, startText.length)
	}
	$: {
		console.log(gameStatus)
	}
	const sizes = {
		small:50,
		medium:150,
		large:300,
	}
	let sizeString = new URLSearchParams(window.location.search).get('size')
	if(!sizes[sizeString]) sizeString="small"
	oraclePopulate(sizes[sizeString])
	function regenerate(size){
		// gameStatus='loading'
		// oraclePopulate(sizes[size])
		window.location.search=`size=${size}`
	}
	function resetGame(regen=true){
		gameStatus = 'loading'
		numLettersTyped = 0;
		numCorrectLetters = 0;
		numWordsTyped = 0;
		millisecondsSpent = 0;
		startTime = 0;
		if(regen){
			currentInput = "";
			startText = "--";
			oraclePopulate(sizes[sizeString])
		}
		else{
			currentInput=""
			gameStatus='pre'
		}
	}
	document.onkeydown = e=>{
		// console.log(e)
		if(e.key=='Tab'){
			resetGame()
		}
		if(e.key=='Escape'){
			resetGame(false)
		}
	}
	let graphMax = 0;
	$: {
		let newMax = 0;
		$resultHistory.forEach(elem=>{
			let val = elem.cpm*elem.acc
			if(val>newMax){
				newMax = val;
			}
		})
		graphMax = newMax/100;
	}
	let downloaderElem = null;
	function downloadPastAttempts(){
		const blob = new Blob([JSON.stringify($resultHistory)], {type:'application/json'})
		const objectURL = URL.createObjectURL(blob)
		console.log(objectURL)
		downloaderElem.setAttribute("href", objectURL);
		downloaderElem.setAttribute("download", "typing test log.json");
		downloaderElem.click();
		// window.open(objectURL)
		// debugger
	}
	function reviewSession(sessionIndex){
		const session = $resultHistory[sessionIndex]
		console.log('reviewing', session)
		startText = ''
		millisecondsSpent = session.millisecondsSpent
		gameStatus = 'post'
	}
</script>

<main class="gamestate_{gameStatus}">
	<div class="testArea" style={$testFont?`font-family: ${$testFont}, monospace`:null}>
		<p class="testStats">
			{Math.round(numWordsTyped/(millisecondsSpent/60000))||"--"} wpm 
			{Math.round(numLettersTyped/(millisecondsSpent/60000))||"--"} cpm 
			{Math.round((numCorrectLetters/numLettersTyped)*100)||"--"}% acc
		</p>
		<p class="testPrompt">
			{#each letters as letter}
				<span class={letter.status}>{letter.letter}</span>
			{/each}
		</p>
		{#if gameStatus=='loading'}
		<p style="color: gold;">generating...</p>
		{:else} 
			{#if gameStatus=='post'}
				<p class="testInput">{currentInput}</p>
				<p style="color: green;">press tab to continue</p>
			{:else}
				<p class="testInput" contenteditable bind:textContent={currentInput} autofocus></p>
			{/if}
			<!-- <p class="testInput" contenteditable={gameStatus!='post'} on:input={(e)=>currentInput=e.target.innerText} autofocus></p> -->
		{/if}
	</div>
	<p class="keyInstructions">
		<code>tab</code> for next sample
		<code>esc</code> to retry current sample
	</p>
	<div class="optionsContainer">
		<h2>test length</h2>
		<button style={sizeString=="small"?"background-color: lightskyblue;":null} on:click={_=>regenerate('small')}>small</button>
		<button style={sizeString=="medium"?"background-color: lightskyblue;":null} on:click={_=>regenerate('medium')}>medium</button>
		<button style={sizeString=="large"?"background-color: lightskyblue;":null} on:click={_=>regenerate('large')}>large</button>
		<p style="font-size: small;">powered by <a href="https://oracle.cy2.me">oracle.cy2.me</a></p>
	</div>
	<div class="optionsContainer">
		<h2>options</h2>
		<p>
			test font: <input type="text" bind:value={$testFont} placeholder="font family name">
		</p>
	</div>
	<div class="optionsContainer">
		<h2>about</h2>
		<p>made by <a href="https://cy2.me">cy westbrook</a></p>
		<p>source code on <a href="https://github.com/cyfinfaza/typing-test">github</a></p>
	</div>
	<h2>past attempts </h2> 
	<AreYouSureButton onclick={_=>resultHistory.set([])}>clear past attempts</AreYouSureButton>
	<button on:click={downloadPastAttempts}>download json</button>
	<a bind:this={downloaderElem} style="display: none;"></a>
	<ul>
		{#each $resultHistory as result, i}
			<li class="attemptListItem">
				{result.wpm} wpm 
				{result.cpm} cpm 
				{result.acc}% acc
				<!-- <button style="padding: 2px; font-size: 14px;" on:click={_=>reviewSession(i)}>view</button> -->
				<div class="graphBar" style="width: {(result.cpm*result.acc)/graphMax}%;"></div>
			</li>
		{/each}
	</ul>
</main>

<style lang="scss">
	.optionsContainer{
		display: inline-block; 
		margin-right: 16px;
		vertical-align: top;
	}
	.keyInstructions{
		code{
			background-color: #ddd;
			padding: 4px;
			border-radius: 4px;
		}
	}
	.graphBar{
		// position: absolute;
		height: 0.8ch;
		// border-radius: 2px;
		background-color: gray;
	}
	.attemptListItem{
		max-width: 500px;
	}
	.testArea {
		font-family: monospace;
		font-size: 32px;
		user-select: none;
	}
	.testInput{
		user-select: unset;
		cursor: text;
	}
	// .testPrompt{
	// 	span{
	// 		// display: inline-block;
	// 		// transition: 120ms cubic-bezier(0.175, 0.885, 0.32, 1);
	// 		// background-image: linear-gradient(0deg, salmon 0%, salmon 32%, white 33%, white 67%, lightgreen 68%, lightgreen 100%);
	// 		// background-size: 100% 300%;
	// 		// background-position-y: 50%;
	// 	}
	// }
	span.untyped{
		color: gray;
	}
	span.correct{
		background-color: lightgreen;
		// background-position-y: 0%;
	}
	span.incorrect{
		background-color: salmon;
		// background-position-y: 100%;

	}
	.testInput:focus{
		outline: none;
	}
	.testInput:empty::before{
		content: "> type here";
		color: green;
	}
	.testStats{
		transition: 240ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
		display: flex;
		overflow: hidden;
	}
	main.gamestate_post{
		.testStats{
			font-size: 48px;
		}
	}
	// main.gamestate_pre{
	// 	// .testStats{
	// 	// 	height: 0px;
	// 	// 	margin: 0;
	// 	// 	// opacity: 0;
	// 	// }
	// }
</style>
