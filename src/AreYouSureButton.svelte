<script>
	export let onclick;
	let areYouSureMode = false
	function doclick(){
		if(areYouSureMode){
			onclick();
			areYouSureMode = false;
		}
		else{
			areYouSureMode = true;
		}
	}
</script>

<button class={areYouSureMode?"areYouSureMode":""} on:click={doclick} on:blur={_=>areYouSureMode=false}>
{#if areYouSureMode}
Are you sure?
{:else}
<slot></slot>
{/if}
</button>

<style lang="scss">
	button{
		transition: 120ms ease;
	}
	.areYouSureMode{
		background-color: salmon;
		// transform: translateX(100%);
	}
</style>