import fetchApi from "./fetchApi.js";

export default async function(data, successCallback = () => {}, failCallback = () => {}) {
    let token = localStorage.getItem('token');
    if (token) {
        let result = await fetchApi(data, '/auth/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (result.ok) {
            successCallback(JSON.parse(await result.text()));
            return;
        } else if (result.status === 400) {
            localStorage.removeItem('token');
            failCallback();
            return;
        } else {
            //limbo state or something idk
            return;
        }
    }
    failCallback();
}