<script>
	import favicon from '$lib/assets/favicon.svg';
    import authenticate from '$lib/authenticate.js';
    import { onMount } from 'svelte';

	let { data, children } = $props();

	let user = $state(null);
	
	onMount(() => authenticate(data, v => user = v));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="root">
	<div class="navbar">
		<div class="title">MOM</div>
		{#if user}
			<a style="margin-left: auto;" href="/account">{user.username}</a>
		{:else}
			<a style="margin-left: auto;" href="/login">Login</a>
			<a href="/signup">Signup</a>
		{/if}
	</div>
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	@font-face {
		font-family: "TCCEB";
		font-style: normal;
		font-weight: bold;
		src: url("$lib/assets/tcceb.ttf") format("truetype");
	}

	:global(:root) {
		margin: 0;
		width: 100%;
		height: 100%;
	}

	:global(body) {
		margin: 32px 16px;
		font-family: "TCCEB";
		font-size: 20px;
		background-color: #111;
		color: #fff;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		width: calc(100% - 32px);
		height: calc(100% - 64px);
	}

	.root {
		width: min(640px, 100%);
		height: 100%;
		background-color: #222;
		box-shadow: inset 0 0 16px 4px #fff4;
		border-radius: 8px;
		overflow: hidden;
	}

	.navbar {
		width: 100%;
		height: 64px;
		background-color: #fffb;
		color: #000;
		display: flex;
		align-items: center;
		padding: 0 16px;
		box-sizing: border-box;
		font-size: 24px;
		gap: 8px;
	}

	.navbar a {
		color: #000;
		text-decoration: none;
	}

	.title {
		font-size: 48px;
	}

	.content {
		width: 100%;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 16px;
		box-sizing: border-box;
	}
</style>