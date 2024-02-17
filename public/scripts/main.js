var rhit = rhit || {};

rhit.FB_COLLECTION_NIGHTS = "Nights";
rhit.FB_KEY_DAY = "day";
rhit.FB_KEY_DURATION = "duration";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";
rhit.FbNightsManager = null;
rhit.FbAuthManager = null;
let CURRENT_NIGHT_ID = null;
let CURRENT_UID = null;
const sleepHours = [];

rhit.Night = class {
    constructor(id, day, duration) {
        this.id = id;
        this.day = day;
        this.duration = duration;
    }
}

//From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

rhit.UserPageController = class {
    constructor() {
        const date = new Date();
        document.getElementById("dateDisplay").innerHTML = date.toDateString();
        console.log("UserPageController initialized");
        // document.querySelector("#menuShowAllQuotes").addEventListener("click", (event) => {
        // 	window.location.href = "/list.html";
        // });
        // document.querySelector("#menuShowMyQuotes").addEventListener("click", (event) => {
        // 	console.log("Show my quotes");
        // 	window.location.href = `/list.html?uid=${rhit.FbAuthManager.uid}`;
        // });
        document.querySelector("#menuSignOut").addEventListener("click", (event) => {
            rhit.FbAuthManager.signOut();
        });

        // Add Night
        document.querySelector("#submitAddNight").addEventListener("click", (event) => {
            const day = document.querySelector("#inputDay").value;
            const duration = document.querySelector("#inputDuration").value;
            rhit.FbNightsManager.add(day, duration);
        });
        $('#addNightDialog').on('show.bs.modal', (event) => {
            // pre animation
            document.querySelector("#inputDay").value = "";
            document.querySelector("#inputDuration").value = "";

        });
        $('#addNightDialog').on('shown.bs.modal', (event) => {
            // post animation
            console.log("dialog is now visible");
            document.querySelector("#inputDuration").focus();
        });

        let timer;
        let startTime;
        let isTimerRunning = false;

        document.querySelector("#stateButton").addEventListener('click', function () {
            if (isTimerRunning) {
                document.getElementById("stateButton").innerHTML = "AWAKE";
                document.getElementById("stateButton").style.backgroundColor = "#cc6ab5";
                clearInterval(timer);
                isTimerRunning = false;

                const elapsedTime = new Date().getTime() - startTime;
                const minutes = Math.floor(elapsedTime / 60000);

                // Display the elapsed time
                console.log("minutes:" + minutes);
                rhit.FbNightsManager.add(Date(), minutes);
            } else {
                // Start the timer
                startTime = new Date().getTime();
                isTimerRunning = true;
                document.getElementById("stateButton").innerHTML = "ASLEEP";
            }
        });

        // Edit Night
        document.querySelector("#submitEditNight").addEventListener("click", (event) => {
            const day = document.querySelector("#inputEditDay").value;
            const duration = document.querySelector("#inputEditDuration").value;
            rhit.FbNightsManager.update(CURRENT_NIGHT_ID, day, duration);
        });
        $('#editNightDialog').on('show.bs.modal', (event) => {
            // pre animation
            console.log("preanimation setup");
            // document.querySelector("#inputEditDay").value = new Date(rhit.FbNightsManager.day);
            // document.querySelector("#inputEditDuration").value = rhit.FbNightsManager.duration;
            document.querySelector("#inputEditDay").value = "";
            document.querySelector("#inputEditDuration").value = "";
        });
        $('#editNightDialog').on('shown.bs.modal', (event) => {
            // post animation
            console.log("dialog is now visible");
            document.querySelector("#inputEditDuration").focus();
        });

        // start listening
        rhit.FbNightsManager.beginListening(this.updateList.bind(this));
    }

    _createCard(night) {
        var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const daystring = new Date(night.day);
        const adjustedDayString = new Date(daystring.getTime() + Math.abs(daystring.getTimezoneOffset() * 60000));
        return htmlToElement(`<div class="card">
        <div class="card-body">
            <div id="cardAlign">
                <h5 class="card-title handwrittenB">${weekday[adjustedDayString.getDay()]}: ${Math.floor(night.duration / 60)} Hrs, ${night.duration % 60} Mins </h5>
                <button id="editButton" class="btn" data-toggle="modal" data-target="#editNightDialog"><i
                        class="fa-solid fa-pen-to-square" style="font-size: 25px;"></i></button>
            </div>
        </div>
    </div>`);
    }

    updateList() {
        console.log("update list now :)");
        console.log(`Num nights = ${rhit.FbNightsManager.length}`);
        console.log(`example night = `, rhit.FbNightsManager.getNightAtIndex(0));
        const sleepHours = [];
        //Make a new quoteListContainer
        const newList = htmlToElement('<div id="nightContainer"></div>');
        const curDate = new Date();
        const curDay = curDate.getDay();
        console.log(curDay);
        //fill the nightContainer with quote cards using aloop
        for (let i = 0; i < rhit.FbNightsManager.length; i++) {
            const nt = rhit.FbNightsManager.getNightAtIndex(i);
            const newCard = this._createCard(nt);

            // console.log("mouseover listener");
            // newCard.querySelector("#editButton").addEventListener("mouseover", (event) => {
            //     console.log("mouseover card");
            //     rhit.FbNightsManager.updateDocumentSnapshot(nt.id);
            //     CURRENT_NIGHT_ID = nt.id;
            // });
            // newCard.querySelector("#editButton").addEventListener("mouseover", (event) => {
            //     console.log("mouseover editButton");
            //     rhit.FbNightsManager.updateDocumentSnapshot(nt.id);
            //     CURRENT_NIGHT_ID = nt.id;
            // });

            newCard.querySelector("#editButton").onclick = (event) => {
                console.log("clicked");
                rhit.FbNightsManager.updateDocumentSnapshot(nt.id);
                CURRENT_NIGHT_ID = nt.id;
            };

            const daystring = new Date(nt.day);
            const adjustedDayString = new Date(daystring.getTime() + Math.abs(daystring.getTimezoneOffset() * 60000));
            console.log(daystring.getDate());
            newList.appendChild(newCard);
            if ((sleepHours[adjustedDayString.getDay()] == null) && (curDate.getDate() - adjustedDayString.getDate() <= curDay)) {
                sleepHours[adjustedDayString.getDay()] = nt.duration / 60;
            }
            else if ((sleepHours[adjustedDayString.getDay()] != null) && (curDate.getDate() - adjustedDayString.getDate() <= curDay)) {
                sleepHours[adjustedDayString.getDay()] = sleepHours[adjustedDayString.getDay()] + nt.duration / 60;
            }
        }

        const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        new Chart("sleepGraph", {
            type: "line",
            data: {
                labels: daysOfWeek,
                datasets: [{
                    //   backgroundColor:"#B39DDB",
                    borderColor: "#B39DDB",
                    data: sleepHours,
                    tension: 0.1,
                    fill: false,
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            fontColor: 'white'
                        },
                        gridLines: {
                            display: true,
                            color: "#808080"
                        },
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: 'white'
                        },
                        gridLines: {
                            display: true,
                            color: "#808080"
                        },
                    }]
                },
                legend: {
                    display: false,
                }
            }
        });

        //Remove the old quoteLIstContainer
        const oldList = document.querySelector("#nightContainer");
        oldList.removeAttribute("id");
        oldList.hidden = true;
        // put in the new quoteList Container
        oldList.parentElement.appendChild(newList);

    }
}


rhit.FbNightsManager = class {
    constructor(uid) {
        this._uid = uid;
        this._documentSnapshots = [];
        this._documentSnapshot = {};
        this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_NIGHTS);

        this._unsubscribe = null;

    }
    add(day, duration) {

        // Add a new document with a generated id.
        this._ref.add({
            [rhit.FB_KEY_DAY]: day,
            [rhit.FB_KEY_DURATION]: duration,
            [rhit.FB_KEY_AUTHOR]: rhit.FbAuthManager.uid,
            [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
        })
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
    }
    updateDocumentSnapshot(nightId) {
        this._refSingle = firebase.firestore().collection(rhit.FB_COLLECTION_NIGHTS).doc(nightId);
        this._refSingle.get().then((doc) => {
            if (doc.exists) {
                console.log("Document data:", doc.data());
                this._documentSnapshot = doc;
                console.log("documentSnapshot updated:", this._documentSnapshot);
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    }

    update(nightId, day, duration) {
        this._refSingle = firebase.firestore().collection(rhit.FB_COLLECTION_NIGHTS).doc(nightId);
        this._refSingle.update({
            [rhit.FB_KEY_DAY]: day,
            [rhit.FB_KEY_DURATION]: duration,
            [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
        })
            .then(() => {
                console.log("Document successfully updated!");
            })
            .catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });
    }

    beginListening(changeListener) {
        let query = this._ref.orderBy(rhit.FB_KEY_DAY, "desc").limit(50);
        if (this._uid) {
            query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
        }
        this._unsubscribe = query.onSnapshot((querySnapshot) => {
            console.log("night update");

            this._documentSnapshots = querySnapshot.docs;

            if (changeListener) {
                changeListener();
            }
        });
    }
    stopListening() {
        this._unsubscribe();
    }

    get length() {
        return this._documentSnapshots.length;
    }
    getNightAtIndex(index) {
        const docSnapshot = this._documentSnapshots[index];
        const nt = new rhit.Night(
            docSnapshot.id,
            docSnapshot.get(rhit.FB_KEY_DAY),
            docSnapshot.get(rhit.FB_KEY_DURATION)
        );
        return nt;
    }

    get day() {
        return this._documentSnapshot.get(rhit.FB_KEY_DAY);
    }
    get duration() {
        return this._documentSnapshot.get(rhit.FB_KEY_DURATION);
    }
    get author() {
        return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
    }
}

rhit.LoginPageController = class {
    constructor() {
        console.log("Ready");

        // document.querySelector("#createAccountButton").onclick = (event) => {
        //     console.log(`Create account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);


        //     firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
        //         .catch((error) => {
        //             var errorCode = error.code;
        //             var errorMessage = error.message;

        //             console.log("Create account error", errorCode, errorMessage);
        //             // ..
        //         });
        // };
        document.querySelector("#loginButton").onclick = (event) => {
            rhit.FbAuthManager.signIn();
        };
        // rhit.startFirebaseUI();
    }
}

// rhit.startFirebaseUI = function() {
// 	var uiConfig = {
//         signInSuccessUrl: '/',
//         signInOptions: [
//           firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//           firebase.auth.EmailAuthProvider.PROVIDER_ID,
//           firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//           firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
//         ],
//       };

//       const ui = new firebaseui.auth.AuthUI(firebase.auth());
//       ui.start('#firebaseui-auth-container', uiConfig);
// }

rhit.FbAuthManager = class {
    constructor() {
        this._user = null;
    }
    beginListening(changeListener) {
        firebase.auth().onAuthStateChanged((user) => {
            console.log("auth state changed");
            this._user = user;
            if (user) {
                const displayName = user.displayName;
                const email = user.email;
                const uid = user.uid;
                CURRENT_UID = uid;
                console.log("The user is signed in ", uid);
                console.log('displayName :>> ', displayName);
                console.log('email :>> ', email);
            } else {
                console.log("There is no user signed in!");
            }
            changeListener();
        });
    }
    signIn() {
        const inputEmailEl = document.querySelector("#inputEmail");
        const inputPasswordEl = document.querySelector("#inputPassword");
        console.log(`Login for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
        firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value)
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log("Existing account login error", errorCode, errorMessage);
            });
    }
    signOut() {
        firebase.auth().signOut().catch((error) => {
            console.log("Sign out error");
        });
    }
    get isSignedIn() {
        return !!this._user;
    }
    get uid() {
        return this._user.uid;
    }
}

rhit.checkForRedirects = function () {
    if (document.querySelector("#loginPage") && rhit.FbAuthManager.isSignedIn) {
        window.location.href = "/userPage.html";
    }

    if (!document.querySelector("#loginPage") && !rhit.FbAuthManager.isSignedIn) {
        window.location.href = "/";
    }


};

rhit.initializePage = function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (document.querySelector("#userPage")) {
        // const uid = urlParams.get("uid");
        rhit.FbNightsManager = new rhit.FbNightsManager(CURRENT_UID);
        new rhit.UserPageController();

    }

    if (document.querySelector("#loginPage")) {
        console.log("You are on the login page");
        new rhit.LoginPageController();
    }
};

rhit.main = function () {
    console.log("Ready");
    rhit.FbAuthManager = new rhit.FbAuthManager();
    rhit.FbAuthManager.beginListening(() => {
        console.log("began listening");
        rhit.checkForRedirects();
        rhit.initializePage();
    });
};

rhit.main();