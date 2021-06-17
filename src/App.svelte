<script>
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
	let timeInterval;
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
		numCorrectLetters = 0;
		if(currentInput.length===1 && millisecondsSpent===0){
			startTime = parseInt(Date.now().toPrecision())
			gameStatus = 'running'
		}
		if(gameStatus=='running'){
			millisecondsSpent = parseInt(Date.now().toPrecision())-startTime
		}
		if(numLettersTyped>=startText.length && gameStatus=='running'){
			console.log('switched game status')
			gameStatus='post'
		}
		if (currentInput == '\x0a' && currentInput.length===1){
			currentInput = "";
		}
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
		// numLettersTyped = Math.min(currentInput.length, startText.length)
	}
	const sizes = {
		small:75,
		medium:125,
		large:300,
	}
	let size = sizes[new URLSearchParams(window.location.search).get('size')]
	if(size) oraclePopulate(size)
	else oraclePopulate()
	function regenerate(size){
		// gameStatus='loading'
		// oraclePopulate(sizes[size])
		window.location.search=`size=${size}`
	}
</script>

<main class="gamestate_{gameStatus}">
	<div class="testArea">
		<p class="testStats">
			{Math.round(numWordsTyped/(millisecondsSpent/60000))||"--"} wpm {Math.round((numCorrectLetters/numLettersTyped)*100)||"--"}% acc
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
			{:else}
				<p class="testInput" contenteditable bind:textContent={currentInput} autofocus></p>
			{/if}
			<!-- <p class="testInput" contenteditable={gameStatus!='post'} on:input={(e)=>currentInput=e.target.innerText} autofocus></p> -->
		{/if}
	</div>
	<button on:click={_=>regenerate('small')}>small</button>
	<button on:click={_=>regenerate('medium')}>medium</button>
	<button on:click={_=>regenerate('large')}>large</button>
	<p style="font-size: small;">powered by <a href="https://oracle.cy2.me">oracle.cy2.me</a></p>
</main>

<style lang="scss">
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