"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // {lat,lng}
    this.distance = distance; //in km
    this.duration = duration; // in min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
  }
}

// const cycle1 = new Cycling([27, 74], 27, 35, 400);
// const run1 = new Running([27, 75], 56, 23, 20);
// console.log(cycle1, run1);

/////////////////////
//Project Architecture
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoom = 17;
  constructor() {
    //Immidiately Called After object creation
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //New Workout Method Call
    form.addEventListener("submit", this._newWorkout.bind(this));

    //Form Type Method Call
    inputType.addEventListener("change", this._toggleElevationField);

    //Move to Marker
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  //Get Position
  _getPosition() {
    //Load Map and Alert Methods Call
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        this._alert
      );
  }

  //Alert Method
  _alert() {
    alert("Please give access of location");
  }

  //Load Map Method
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoom);

    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution:
        '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    }).addTo(this.#map);
    //Show Form Method Call
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
  }

  //Show Form Method
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //hide Form
  _hideForm() {
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value =
      "";
    form.classList.add("hidden");
  }

  //New Workout Method
  _newWorkout(e) {
    e.preventDefault();

    // Helper functions
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every((inp) => inp > 0);

    // Get data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If running, create workout running object
    if (type === "running") {
      const cadence = Number(inputCadence.value);
      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        this._hideForm();
        return alert("Invalid Input: Must be positive integers");
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If cycling, create workout cycling object
    if (type === "cycling") {
      const elevationGain = Number(inputElevation.value);
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevationGain) ||
        !isPositive(distance, duration)
      ) {
        this._clearInput();
        return alert("Invalid Input: Must be positive integers");
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Add new object to workouts array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //hide and clear input fields of form
    this._hideForm();

    //set local storage
    this._setLocalStorage();
  }

  //Form Type Method
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //Render Marker
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === "running") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === "cycling") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;
    const currWorkout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(currWorkout.coords, this.#mapZoom, {
      animate: true,
      pan: { duration: 0.6 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;

    this.#workouts.forEach((work) => this._renderWorkout(work));
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
//Create App object
const app = new App();
