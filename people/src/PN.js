class PN {
    constructor() {
        this.publicVapidKey = 'BHNDnILTEvKcwYFfIhyOGoxecSf4wjoIEL-8EbyO-0scqnrCwNjR5uEPpz4utoAXjucSizX2Fa8VNgsIwMF5HF0'
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            });
        }
        this.Subscribe();
        this.Broadcast();
    }
    async Subscribe() {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey),
        });
        console.log(subscription);
        // await fetch('https://people-engine.originalbuilders.workers.dev/', {
        //     method: 'POST',
        //     body: JSON.stringify(subscription),
        //     headers: {
        //         'Notifications': "TRUE",
        //         'content-type': 'application/json',
        //     },
        // });
    }
    async Broadcast() {
        await fetch('https://people-engine.originalbuilders.workers.dev/', {
            method: 'GET',
            headers: {
                'Notifications': "TRUE",
                'content-type': 'application/json',
            },
        });
    }
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}
export default PN;