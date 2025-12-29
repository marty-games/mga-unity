// VANILLA VERSION //

function initCpmstarAPI() {
    if (typeof cpmstarAPI !== 'undefined') {
        /* init/preload the interstitial */
        cpmstarAPI({
            kind: "game.createInterstitial",
            onAdOpened: function () {
                // you can pause the game or game audio here while ad is visible
            },
            onAdClosed: function () {
                // you can resume the game or game audio here when ad is closed
                if (typeof unityInstance !== 'undefined') {
                    unityInstance.SendMessage('MainManager', 'OnDaReveresedFinishedJS', 'Success');
                }
            },
            fail: function () {
                // if API fails to load, this will be triggered
                console.log("CPMSTAR API failed to load! Are you using an AdBlocker?");
            }
        });
    } else {
        console.log("CPMSTAR API is not defined.");
    }
}

window.fallbackToStar = window.fallbackToStar || function() {
    console.log("fallbackToStar triggered (this is attempt #3)");
    // Add your fallback logic here
    if (typeof cpmstarAPI !== 'undefined') {
        cpmstarAPI({
            kind: "game.displayInterstitial",
            fail: function () {
                // This will be called if the ad is unavailable
                console.log("attempt #3 failed.");
                if (typeof unityInstance !== 'undefined') {
                    unityInstance.SendMessage('MainManager', 'OnDaReveresedFinishedJS', 'Failed');
                }
            }
        });
    } else {
        console.log("CPMSTAR API is not defined for showMid.");
        if (typeof unityInstance !== 'undefined') {
            unityInstance.SendMessage('MainManager', 'OnDaReveresedFinishedJS', 'Failed');
        }
    }
};

// Delay init/preload the interstitial by 1 second after the page loads
setTimeout(initCpmstarAPI, 1000);

function showMid() {
    console.log("Showing Mid -> Re (Mid=Re for web Vanilla)");
    showRe();
}
function showRe() {
    console.log("Showing Re");
    // firstly, try adinplay.
    console.log("showRe attempt #1 starting. star...");
    if (typeof cpmstarAPI !== 'undefined') {
        cpmstarAPI({
            kind: "game.displayInterstitial",
            fail: function () {
                onAttempt1Failed();
            }
        });
    } else {
        onAttempt1Failed();
    }
}

function onAttempt1Failed(){
    console.log("attempt #1 fail. Starting #2...");
    if (typeof aiptag !== 'undefined' && typeof aiptag.adplayer !== 'undefined') {
        aiptag.cmd.player.push(function () { aiptag.adplayer.startVideoAd(); });
    } else {
        if (typeof unityInstance !== 'undefined') {
            console.log("#2 failed too. window.fallbackToStar...");
            window.fallbackToStar();
        }
    }
}

function gameplayStart() {
}

function gameplayEnd() {
}
