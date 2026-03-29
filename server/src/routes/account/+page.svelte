<script>
    import authenticate from '$lib/authenticate.js';
    import fetchApi from '$lib/fetchApi.js';
    import { onMount } from 'svelte';

	let { data, children } = $props();

	let user = $state(null);
	
	onMount(() => authenticate(data, v => user = v, () => window.location.href = '/login'));

    async function setCountry() {
        let result = await fetchApi(data, '/myself/setcountry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                country: document.getElementById('country').value,
                token: localStorage.getItem('token')
            })
        });
    }

    function logOut() {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
</script>

{#if user}
    <h1>{user.username}</h1>
    <br />
    <button onclick={logOut}>Log out</button>
    <br />
    <input type="text" id="country" minlength="2" maxlength="2" />
    <button onclick={setCountry}>Set country</button>
{/if}