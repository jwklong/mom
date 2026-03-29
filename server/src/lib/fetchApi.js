

export default function fetchApi(data, url, ...args) {
    return fetch(`${window.location.protocol}//${window.location.hostname}:${data.backendPort}/api${url}`, ...args);
}