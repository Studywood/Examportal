
function showClasses() {
    document.getElementById("classes").classList.remove("hidden");

    document.getElementById("classes").scrollIntoView({
        behavior: "smooth"
    });
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

function selectClass(classNumber) {
    alert("You selected Class " + classNumber);
}
