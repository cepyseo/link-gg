
    
function getTimeRemaining(endtime) {
        const total = Date.parse(endtime) - Date.parse(new Date().toLocaleString("en-US", {
            timeZone: "America/New_York"
        }));
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const addLeadingZero = (num) => {
            return num < 10 ? '0' + num : num;
        };

        return {
            total,
            days: addLeadingZero(days),
            hours: addLeadingZero(hours),
            minutes: addLeadingZero(minutes),
            seconds: addLeadingZero(seconds)
        };
    }

    function initializeClock(id, endtime) {
        // const clock = document.getElementById(id);
        const timeinterval = setInterval(() => {
            const t = getTimeRemaining(endtime);

            $('.days').text(t.days)
            $('.hour').text(t.hours)
            $('.min').text(t.minutes)
            $('.sec').text(t.seconds)



            if (t.total <= 0) {
                clearInterval(timeinterval);
                // clock.innerHTML = "Countdown Ended";
            }
        }, 1000);
    }

    // Set the date we're counting down to
    const deadline = 'June 1 2024 00:00:00 GMT-0400';
// console.log(initializeClock('countdown', deadline));
    

// function saveToLocalStorage(key, value) {
//     localStorage.setItem(key, JSON.stringify(value));
// }

// // Function to retrieve a variable from local storage
// function getFromLocalStorage(key) {
//     const storedValue = localStorage.getItem(key);
//     return storedValue ? JSON.parse(storedValue) : null;
// }


function saveToSessionStorage(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

// Function to retrieve a variable from session storage
function getFromSessionStorage(key) {
    const storedValue = sessionStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
}
