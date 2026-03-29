<script>
    import fetchApi from '$lib/fetchApi.js';
    
	let { data } = $props();

    async function login() {
        let result = await fetchApi(data, '/auth/createaccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });

        if (result.ok) {
            localStorage.setItem('token', await result.text());
            window.location.href = '/';
        }
    }
</script>

<input type="text" id="username" minlength="3" maxlength="20" />
<input type="password" id="password" minlength="8" maxlength="64" />
<button onclick={login}>Signup</button>