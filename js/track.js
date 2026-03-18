// Lightweight page view tracking beacon (~300B)
(function() {
    if (navigator.doNotTrack === '1') return;
    try {
        var d = JSON.stringify({ page: location.pathname, ref: document.referrer || '' });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track', d);
        } else {
            var x = new XMLHttpRequest();
            x.open('POST', '/api/track', true);
            x.setRequestHeader('Content-Type', 'application/json');
            x.send(d);
        }
    } catch (e) { /* silent */ }
})();
