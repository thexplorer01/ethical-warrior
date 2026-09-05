// REGISTER

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("message");

        message.textContent = "Creating account...";

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) {
            message.textContent = error.message;
            return;
        }

        message.textContent =
            "Account created!";

        registerForm.reset();
    });
}

// Login Code 

// LOGIN

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("message");

        message.textContent = "Logging in...";

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            message.textContent = error.message;
            return;
        }

        window.location.href = "dashboard.html";
    });
}



// DASHBOARD

async function loadDashboard() {

    const greeting = document.getElementById("greeting");

    if (!greeting) return;

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const name = user.user_metadata?.name || "Employee";

    greeting.textContent = `Good afternoon, ${name}`;
}


// LOGOUT

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    });
}

loadDashboard();