async function fetchWorkshops() {
    let uuid = "";

    if (state.user_object !== null) {
        uuid = state.user_object.uuid;
    }

    const response = await fetch(`${API}/workshops/get_workshops_for_user/${uuid}`);

    if (response.status == 200) {
        const workshops = await response.json();

        state.workshops = workshops;

        renderWorkshops();
    }
}

function renderWorkshops() {
    const upcoming_workshops = document.getElementById("upcoming-workshops");
    const previous_workshops = document.getElementById("previous-workshops");

    removeAllChildren(upcoming_workshops);
    removeAllChildren(previous_workshops);

    const now = new Date();

    for (let workshop of state.workshops) {
        // if the workshop has past, append it to another element
        // However, add a 24 hour buffer to the date, so that workshops that are
        // scheduled for the same day as the current date will still be shown
        // as upcoming
        const parsed_date = new Date(workshop.timestamp_start * 1000);

        // Add 24 hours to the date
        parsed_date.setDate(parsed_date.getDate() + 1);

        if (parsed_date < now) {
            previous_workshops.prepend(generateWorkshopDiv(workshop, true));
        } else {
            upcoming_workshops.appendChild(generateWorkshopDiv(workshop));
        }
    }

    // If there are no upcoming workshops, display a message
    if (upcoming_workshops.children.length == 0) {
        const no_workshops = document.createElement("p");
        no_workshops.innerText = "No upcoming workshops!";
        upcoming_workshops.appendChild(no_workshops);
    }

    // Add h2 headers to each section
    const upcoming_header = document.createElement("h2");
    upcoming_header.innerText = "Upcoming Workshops";
    upcoming_workshops.prepend(upcoming_header);

    const previous_header = document.createElement("h2");
    previous_header.innerText = "Previous Workshops";
    previous_workshops.prepend(previous_header);
}

function generateWorkshopDiv(workshop, is_past=false) {
    // Has fields of title, date, time, instructor, description, and signup link
    const div = document.createElement("div");
    div.classList.add("workshop");

    const title = document.createElement("h2");
    title.innerText = workshop.title;
    title.classList.add("title");
    div.appendChild(title);

    const date = document.createElement("p");
    let start_time = new Date(workshop.timestamp_start * 1000);
    let end_time = new Date(workshop.timestamp_end * 1000);

    let start_time_string = start_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let end_time_string = end_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    // Want to have it in the format of:
    date.innerHTML = `${start_time.toLocaleDateString()}<br>${start_time_string.replace(/^0+/, '')} - ${end_time_string.replace(/^0+/, '')}`;
    
    date.classList.add("date");
    div.appendChild(date);

    const instructor = document.createElement("p");
    instructor.innerHTML = `<b>Taught by:</b> <i>${workshop.instructors}</i>`;
    instructor.classList.add("instructor");
    div.appendChild(instructor);

    const description = document.createElement("p");
    description.innerHTML = `<b>Description:</b> ${workshop.description}`;
    description.classList.add("description");
    div.appendChild(description);

    const required_quizzes = document.createElement("p");
    required_quizzes.innerHTML = `<b>Required Quizzes:</b> ${workshop.required_quizzes.join(", ")}`;
    required_quizzes.classList.add("required-quizzes");
    div.appendChild(required_quizzes);

    const capacity = document.createElement("p");
    capacity.innerHTML = `<b>Signups:</b> ${workshop.signups} / ${workshop.capacity} slots`;

    if (workshop.position !== -1) {
        capacity.innerHTML += `<br> <b>Position:</b> ${workshop.position + 1}`;
    }

    if (workshop.signups >= workshop.capacity) {
        capacity.innerHTML += `<br> <b>Workshop is full, RSVP to be added to the waitlist!</b>`
    }

    capacity.classList.add("capacity");
    div.appendChild(capacity);

    if (!is_past) {
        // Add signup button
        const signup = document.createElement("button");
        signup.classList.add("big");
        signup.classList.add("signup");
        signup.id =`signup-${workshop.uuid}`

        if (workshop.position === -1) {
            signup.innerText = "RSVP";
            signup.addEventListener("click", () => {
                rsvpToWorkshop(workshop.uuid);
            });
        } else {
            signup.innerText = "Cancel RSVP";
            signup.addEventListener("click", () => {
                cancelRsvpToWorkshop(workshop.uuid);
            });
        }


        div.appendChild(signup);
    } else {
        const signup = document.createElement("h3");
        signup.classList.add("signup");
        signup.innerText = "This workshop has passed.";
        div.appendChild(signup);
    }

    return div;
}

async function rsvpToWorkshop(workshop_uuid) {
    if (state.user_object === null) {
        alert("You must be logged in to RSVP to a workshop!");
        return;
    }

    const signup_button = document.getElementById(`signup-${workshop_uuid}`);
    signup_button.setAttribute("disabled", "disabled");

    const response = await fetch(`${API}/workshops/rsvp_to_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workshop_uuid: workshop_uuid,
                user_uuid: state.user_object.uuid
            })
        }
    );

    signup_button.removeAttribute("disabled");

    if (response.status == 201) {
        await fetchWorkshops();
    } else {
        const error = await response.json();
        alert("Error: " + error.detail);
    }
}

async function cancelRsvpToWorkshop(workshop_uuid) {
    const response = await fetch(`${API}/workshops/cancel_rsvp_to_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workshop_uuid: workshop_uuid,
                user_uuid: state.user_object.uuid
            })
        }
    );

    if (response.status == 201) {
        await fetchWorkshops();
    }
}