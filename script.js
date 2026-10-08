const API = "https://examportal-api.abhinandanofficial-naha.workers.dev";

function getCurrentUser() {
    try {
        const saved =
            localStorage.getItem("examportal_user") ||
            sessionStorage.getItem("examportal_user");

        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function showLogin() {
    document.getElementById("signupBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
}

function showSignup() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("signupBox").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("signupBox").classList.add("hidden");
}

function showClasses() {
    const user = getCurrentUser();

    if (!user) {
        alert("Please Login or Sign Up first.");
        showLogin();
        return;
    }

    const classes = document.getElementById("classes");

    classes.classList.remove("hidden");

    classes.scrollIntoView({
        behavior: "smooth"
    });
}

async function apiRequest(endpoint, data) {
    const response = await fetch(API + endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || "Something went wrong."
        );
    }

    return result;
}

async function handleSignup() {
    const inputs =
        document.querySelectorAll("#signupBox input");

    const name = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const password = inputs[2].value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    try {
        const result = await apiRequest("/signup", {
            name: name,
            email: email,
            password: password
        });

        alert(result.message);

        showLogin();

        const loginInputs =
            document.querySelectorAll("#loginBox input");

        loginInputs[0].value = email;
        loginInputs[1].value = "";

    } catch (error) {
        alert(error.message);
    }
}

async function handleLogin() {
    const inputs =
        document.querySelectorAll("#loginBox input");

    const email = inputs[0].value.trim();
    const password = inputs[1].value;

    const remember =
        document.querySelector(
            "#loginBox input[type='checkbox']"
        ).checked;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {
        const result = await apiRequest("/login", {
            email: email,
            password: password
        });

        const user = result.user;

        if (remember) {
            localStorage.setItem(
                "examportal_user",
                JSON.stringify(user)
            );

            sessionStorage.removeItem(
                "examportal_user"
            );
        } else {
            sessionStorage.setItem(
                "examportal_user",
                JSON.stringify(user)
            );

            localStorage.removeItem(
                "examportal_user"
            );
        }

        closeModal();

        alert("Login successful. Now choose your class.");

        const classes =
            document.getElementById("classes");

        classes.classList.remove("hidden");

        classes.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        alert(error.message);
    }
}

async function selectClass(classNumber) {
    const user = getCurrentUser();

    if (!user) {
        alert("Please Login or Sign Up first.");
        showLogin();
        return;
    }

    try {
        await apiRequest("/set-class", {
            userId: user.id,
            classNumber: classNumber
        });

        user.classNumber = classNumber;

        if (localStorage.getItem("examportal_user")) {
            localStorage.setItem(
                "examportal_user",
                JSON.stringify(user)
            );
        } else {
            sessionStorage.setItem(
                "examportal_user",
                JSON.stringify(user)
            );
        }

        window.location.href = "dashboard.html";

    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const loginButton =
        document.querySelector("#loginBox .primary");

    const signupButton =
        document.querySelector("#signupBox .primary");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            handleLogin
        );
    }

    if (signupButton) {
        signupButton.addEventListener(
            "click",
            handleSignup
        );
    }

    document
        .querySelectorAll("#loginBox input")
        .forEach(function (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {
                        handleLogin();
                    }

                }
            );

        });

    document
        .querySelectorAll("#signupBox input")
        .forEach(function (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {
                        handleSignup();
                    }

                }
            );

        });

});
