const API = "https://examportal-api.abhinandanofficial-naha.workers.dev";


// ============================================
// GET CURRENT USER
// ============================================

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


// ============================================
// LOGIN MODAL
// ============================================

function showLogin() {

    document.getElementById("signupBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
}


// ============================================
// SIGN UP MODAL
// ============================================

function showSignup() {

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("signupBox").classList.remove("hidden");
}


// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("signupBox").classList.add("hidden");
}


// ============================================
// START TEST
// ============================================

function showClasses() {

    const user = getCurrentUser();

    // User must be logged in first
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


// ============================================
// API REQUEST
// ============================================

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


// ============================================
// SIGN UP
// ============================================

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


        alert(
            result.message +
            "\n\nYou can now login."
        );


        // Switch to login
        showLogin();


        // Automatically put email into login field
        const loginInputs =
            document.querySelectorAll("#loginBox input");

        loginInputs[0].value = email;

        loginInputs[1].value = "";


    } catch (error) {

        alert(error.message);

    }
}


// ============================================
// LOGIN
// ============================================

async function handleLogin() {

    const inputs =
        document.querySelectorAll("#loginBox input");


    const email =
        inputs[0].value.trim();

    const password =
        inputs[1].value;


    const remember =
        document.querySelector(
            "#loginBox input[type='checkbox']"
        ).checked;


    if (!email || !password) {

        alert(
            "Please enter your email and password."
        );

        return;
    }


    try {

        const result =
            await apiRequest("/login", {

                email: email,

                password: password

            });


        const user = result.user;


        // Remember me ON → localStorage
        // Remember me OFF → sessionStorage

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


        alert(
            "Login successful.\n\nNow choose your class."
        );


        // Show classes
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


// ============================================
// SELECT CLASS
// ============================================

async function selectClass(classNumber) {

    const user = getCurrentUser();


    // Not logged in
    if (!user) {

        alert(
            "Please Login or Sign Up first."
        );

        showLogin();

        return;
    }


    try {

        await apiRequest("/set-class", {

            userId: user.id,

            classNumber: classNumber

        });


        // Update local user information

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


        // Go to dashboard

        window.location.href =
            "dashboard.html";


    } catch (error) {

        alert(error.message);

    }
}


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        // Login button
        const loginButton =
            document.querySelector(
                "#loginBox .primary"
            );


        // Signup button
        const signupButton =
            document.querySelector(
                "#signupBox .primary"
            );


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


        // Press Enter to login

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


        // Press Enter to signup

       
