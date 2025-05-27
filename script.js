'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Math.floor(Math.random() * (10000 - 100 + 1) + 100);
    type;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)}
         on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}


class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadance) {
        super(coords, distance, duration);
        this.cadance = cadance;
        this.calcPace();
        this._setDescription();
    }

    //min/km
    calcPace() {
        this.pace = this.duration / this.distance;
    }
}
class Cycling extends Workout {
    type = 'cycling'
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    //km/h
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}


class app {
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        this._renderLocalStorage();
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
                () => alert("Couldn't get you position")
            )

        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        this.#map = L.map('map').setView([latitude, longitude], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.#map);

        let marker = L.marker([latitude, longitude]).addTo(this.#map);
        this.#map.on("click", this._showForm.bind(this));

        this.#workouts.forEach(workout => {
            this._renderMarker(workout);
        });
    }


    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle("form__row--hidden");
        inputCadence.closest('.form__row').classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {
        e.preventDefault();
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        const validateNumbers = function (...inputs) {
            return inputs.every(inp => Number.isFinite(inp));
        }

        const allPositive = function (...inputs) {
            return inputs.every(inp => inp > 0);
        }
        //get data from fields + validation
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        //if workout is running => create running object

        if (type === 'running') {
            const cadance = +inputCadence.value;
            if (!validateNumbers(distance, duration, cadance) || !allPositive(distance, duration, cadance)) {
                return alert('Please enter a positive number!');
            }

            workout = new Running([lat, lng],
                distance, duration, cadance);

        }

        //if workout is cycling => create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validateNumbers(distance, duration, elevation) || !allPositive(distance, duration)) {
                return alert('Please enter a positive number');
            }

            workout = new Cycling([lat, lng],
                distance, duration, elevation);


        }
        //add the workout to the workout array
        this.#workouts.push(workout);
        this._addToLocalStorage();
        //display workout on the map
        this._renderMarker(workout);
        //display workout on the list 
        this._renderWorkout(workout);
        //hide form and clear fields
        form.classList.add('hidden');
        inputDistance.value = inputDuration.value =
            inputCadence.value = inputElevation.value = '';


    }

    _renderWorkout(workout) {
        const html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.type === 'running' ?
                Math.floor(workout.pace) : Math.floor(workout.speed)}</span>
            <span class="workout__unit">${workout.type === 'running' ? 'min/km' : 'km/h'}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🦶🏼' : '⛰'}</span>
            <span class="workout__value">${workout.type === 'running' ?
                Math.floor(workout.pace) : Math.floor(workout.elevation)}</span>
            <span class="workout__unit">${workout.type === 'running' ? 'spm' : 'm'}</span>
          </div>
        </li>
            `

        form.insertAdjacentHTML('afterend', html);
    }

    _renderMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup
            (L.popup({
                maxwidth: 100,
                maxheight: 150,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`)
            .openPopup();
    }

    _moveToMarker(e) {
        const workoutElement = e.target.closest('.workout');

        if (!workoutElement) return;

        const workoutObj = this.#workouts.find(w => `${w.id}` === workoutElement.dataset.id);

        this.#map.setView(workoutObj.coords, 13, {
            animate: true,
            pan: {
                duration: 0.5
            }
        });
    }

    _addToLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    }

    _renderLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(workout => {
            this._renderWorkout(workout);
        });
    }

}


const app1 = new app();


