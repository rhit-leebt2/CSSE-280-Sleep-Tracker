FB_COLLECTION_SLEEPTRACKER = "SleepTracker";
FB_KEY_HOURS = "Hours";
FB_KEY_MIN = "Minutes";
FB_KEY_DATE = "Date";
FB_KEY_AUTHOR = "Author";
fbNightManager = null;

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

userPageController = class{
    constructor(){

        fbNightManager.beginListening(this.updateList.bind(this));
    }

    _createCard(night){
		return htmlToElement(`      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${night.hours}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${night.minutes}</h6>
        </div>
      </div>`);
	}

    updateList() {
		const newList = htmlToElement('<div id="nightContainer"></div>');

		for (let i = 0; i < fbNightManager.length; i++){
			const night = fbNightManager.getNightAtIndex(i);
			const newCard = this._createCard(night);

			newCard.onclick = (event) => {
				console.log(`You clicked on ${night.id}`);
			};

			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#nightContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}

nightManager = class {
	constructor(uid) {
	  this._uid = uid;
	  this._documentSnapshots = [];
	  this._ref = firebase.firestore().collection(FB_COLLECTION_SLEEPTRACKER);
	  this._unsubscribe = null;
	}

    add(hours, minutes) {  
		console.log(`quote ${quote}`);
		console.log(`movie ${movie}`);

		this._ref.add({
			[FB_KEY_HOURS]: hours,
			[FB_KEY_MINUTES]: minutes,
			[FB_KEY_AUTHOR]: fbAuthManager.uid,
			[FB_KEY_DATE]: firebase.firestore.Timestamp.now(),
		})
		.then(function (docRef) {
			console.log("Document written with ID: ", docRef.id);
		})
		.catch(function (error) {
			console.log("Error adding document: ", error);
		});
	  }

	get length() {  
		return this._documentSnapshots.length;
	}

	getNightAtIndex(index) { 
		const docSnapshot = this._documentSnapshots[index]; 
		const night = new nightClass(
			docSnapshot.id,
			docSnapshot.get(FB_KEY_HOURS),
			docSnapshot.get(FB_KEY_MIN)
		);
		return night;
	}

    beginListening(changeListener) {  
		let query = this._ref.orderBy(FB_KEY_DATE, "desc").limit(50);
		if(this._uid){
			query = query.where(FB_KEY_DATE, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {

			this._documentSnapshots = querySnapshot.docs;

			changeListener();

			querySnapshot.forEach((doc) => {
				console.log(doc.data());
			});
		});
	  }
}

nightClass = class {
	constructor(id, hours, minutes){
		this.id = id;
		this.hours = hours;
		this.minutes = minutes;
	}
}

initializePage = function() {
	const urlParams = new URLSearchParams(window.location.search);

	if(document.querySelector("#userPage")){
		console.log("you are on the list page.");
		const uid = urlParams.get("uid");
		fbNightManager = new nightManager(uid);
		new userPageController;
	}
};

main = function () {
	console.log("Ready");
	initializePage();


};

main();