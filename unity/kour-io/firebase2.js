
function version38() { }

const cgAccountsEnabled = true;

var hasSetupOnlineStatusTracking = false;
var previousUserPresenceRef = null;
var isFriendRequestsListenerSet = false;
var currentFriendRequestsRef = null;
var invitesListenerRef = null;

const firebaseObjName = 'FirebasePlayerPrefs2023';
var _firebaseConfig = {
    apiKey: "AIzaSyCj_9AFDvc4uAxLBsmZjD3E2sgOPkOOyP0",
    authDomain: "kourio-2dc0d.firebaseapp.com",
    projectId: "kourio-2dc0d",
    databaseURL: "https://kourio-2dc0d-default-rtdb.firebaseio.com/",
    storageBucket: "kourio-2dc0d.appspot.com",
    messagingSenderId: "45440111818",
    appId: "1:45440111818:web:c53fb4b1516807e8b85033",
    measurementId: "G-VGVP085QMS"
};

let db;
let isFirebaseInitialized = false;

function initializeFirebase() {
    if (isFirebaseInitialized) {
        return;
    }
    
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not loaded yet');
            setTimeout(initializeFirebase, 100);
            return;
        }
        
        firebase.initializeApp(_firebaseConfig);
        db = firebase.database();
        window.firebaseSessionId = generateSessionId();
        isFirebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        setTimeout(initializeFirebase, 100);
    }
}

// Initialize Firebase when script loads
initializeFirebase();

// Helper function to ensure Firebase is ready before executing a function
function ensureFirebaseReady(func, ...args) {
    if (!isFirebaseInitialized || !db) {
        console.log('Firebase not ready, retrying...');
        setTimeout(() => ensureFirebaseReady(func, ...args), 100);
        return;
    }
    func(...args);
}

function GetEmail(username, password) {
    //let emailDomain = password.endsWith(passCgEndsWithIdentifier) ? "cgkour.io" : "example.com";
    let emailDomain = "example.com";
    return `${username}@${emailDomain}`;
}


function loginWithUsernameAndPassword(username, password) {
    firebase.auth().signInWithEmailAndPassword(GetEmail(username, password), password)
        .then((res) => {
            // Login successful
            //console.log('Login successful for user:', res.user.email);
            window.user = res.user;
            unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameLoginResultJS', "Success");
            res.user.displayName = username;
            //console.log(res.user);
            showUserDetails(username, res.user);
        })
        .catch((error) => {
            // Handle login errors
            try {
                const errorObject = JSON.parse(error.message);
                const specificErrorMessage = errorObject.error.message;
                unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameLoginResultJS', formatErrorMessage(specificErrorMessage));
                console.error('Login failed:', specificErrorMessage);
            } catch (e) {
                // If parsing fails, use the original error message
                unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameLoginResultJS', error.message);
                console.error('Login failed:', error.message);
            }
        });
}

function registerWithUsernameAndPassword(username, password) {
    const existingModal = document.getElementById('recaptchaModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.setAttribute('id', 'recaptchaModal');
    modal.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const captchaContainer = document.createElement("div");
    captchaContainer.setAttribute('id', 'recaptchaContainer');
    modal.appendChild(captchaContainer);
    document.body.appendChild(modal);

    grecaptcha.render('recaptchaContainer', {
        'sitekey': '6Ldv9lgqAAAAACU5PD6lKq7Zu9nEGgtuaJi4L9z1',
        'theme': 'light',
        'callback': submitForm
    });

    function submitForm(captchaResponse) {
        fetch('https://kour.io/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                recaptchaToken: captchaResponse
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameRegisterResultJS', "Success");
                    //showUserDetails(username, data.user);
                    loginWithUsernameAndPassword(username, password);
                } else {
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameRegisterResultJS', `Failed-${data.message}`);
                }
            })
            .catch(error => {
                unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameRegisterResultJS', `Failed-${error.message}`);
            })
            .finally(() => {
                document.body.removeChild(modal);
            });
    }

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'UsernameRegisterResultJS', "Cancelled-UserClosedCaptcha");
            document.body.removeChild(modal);
        }
    });

    captchaContainer.addEventListener('click', event => event.stopPropagation());
}

function formatErrorMessage(errorMessage) {
    const lowercaseMessage = errorMessage.toLowerCase();
    const words = lowercaseMessage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1));
    const formattedMessage = words.join(' ');
    return formattedMessage;
}
function GoogleLogin() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(res => {
        //console.log("Google Login Success!");
        //console.log(res.user);
        showUserDetails("", res.user);
    }).catch(e => {
        console.log("Google Login Error:");
        console.log(e);
    })
}
function EmailPasswordLogin(emailPassword) {
    var [email, password] = emailPassword.split(':');
    firebase.auth().signInWithEmailAndPassword(email, password).then(res => {
        //console.log("Email and Password Login Success!");
        //console.log(res.user);
        showUserDetails("", res.user);
    }).catch(e => {
        if (e.code === 'auth/user-not-found') {
            firebase.auth().createUserWithEmailAndPassword(email, password).then(res => {
                //console.log("Email and Password Registration Success!");
                //console.log(res.user);
                showUserDetails("", res.user);
            }).catch(e => {
                console.log("Email and Password Registration Error:");
                console.log(e);
            });
        } else {
            console.log("Email and Password Login Error:");
            console.log(e);
        }
    });
}


function FacebookLogin() {
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider).then(res => {
        //console.log("Facebook Login Success!");
        //console.log(res.user);
        showUserDetails("", res.user);
        // Link Facebook provider to existing account
        var user = firebase.auth().currentUser;
        var credential = firebase.auth.FacebookAuthProvider.credential(res.credential.accessToken);
        user.linkWithCredential(credential).then(function () {
            console.log("Facebook account linked successfully");
        }).catch(function (error) {
            console.log("Error linking Facebook account:", error);
        });
    }).catch(e => {
        console.log("Facebook Login Error:");
        console.log(e);
    });
}

function TwitterLogin() {
    var provider = new firebase.auth.TwitterAuthProvider();
    firebase.auth().signInWithPopup(provider).then(res => {
        console.log("Twitter Login Success!");
        showUserDetails("", res.user);
    }).catch(e => {
        console.log("Twitter Login Error:");
        console.log(e);
    });
}

function requestUserData() {
    // Ensure Firebase is initialized before proceeding
    if (!isFirebaseInitialized) {
        console.log('Firebase not initialized yet, retrying requestUserData...');
        setTimeout(requestUserData, 100);
        return;
    }
    
    if (window.sdkVersion === "CrazyGames" && cgAccountsEnabled){
        //the unity lobby has been just loaded. check if CG user exist
        if (typeof window.CrazyGames !== 'undefined' && typeof window.CrazyGames.SDK !== 'undefined') {

            window.CrazyGames.SDK.user
            .getUser()
            .then((crazyUser) => {
                if (crazyUser) {
                    console.log("[CG h5 getUser]: Get user result is: ", crazyUser);
                    // Authenticate with Firebase using CrazyGames user
                    handleCrazyGamesUser(crazyUser);
                } else {
                    console.log("User is not logged in to CrazyGames.");
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedOutGoogle');
                }
            })
            .catch((e) => console.log("Get user error: ", e));
        }
    }
    else if (window.location.hostname.includes('discord')) {
        console.log("requestUserData - discord...");
        // Check if we have Discord login data cached
        if (window.loginData) {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedInGoogle', window.loginData);
        } else {
            // Try to trigger Discord login if not already logged in
            if (typeof window.loginDiscord === 'function') {
                window.loginDiscord().catch(error => {
                    console.log("Discord auto-login failed:", error);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedOutGoogle');
                });
            } else {
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedOutGoogle');
            }
        }
    }
    else{
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedInGoogle', window.loginData);
    }
}




function parseJwt(token) {
    var base64Url = token.split('.')[1]; // Get the payload part of the JWT
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
    var jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload); // Parse the JSON payload
}

window.handleCrazyGamesUser = handleCrazyGamesUser;
async function handleCrazyGamesUser(crazyUser) {

    console.log("CG USER DETECTED! AUTO-LOGIN!");
    console.log("crazyUser: " + JSON.stringify(crazyUser));

    const receivedUserToken = await window.CrazyGames.SDK.user.getUserToken(); // this is a JWT string
    console.log("CG receivedUserToken is: ", receivedUserToken);
    console.log("CG receivedUserToken is (string): "+ receivedUserToken);
    console.log("parsing...");
    // Decode the token to get the payload
    const payload = parseJwt(receivedUserToken);
    console.log("CG payload is: ", payload);
    // Extract the userId from the payload
    const userId = payload.userId;

    const cg_username = `cg_${userId}`;//`${truncatedUsername}_${generatedPCG}`.replace(/[^a-zA-Z0-9_]/g, '');

    console.log("CG userId is: ", userId);
    const email = cg_username + '@example.com';
    console.log("CG email is: ", email);
    const p = generatePCG(userId, '!!34fdfygf%^', 10);
    console.log("PCG: ", p);
    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnCgP', p);

    firebase.auth().signInWithEmailAndPassword(email, p)
    .then((userCredential) => {
        console.log("[kour js] signInWithEmailAndPassword success!");
        const user = userCredential.user;
        showUserDetails("", user);
    })
    .catch((error) => {
        const errorMessage = error.message.toLowerCase();
        const errorCode = error.code;
        console.log("[catch signin cg error] errorCode: " + errorCode);
        console.log("[catch signin cg error] errorMessage: " + errorMessage);
        
        // Check for relevant error codes or messages
        if (errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/invalid-email' || 
            errorMessage.includes('credential is incorrect') || 
            errorMessage.includes('malformed') || 
            errorMessage.includes('expired')) {
            
            // Create the user if any of the above conditions are met
            console.log("[kour js] createUserWithEmailAndPassword...");
            firebase.auth().createUserWithEmailAndPassword(email, p)
                .then((userCredential) => {
                    const user = userCredential.user;
                    var usernameUpdate = crazyUser.username || 'kourr';
                    console.log("[kour js] createUserWithEmailAndPassword success! updating username to: " + usernameUpdate);
                    user.updateProfile({
                        displayName: usernameUpdate
                    }).then(() => {
                        showUserDetails(usernameUpdate, user);
                    });
                })
                .catch((error) => {
                    console.error('Error creating user:', error);
                });
        } else {
            console.error('Authentication error:', error);
        }
    });

}

window.showCrazyGamesAuthPrompt = showCrazyGamesAuthPrompt;
async function showCrazyGamesAuthPrompt () {
    try {
        const authi = await window.CrazyGames.SDK.user.showAuthPrompt();
        //no matter what happens just get current user anme
        console.log("showAuthPrompt result: ", authi);
        CrazySDK.User.GetUser(crazyUser =>
            {
                if (crazyUser != null)
                {
                    handleCrazyGamesUser(crazyUser);
                }
            });
    } catch (e) {
        console.log("Error:", e);
    }
};

function generatePCG(userId, secret, lenn) {
    const seed = userId + secret;
    const availableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueString = '';
    let hashValue = 0;
    for (let i = 0; i < seed.length; i++) {
        hashValue = (hashValue << 5) - hashValue + seed.charCodeAt(i);
        hashValue |= 0;
    }
    for (let i = 0; i < lenn; i++) {
        const charIndex = Math.abs(hashValue + i) % availableCharacters.length;
        uniqueString += availableCharacters.charAt(charIndex);
    }
    return uniqueString;
}

window.hasSetSession = false;
function showUserDetails(defaultUsername, user) {
    // For CrazyGames, wait until either a default username or displayName is available.
    if (window.sdkVersion === "CrazyGames" && !defaultUsername && !user.displayName) {
        console.log("Ignoring onAuthStateChanged callback: username not set yet.");
        return;
    }

    try{
        setupOnlineStatusTracking();
    } 
    catch (error) {
        console.error('Error while setting up online status tracking:', error);
    }

    console.log("[showUserDetails] START >>>");
    console.log("defaultUsername=" + defaultUsername);
    console.log("user.displayName=" + user.displayName);
    console.log("extractUsername(user.email)=" + extractUsername(user.email));
    console.log("[showUserDetails] END <<<");

    var finalUsername = window.sdkVersion === "CrazyGames" ? defaultUsername || user.displayName : extractUsername(user.email);
    console.log("FINAL USERNAME: " + finalUsername);
    var loginData = finalUsername + "|" + user.email + "|" + "null" + "|" + user.uid;
    window.loginData = loginData;
    if (typeof unityInstance !== 'undefined' && typeof window.loginData !== 'undefined') {
        if (!isFirebaseInitialized || !db) {
            console.log('Firebase not ready for showUserDetails, retrying...');
            setTimeout(() => showUserDetails(defaultUsername, user), 100);
            return;
        }
        
        const sessionsRef = db.ref(`users/${user.uid}/session`);
        // Set the session ID for the user
        if (!window.hasSetSession) {
            window.hasSetSession = true;
            sessionsRef.set(window.firebaseSessionId);
        }

        // Monitor active sessions
        sessionsRef.on('value', (snapshot) => {

            window.hasSetSession = true;

            const actualSessionId = snapshot.val();

            if (actualSessionId && actualSessionId !== window.firebaseSessionId) {
                // Session ID doesn't match, log out the user or take appropriate action
                //console.log(`Session was changed to: ${actualSessionId}!`);
                console.error(`Invalid session ID detected. Expected: ${window.firebaseSessionId}, Actual: ${actualSessionId}. Logging out user.`);

                // Check for null or whitespace in both expected and actual session IDs
                if (!isNullOrWhitespace(window.firebaseSessionId) && !isNullOrWhitespace(actualSessionId)) {
                    console.error(`Invalid session ID detected. Expected: ${window.firebaseSessionId}, Actual: ${actualSessionId}.`);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSessionError', 'Logged in from another device');
                } else {
                    console.error('Invalid session ID detected, but one or both IDs are null or whitespace.');
                }
            }
        });
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedInGoogle', window.loginData);
    }
}

function extractUsername(email) {
    if (email.includes('@')) {
        return email.split('@')[0];
    } else {
        return 'NoUsername';
    }
}




function setupOnlineStatusTracking() {
    const currentUser = firebase.auth().currentUser;
    // Check if a user is not logged in
    if (!currentUser) {
        return;
    }

    // Get the UID of the currently logged in user
    const uid = currentUser.uid;

    if (hasSetupOnlineStatusTracking && previousUserPresenceRef) {
        // Clean up the previous onDisconnect to prevent duplicates
        previousUserPresenceRef.onDisconnect().cancel();
        hasSetupOnlineStatusTracking = false;
    }

    const userPresenceRef = firebase.database().ref(`/presence/${uid}`);
    previousUserPresenceRef = userPresenceRef; // Store reference for potential cleanup

    firebase.database().ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === false) {
            // Handle the case where the connection state cannot be determined
            return;
        }
        // When connected (or reconnected), set the user's presence and ensure it gets removed when they disconnect.
        userPresenceRef.onDisconnect().remove();
        userPresenceRef.set(true);
    });

    hasSetupOnlineStatusTracking = true;
}

function tearDownOnlineStatusTracking() {
    if (!hasSetupOnlineStatusTracking || !previousUserPresenceRef) {
        return;
    }

    // Cancel the onDisconnect operation and remove the online status
    previousUserPresenceRef.onDisconnect().cancel();
    previousUserPresenceRef.remove();
    hasSetupOnlineStatusTracking = false;
}
function setUserEmail(givenUID, givenEmail, consent) {
    const consentBoolean = consent === "true";
    const emailRef = firebase.database().ref(`emails/${givenUID}/${givenEmail}`);
    emailRef.set(consentBoolean)
        .then(() => {
            console.log(`Email consent for ${givenEmail} set to ${consentBoolean}`);
        })
        .catch((error) => {
            console.error("Error setting email consent:", error);
        });
}
function signOutSessionError() {
    window.hasSetSession = false;
    tearDownOnlineStatusTracking();
    stopListeningForInvites();
    firebase.auth().signOut();
    location.reload();
}
function isNullOrWhitespace(value) {
    return value == null || value.trim() === '';
}

let refreshTokenInterval;

firebase.auth().onAuthStateChanged(user => {
    // Clear any existing refresh interval
    if (refreshTokenInterval) {
        clearInterval(refreshTokenInterval);
    }

    if (user) {
        // Set a new interval for refreshing the token
        refreshTokenInterval = setInterval(() => {
            refreshToken();
        }, 50 * 60 * 1000);  // Refresh every 50 minutes

        showUserDetails("", user);
    } else {
        // Handle the user being logged out if needed
        console.log("onAuthStateChanged! loggedOut.");
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedOutGoogle');
    }
});


function checkIfAdmin() {
    if (window.user) {
        window.user.getIdTokenResult()
            .then(idTokenResult => {
                var isAdmin = idTokenResult.claims.admin === true;
                if (isAdmin) {
                    unityInstanceWrapper.sendMessage('MainManager', 'OnReceivedIsAdmin', "1");
                } else {
                    unityInstanceWrapper.sendMessage('MainManager', 'OnReceivedIsAdmin', "0");
                }
            })
            .catch(error => {
                console.error('Error getting ID token result:', error);
                unityInstanceWrapper.sendMessage('MainManager', 'OnReceivedIsAdmin', error.message.toString());
            });
    }
}


/*---------FIREBASE PLAYERPREFS 2023 START---------*/


function getPromoCode(promoCode) {

    let promoRef = db.ref("codes/" + promoCode);
    promoRef.once("value").then(function (snapshot) {
        let promoValue = snapshot.val();
        let promoValueJson = JSON.stringify(promoValue);
        console.log("Promo value: " + promoValueJson);
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGetPromoCode', promoValueJson);
    }).catch(err => {
        console.log("Error getting promo code for promo: " + promoCode + ". error: " + err);
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGetPromoCode', "Error");
    });
}

/*---------SET DATA---------*/
function setData(path1, path2, varName, value, reqID) {
    if (!isFirebaseInitialized || !db) {
        console.log('Firebase not ready for setData, retrying...');
        setTimeout(() => setData(path1, path2, varName, value, reqID), 100);
        return;
    }

    db.ref(path1).update({
        [varName]: value,
    }, (err1) => {
        if (!err1) { // Check for errors from path1 update
            // Only update path2 if it's not an empty string
            if (path2) {
                db.ref(path2).update({
                    [varName]: value,
                }, (err2) => {
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetData', JSON.stringify({ err: err2 }) + "&" + reqID);
                });
            } else {
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetData', JSON.stringify({ err: null }) + "&" + reqID);
            }
        } else {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetData', JSON.stringify({ err: err1 }) + "&" + reqID);
        }
    });
}
function setDataNew(onPath, varName, value, reqID) {
    // Check if value is a numeric string and convert it to an integer if true
    let processedValue = isNaN(value) || value.trim() === "" ? value : parseInt(value);
    db.ref(onPath).update({
        [varName]: processedValue
    }, (err1) => {
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetData', JSON.stringify({ err: err1 }) + "&" + reqID);
    });
}

function createClan(clanName, leaderUserId, clanColor, reqID) {
    create_Clan(clanName, leaderUserId, clanColor)
        .then((clanKey) => {
            if (clanKey) {
                console.log(`Clan created with key: ${clanKey}`);
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', clanKey + "&" + reqID);

            } else {
                console.log("Clan creation failed.");
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);

            }
        });
}
function create_Clan(clanName, leaderUserId, clanColor) {

    const clanRef = db.ref('clans').child(clanName);

    // Check if the clan already exists
    return clanRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Clan with the same name already exists, throw an error
                console.error("Clan with the same name already exists.");
                return Promise.reject("ClanExists");
            } else {
                // Clan doesn't exist, proceed with creating the clan
                const initialMembers = {
                    [leaderUserId]: true,
                };
                const clanData = {
                    name: clanName,
                    leader: leaderUserId,
                    color: clanColor,
                    requests: {},
                    members: initialMembers || {}, // An object to store members
                };
                return clanRef.set(clanData)
                    .then(() => {
                        console.log("Clan created successfully!");
                        return clanName; // Return the clan name as the key
                    })
                    .catch((error) => {
                        console.error("Error creating clan: ", error);
                        return null;
                    });
            }
        })
        .catch((error) => {
            console.error("Error checking if the clan exists: ", error);
            return null;
        });
}

function addMember(clanName, memberId, leaderID, reqID) {
    console.log(`ERROR CAPTURING: addMember: clanName=${clanName}, memberId=${memberId}, leaderID=${leaderID}, reqID=${reqID}`);

    const clanRef = db.ref('clans').child(clanName);

    // First, check if the provided leaderID matches the clan's leader
    clanRef.child('leader').once('value')
        .then((snapshot) => {
            const clanLeaderID = snapshot.val();

            if (clanLeaderID === leaderID) {
                // Leader ID matches, proceed to check the member request
                const requestsRef = clanRef.child('requests');

                // Directly check if the memberId exists in the requests
                requestsRef.child(memberId).once('value')
                    .then((requestSnapshot) => {
                        if (requestSnapshot.exists()) {
                            // The user exists in requests, proceed to add the member
                            const membersRef = clanRef.child('members');
                            membersRef.child(memberId).set(true)
                                .then(() => {
                                    console.log(`Member ${memberId} added to clan ${clanName}`);
                                    // Set the additional value for the user
                                    const userRef = db.ref(`users/${memberId}/public/clan`);
                                    userRef.set(clanName)
                                        .then(() => {
                                            // Only after successfully adding the member, remove the request
                                            requestSnapshot.ref.remove()
                                                .then(() => {
                                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                                                })
                                                .catch((removeError) => {
                                                    console.error("Error removing request: ", removeError);
                                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                                });
                                        })
                                        .catch((userError) => {
                                            console.error("Error setting user clan: ", userError);
                                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                        });
                                })
                                .catch((addError) => {
                                    console.error("Error adding member to clan: ", addError);
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                });
                        } else {
                            console.error("User is not in the requests.");
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "UserNotInRequests&" + reqID);
                        }
                    })
                    .catch((error) => {
                        console.error("Error checking requests: ", error);
                        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                    });
            } else {
                console.error("Provided leaderID does not match the clan's leader.");
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "InvalidLeader&" + reqID);
            }
        })
        .catch((error) => {
            console.error("Error checking leader ID: ", error);
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
        });
}


function removePlayerFromClan(clanName, playerId, newLeaderId, reqID) {
    const clanRef = db.ref('clans').child(clanName);

    // First, check if the clan exists
    clanRef.once('value', (clanSnapshot) => {
        if (!clanSnapshot.exists()) {
            // If the clan does not exist, remove any clan reference from all users
            db.ref('users').orderByChild('public/clan').equalTo(clanName).once('value', (usersSnapshot) => {
                usersSnapshot.forEach((userSnapshot) => {
                    userSnapshot.ref.child('public/clan').remove();
                });
                console.log(`Broken clan ${clanName} references removed from all users.`);
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
            }).catch((error) => {
                console.error("Error cleaning up broken clan references: ", error);
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
            });
            return; // Exit the function as there's nothing more to do
        }

        // Proceed if the clan exists
        const membersRef = clanRef.child('members');
        const leaderRef = clanRef.child('leader');

        leaderRef.once('value').then((leaderSnapshot) => {
            const leader = leaderSnapshot.val();

            if (leader === playerId) {
                // Handle case where the player is the leader and needs to delete the clan
                // First, remove the clan reference from each member's profile
                membersRef.once('value').then((membersSnapshot) => {
                    let promises = [];
                    membersSnapshot.forEach((memberSnapshot) => {
                        const removeClanPromise = db.ref(`users/${memberSnapshot.key}/public/clan`).remove();
                        promises.push(removeClanPromise);
                    });

                    // After all clan references are removed, delete the clan
                    Promise.all(promises).then(() => {
                        clanRef.remove().then(() => {
                            console.log(`Player ${playerId} is the leader of clan ${clanName}. Clan deleted.`);
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                        }).catch((clanRemoveError) => {
                            console.error("Error deleting clan: ", clanRemoveError);
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                        });
                    }).catch((error) => {
                        console.error("Error removing 'clan' property for members: ", error);
                        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                    });
                }).catch((membersError) => {
                    console.error("Error fetching clan members for deletion: ", membersError);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                });
            }
            else {
                // Handle case where the player is not the leader
                membersRef.child(playerId).once('value').then((playerSnapshot) => {
                    if (playerSnapshot.exists()) {
                        db.ref(`users/${playerId}/public/clan`).remove().then(() => {
                            playerSnapshot.ref.remove().then(() => {
                                membersRef.once('value').then((membersSnapshot) => {
                                    if (!membersSnapshot.exists()) {
                                        clanRef.remove().then(() => {
                                            console.log(`Player ${playerId} removed from clan ${clanName}, clan deleted.`);
                                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                                        }).catch((clanRemoveError) => {
                                            console.error("Error deleting clan: ", clanRemoveError);
                                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                        });
                                    } else {
                                        leaderRef.set(newLeaderId).then(() => {
                                            console.log(`Player ${playerId} removed from clan ${clanName}, new leader is ${newLeaderId}.`);
                                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                                        }).catch((setLeaderError) => {
                                            console.error("Error setting new leader: ", setLeaderError);
                                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                        });
                                    }
                                }).catch((membersError) => {
                                    console.error("Error checking clan members: ", membersError);
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                });
                            }).catch((removeError) => {
                                console.error("Error removing player from clan: ", removeError);
                                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                            });
                        }).catch((error) => {
                            console.error("Error removing 'clan' property for user: ", error);
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                        });
                    } else {
                        console.error("Player is not a member of the clan.");
                        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "PlayerNotInClan&" + reqID);
                    }
                }).catch((error) => {
                    console.error("Error checking clan members: ", error);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                });
            }
        }).catch((leaderError) => {
            console.error("Error checking clan leader: ", leaderError);
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
        });
    }).catch((clanError) => {
        console.error("Error checking clan existence: ", clanError);
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
    });
}


function adminSetDataOn(onPath, key, value, reqID) {

    const clanRef = db.ref('clans').child(clanName);


}

function declineMember(clanName, memberId, leaderID, reqID) {
    console.log(`Declining member: clanName=${clanName}, memberId=${memberId}, leaderID=${leaderID}, reqID=${reqID}`);

    const clanRef = db.ref('clans').child(clanName);

    // First, check if the provided leaderID matches the clan's leader
    clanRef.child('leader').once('value')
        .then((snapshot) => {
            const clanLeaderID = snapshot.val();

            if (clanLeaderID === leaderID) {
                // Leader ID matches, proceed to decline the member
                const requestsRef = clanRef.child('requests');

                // Directly check if the memberId exists in the requests
                requestsRef.child(memberId).once('value')
                    .then((requestSnapshot) => {
                        if (requestSnapshot.exists()) {
                            // The user exists in requests, remove the request
                            requestsRef.child(memberId).remove()
                                .then(() => {
                                    console.log(`Request from ${memberId} declined in clan ${clanName}`);
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                                })
                                .catch((removeError) => {
                                    console.error("Error removing request: ", removeError);
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                                });
                        } else {
                            console.error("User is not in the requests.");
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "UserNotInRequests&" + reqID);
                        }
                    })
                    .catch((error) => {
                        console.error("Error checking requests: ", error);
                        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
                    });
            } else {
                console.error("Provided leaderID does not match the clan's leader.");
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "InvalidLeader&" + reqID);
            }
        })
        .catch((error) => {
            console.error("Error checking leader ID: ", error);
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Failed&" + reqID);
        });
}


function sendMembershipRequest(clanName, senderUserId, reqID) {
    console.log("js:sendMembershipRequest:clanName:" + clanName + ", senderUserID: " + senderUserId + "reqid:" + reqID);
    const clanRef = db.ref('clans').child(clanName);

    // Check if the clan exists
    clanRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // The clan exists, proceed to check if the user has already sent a request
                const requestsRef = clanRef.child('requests');

                requestsRef.child(senderUserId).once('value')
                    .then((snapshot) => {
                        if (snapshot.exists()) {
                            // The user has already sent a request
                            errorStr = `User ${senderUserId} has already sent a request to clan ${clanName}`;
                            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', errorStr + "&" + reqID);
                        } else {
                            // The user hasn't sent a request, proceed to send a new one
                            requestsRef.child(senderUserId).set(senderUserId)
                                .then(() => {
                                    console.log(`Request from ${senderUserId} sent to clan ${clanName}`);
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', "Success&" + reqID);
                                })
                                .catch((error) => {
                                    errStr = "Error sending membership request: " + error;
                                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', errStr + "&" + reqID);
                                });
                        }
                    })
                    .catch((error) => {
                        errStr = "Error checking for duplicate requests: " + error;
                        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', errStr + "&" + reqID);
                    });
            } else {
                // The clan doesn't exist, send an error message
                errorStr = `Clan ${clanName} does not exist`;
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', errorStr + "&" + reqID);
            }
        })
        .catch((error) => {
            errStr = "Error checking for clan existence: " + error;
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetDataNew', errStr + "&" + reqID);
        });
}


/*---------GET ALL USER DATA---------*/
function getUserData(uid, reqID) {
    if (!isFirebaseInitialized || !db) {
        console.log('Firebase not ready for getUserData, retrying...');
        setTimeout(() => getUserData(uid, reqID), 100);
        return;
    }
    
    let ref = db.ref("users");
    let userRef = ref.child(uid);
    userRef.on('value', (snapshot) => {
        let value = JSON.stringify(snapshot.val());
        if (value === null) {
            value = "null";
        }
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', value + "&" + reqID);
    }, (errorObject) => {
        console.error("The read failed: " + errorObject.code);
        console.error(errorObject);
    });
}

function getAllOnRef(where) {

    let ARef = db.ref(where);
    ARef.on('value', (snapshot) => {
        let value = JSON.stringify(snapshot.val());
        if (value === null) {
            value = "null";
        } else {
            value = value.toString();
        }
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', value);
    }, (error) => {
        console.log("Error getting data: " + error);
    });
}
function getLeaderboard(where) {
    console.log("js: getLeaderboard::" + where);

    let ARef = db.ref(where);

    ARef.once('value')
        .then((snapshot) => {
            let value = JSON.stringify(snapshot.val());
            if (value === null) {
                value = "null";
            } else {
                value = value.toString();
            }
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotLeaderboard', value);
        })
        .catch((error) => {
            console.log("Error getting data: " + error);
        });
}

function startListeningForClanChanges(uid, clan) {
    const clanRef = firebase.database().ref("users/" + uid + "/public/clan");
    // Remove any existing listeners
    clanRef.off();

    if (clan && clan.trim() !== "") { // Check if 'clan' is not null, not whitespace, and not empty
        const requestsRef = firebase.database().ref("clans/" + clan + "/requests");

        // Remove any existing listeners
        requestsRef.off();

        // Add a new listener for 'requestsRef'
        requestsRef.on("value", () => {
            unityInstanceWrapper.sendMessage('MainManager', 'OnClanDataChanged');
        });
    }

    // Add a new listener for 'clanRef'
    clanRef.on("value", () => {
        unityInstanceWrapper.sendMessage('MainManager', 'OnClanDataChanged');
    });
}


/*---------SET ALL USER DATA---------*/
function setUserData(uid, jsonString, publicJsonString, reqID) {

    let jsonObject = JSON.parse(jsonString);
    let publicJsonObject = JSON.parse(publicJsonString);
    db.ref("users/" + uid).set(jsonObject, (err) => {
        db.ref("users/" + uid + "/public").set(publicJsonObject, (err2) => {
            console.log(JSON.stringify({ err2 }));
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSetData', JSON.stringify({ err2 }) + "&" + reqID);
        });
    });
}
function setLeaderboardRecords(whereArray, username, valuesToSetArray) {

    const promises = [];

    for (let i = 0; i < whereArray.length; i++) {
        const where = whereArray[i];
        const valueToSet = valuesToSetArray[i];

        promises.push(
            new Promise((resolve, reject) => {
                const recordRef = db.ref(where + username);
                //console.log("setLeaderboardRecords[" + i + "]:" + " where=" + (where + username) + ", value: " + valueToSet);
                recordRef.set(valueToSet.toString(), (error) => {
                    if (error) {
                        reject(`Failed to set record for ${username} in ${where}`);
                    } else {
                        resolve();
                    }
                });
            })
        );
    }

    return Promise.all(promises)
        .then(() => {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnAddedPoints', 'Success');
        })
        .catch(error => {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnAddedPoints', error);
        });
}




function getClipboard() {
    navigator.clipboard.readText()
        .then(clipboardContents => {
            console.log("clipboard: " + clipboardContents);
            unityInstanceWrapper.sendMessage('MainManager', 'OnGotClipboard', clipboardContents);
        })
        .catch(error => {
            console.error("Failed to read clipboard:", error);
        });
}

function checkpsgpb() {
    firebase.database().ref('/psgpb').once('value').then((snapshot) => {
        if (snapshot.val() === true) {
            unityInstanceWrapper.sendMessage("UIManager", 'OnPsgpb');
        }
    });
}
/*---------GET DATA---------*/
function getData(path, reqID) {
    if (!isFirebaseInitialized || !db) {
        console.log('Firebase not ready for getData, retrying...');
        setTimeout(() => getData(path, reqID), 100);
        return;
    }

    let ref = db.ref(path);
    ref.on('value', (snapshot) => {
        let value = snapshot.val();
        if (value === null) {
            value = "null";
        } else {
            value = value.toString();
        }
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', value + "&" + reqID);

    });
}
function getDataRaw(forceLatest, path, reqID) {

    let ref = db.ref(path);

    if (forceLatest) {
        // Attach a one-time 'value' event listener to force a refresh
        ref.once('value')
            .then((snapshot) => {
                const data = JSON.stringify(snapshot.val());
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', data + "&" + reqID);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', "null" + "&" + reqID);
            });
    } else {
        // Attach an 'onSnapshot' listener to receive real-time updates
        ref.on('value', (snapshot) => {
            const data = JSON.stringify(snapshot.val());
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotData', data + "&" + reqID);
        });
    }
}
/*---------FIREBASE PLAYERPREFS 2023 END---------*/

function LogoutUser() {
    removeFriendRequestsListener();
    removeFriendsListener();
    console.log("LogoutUser called from JS");
    window.hasSetSession = false;
    tearDownOnlineStatusTracking();
    stopListeningForInvites();
    firebase.auth().signOut().then(() => {
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnLoggedOutGoogle');
    }).catch((error) => {
        console.log("An error happened : " + error);
    });
}
function getUIDByEmail(userEmail) {
    const functt = firebase.functions().httpsCallable('getUserId');

    functt({ email: userEmail })
        .then((result) => {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotUserUID', formatApiResponse(result.data));

        })
        .catch((error) => {
            console.error(error);
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnGotUserUID', formatApiResponse(error));
        });
}
function addcc(uid) {
    firebase.database().ref(`users/${uid}/cc`).set("1");
}
function formatApiResponse(response) {
    const key = Object.keys(response)[0];
    const value = response[key];
    return `${key}: ${value}`;
}

function generateSessionId() {
    const allowedCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const sessionIdLength = 6;
    let sessionId = '';
    for (let i = 0; i < sessionIdLength; i++) {
        const randomIndex = Math.floor(Math.random() * allowedCharacters.length);
        sessionId += allowedCharacters.charAt(randomIndex);
    }
    return sessionId;
}


let isFriendsListenerSet = false;
let currentFriendsRef = null;

function getAndListenForFriends(uid) {
    if (isFriendsListenerSet && currentFriendsRef && currentFriendsRef.key === uid) {
        console.log("Listener for friend s already set for this UID.");
        return;
    }

    // Remove existing listener if attempting to listen to a new UID
    if (currentFriendsRef) {
        currentFriendsRef.off('value');
        isFriendsListenerSet = false;
    }

    currentFriendsRef = db.ref(`users/${uid}/friends`);

    currentFriendsRef.on('value', (snapshot) => {
        const s = snapshot.val();
        var Ids = "";
        if (s) {
            Ids = Object.keys(s).join(',');
        }
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendsUpdate', Ids);
    }, (error) => {
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendError', error.message);
    });

    isFriendsListenerSet = true;
}

function removeFriendsListener() {
    if (!isFriendsListenerSet || !currentFriendsRef) {
        console.log("No friends listener to remove.");
        return;
    }

    currentFriendsRef.off('value'); // This removes the listener for the 'value' event for friend s
    isFriendsListenerSet = false;
    currentFriendsRef = null; // Reset the reference
}




function getAndListenForFriendRequests(uid) {
    if (isFriendRequestsListenerSet && currentFriendRequestsRef && currentFriendRequestsRef.key === uid) {
        console.log("Listener for friend requests already set for this UID.");
        return;
    }

    // Remove existing listener if attempting to listen to a new UID
    if (currentFriendRequestsRef) {
        currentFriendRequestsRef.off('value');
        isFriendRequestsListenerSet = false;
    }

    currentFriendRequestsRef = db.ref(`users/${uid}/friendRequests`);

    currentFriendRequestsRef.on('value', (snapshot) => {
        const requests = snapshot.val();
        var requestIds = "";
        if (requests) {
            requestIds = Object.keys(requests).join(',');
        }
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendRequestsUpdate', requestIds);
    }, (error) => {
        unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendError', error.message);
    });

    isFriendRequestsListenerSet = true;
}

function removeFriendRequestsListener() {
    if (!isFriendRequestsListenerSet || !currentFriendRequestsRef) {
        console.log("No friend requests listener to remove.");
        return;
    }

    currentFriendRequestsRef.off('value'); // This removes the listener for the 'value' event for friend requests
    isFriendRequestsListenerSet = false;
    currentFriendRequestsRef = null; // Reset the reference
}
function deleteUID(uidToDelete) {
    console.log("deleting...");
    const delUser = firebase.functions().httpsCallable('delUser');
    delUser({ email: uidToDelete })
        .then((result) => {
            // Check if there's a success message and display it
            if (result.data && result.data.success) {
                unityInstanceWrapper.sendMessage(`MainManager`, 'ShowMessageCustom', `Success`);
                console.log('Success:', result.data.message); // Log the success message if you want
                alert('Success: ' + result.data.message); // Display the success message
            } else {
                // If there's no success message, something went wrong
                unityInstanceWrapper.sendMessage(`MainManager`, 'ShowMessageCustom', `Unknown error occurred.`);
                console.log('Error:', result.data.error || 'Unknown error occurred.');
                alert('Error: ' + (result.data.error || 'Unknown error occurred.'));
            }
        })
        .catch((error) => {
            // Handle errors in the function call
            unityInstanceWrapper.sendMessage(`MainManager`, 'ShowMessageCustom', `'Error calling the delUser function`);
            console.error('Error calling the delUser function:', error);
            alert('Function Error: ' + (error.message || 'Unknown error occurred.'));
        });
}


function sendFriendRequest(yourUid, otherUid) {
    // Check if already friends
    const friendsRef = db.ref(`users/${yourUid}/friends/${otherUid}`);
    friendsRef.once('value', friendSnapshot => {
        if (friendSnapshot.exists()) {
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSentFriendRequest', "<color=yellow>Already Friends!");
            return;
        }

        // Check for an existing friend request in either direction
        const sentRequestRef = db.ref(`users/${otherUid}/friendRequests/${yourUid}`);
        const receivedRequestRef = db.ref(`users/${yourUid}/friendRequests/${otherUid}`);

        sentRequestRef.once('value', sentSnapshot => {
            if (sentSnapshot.exists()) {
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSentFriendRequest', "<color=yellow>Request Already Sent!");
                return;
            }

            receivedRequestRef.once('value', receivedSnapshot => {
                if (receivedSnapshot.exists()) {
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSentFriendRequest', "<color=yellow>Request Already Received!");
                    return;
                }

                // If neither are true, proceed to send the friend request
                sentRequestRef.set(true).then(() => {
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSentFriendRequest', "<color=green>Success");
                }).catch(error => {
                    console.error("Error sending friend request:", error);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnSentFriendRequest', "<color=red>" + error.message);
                    unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendError', error.message);
                });
            });
        });
    });
}

function respondToFriendRequest(yourUid, otherUid, toDo) {
    const yourRequestsRef = db.ref(`users/${yourUid}/friendRequests/${otherUid}`);
    const yourFriendsRef = db.ref(`users/${yourUid}/friends/${otherUid}`);
    const otherFriendsRef = db.ref(`users/${otherUid}/friends/${yourUid}`);

    if (toDo === "ok") {
        // First, set both users as friends
        Promise.all([
            yourFriendsRef.set(true),
            otherFriendsRef.set(true)
        ]).then(() => {
            // After successfully adding each other as friends, remove the friend request
            return yourRequestsRef.remove();
        }).then(() => {
            console.log("Friend request accepted.");
        }).catch(error => {
            const errorMessageAsString = error.message;
            unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendError', errorMessageAsString);
        });
    } else {
        // Decline by deleting the request
        yourRequestsRef.remove()
            .then(() => console.log("Friend request declined."))
            .catch(error => {
                const errorMessageAsString = error.message;
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnFriendError', errorMessageAsString);
            });
    }
}


function removeFriend(currentUserUid, friendUid) {
    // Reference to the current user's friend list
    const currentUserFriendRef = db.ref(`users/${currentUserUid}/friends/${friendUid}`);
    // Reference to the friend's friend list
    const friendUserFriendRef = db.ref(`users/${friendUid}/friends/${currentUserUid}`);

    // Remove the friend from the current user's friend list
    currentUserFriendRef.remove()
        .then(() => console.log(`Removed ${friendUid} from ${currentUserUid}'s friend list.`))
        .catch(error => console.error("Error removing friend from user's friend list:", error));

    // Remove the current user from the friend's friend list
    friendUserFriendRef.remove()
        .then(() => console.log(`Removed ${currentUserUid} from ${friendUid}'s friend list.`))
        .catch(error => console.error("Error removing user from friend's friend list:", error));
}

const activeListeners = new Set();

function listenForFriendPresence(friendUid) {
    // Check if a listener for this UID already exists
    if (activeListeners.has(friendUid)) {
        return;
    }

    const friendPresenceRef = db.ref(`/presence/${friendUid}`);
    friendPresenceRef.on('value', snapshot => {
        const isOnline = snapshot.val();
        let stat = isOnline ? "online" : "offline";
        unityInstanceWrapper.sendMessage(`FriendButton_${friendUid}`, 'FriendStatusUpdate', stat);
    }, (error) => {
        console.error("Error listening for friend presence:", error);
    });

    // Add this UID to the set of active listeners
    activeListeners.add(friendUid);
}

function removeListenerForFriendPresence(friendUid) {
    if (!activeListeners.has(friendUid)) {
        return;
    }

    // Remove the listener
    const friendPresenceRef = db.ref(`/presence/${friendUid}`);
    friendPresenceRef.off('value');
    activeListeners.delete(friendUid); // Remove this UID from the set of active listeners
}


function sendInvite(senderUid, recipientUid, roomName) {
    const inviteRef = db.ref(`users/${recipientUid}/invites/${senderUid}`);
    inviteRef.set({
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        roomName: roomName
    }).then(() => { })
        .catch(error => console.error("Error sending invite:", error));
}




function listenForInvites(recipientUid) {
    if (invitesListenerRef) {
        return;
    }

    invitesListenerRef = db.ref(`users/${recipientUid}/invites`);
    invitesListenerRef.on('value', snapshot => {
        const invites = snapshot.val();
        if (!invites) {
            return;
        }

        const currentTime = Date.now();
        Object.keys(invites).forEach(senderUid => {
            const invite = invites[senderUid];
            const inviteAge = currentTime - invite.timestamp;

            // If the invite is older than 1 minute (60000 milliseconds), delete it
            if (inviteAge > 60000) {
                invitesListenerRef.child(senderUid).remove()
                    .catch(error => console.error("Error deleting expired invite:", error));
            } else {
                // Process valid invite
                unityInstanceWrapper.sendMessage(firebaseObjName, 'OnInvite', `${senderUid}:${invite.roomName}`);
            }
        });
    }, (error) => {
        console.error("Error listening for invites:", error);
    });
}

function stopListeningForInvites() {
    if (!invitesListenerRef) {
        return;
    }

    invitesListenerRef.off('value');
    invitesListenerRef = null;
}


function acceptAllInvites(recipientUid) {
    const invitesRef = db.ref(`users/${recipientUid}/invites`);
    invitesRef.once('value')
        .then((snapshot) => {
            const invites = snapshot.val();
            if (!invites) {
                return;
            }

            const inviteKeys = Object.keys(invites);
            const removePromises = inviteKeys.map(senderUid => {
                return invitesRef.child(senderUid).remove();
            });

            return Promise.all(removePromises);
        })
        .then(() => {
        })
        .catch((error) => {
            console.error("Error accepting all invites:", error);
        });
}
function checkVersion(expectedVersion) {
    const fetchOptions = {
        method: 'GET',
        cache: 'no-store', // forces the request to bypass the cache
        headers: new Headers({
            'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
            'Pragma': 'no-cache', // HTTP 1.0.
            'Expires': '0' // Proxies.
        })
    };
    fetch('version.txt', fetchOptions)
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(text => {
            // Process the fetched text
            const fetchedVersion = text.toLowerCase().replace(/\s/g, '');
            if (fetchedVersion !== expectedVersion.toLowerCase().replace(/\s/g, '')) {
                console.log('must update!');
                unityInstanceWrapper.sendMessage(`MainManager`, 'OnNewVersionDetected', `${fetchedVersion}`);
            }
        })
        .catch(error => {
            console.error('There was a problem with your fetch operation:', error);
        });
}

function deleteAtPath(path) {
    const ref = db.ref(path);
    ref.remove();
}
function replb(uid) {
    firebase.database().ref(`lb/${uid}`).set(true);
}

function saveMap(content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.kour';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
function loadMap() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kour';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log(e.target.result);
            unityInstanceWrapper.sendMessage("MapBuilder", 'OnMapLoaded', e.target.result);
        };
        reader.readAsText(file);
    };
    input.click();
}

var connectedRef = firebase.database().ref(".info/connected");
connectedRef.on("value", function (snapshot) {
    if (snapshot.val() === false) {
        //this is also being called after 2-10 minutes of not sending any data.
        unityInstanceWrapper.sendMessage(firebaseObjName, 'ond');
        attemptReconnect();
    }
});

function attemptReconnect() {
    var reconnectInterval = setInterval(() => {
        firebase.database().goOnline(); // Force the Firebase client to try reconnecting
        connectedRef.once("value", function (snapshot) {
            if (snapshot.val() === true) {
                console.log("Reconnection successful.");
                unityInstanceWrapper.sendMessage(firebaseObjName, 'onc');
                clearInterval(reconnectInterval); // Stop trying to reconnect once successful
            }
        });
    }, 5000); // Check every 5 seconds
}

function refreshToken() {
    console.log("50 minutes passed! refreshing token...");
    const user = firebase.auth().currentUser;
    if (user) {
        user.getIdToken(true).then(function (idToken) {
            // Token refreshed and active
            console.log("Success! Token refreshed and active.");
        }).catch(function (error) {
            console.error('Token refresh failed', error);
        });
    }
}




// Enable offline capabilities
/*
firebase.database().enablePersistence()
    .catch(function (err) {
        if (err.code == 'failed-precondition') {
            console.error("Persistence can only be enabled in one tab at a time. Make sure you're not running multiple instances.");
        } else if (err.code == 'unimplemented') {
            console.error("The current browser does not support all of the features required to enable persistence");
        }
    });
    */
