/* Garden page glue: waits for the mono font, then starts every tree on the page. */
(function () {
'use strict';
function start() { window.QRTrees.garden(); }
var ready = document.fonts && document.fonts.load ? document.fonts.load('12px "Fragment Mono"').catch(function () {}) : Promise.resolve();
ready.then(start, start);
})();
