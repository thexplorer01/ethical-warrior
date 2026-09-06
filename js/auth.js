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



/// DASHBOARD

async function loadDashboard() {

    const greeting = document.getElementById("greeting");

    if (!greeting) return;

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
     .select("*")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error(error);
        greeting.textContent = "Unable to load profile";
        return;
    }

    const name =
        profile.name ||
        user.user_metadata?.name ||
        "Employee";

    greeting.textContent = `Good afternoon, ${name}`;

    document.getElementById("roleText")?.remove();

    document.getElementById("points").textContent =
        profile.points ?? 0;

    document.getElementById("status").textContent =
        profile.status || "Member";

    document.getElementById("department").textContent =
    profile.departments
        ? profile.departments.name
        : "Not assigned";
    const avatar = document.getElementById("avatar");

    if (avatar) {
        avatar.textContent =
            name.charAt(0).toUpperCase();
    }
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

// PEOPLE

async function loadPeople() {

    const peopleList = document.getElementById("peopleList");

    if (!peopleList) return;

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Get all people first
    const { data: people, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .order("points", { ascending: false });

    if (error) {
        console.error("People error:", error);
        peopleList.innerHTML = "<p>Unable to load members.</p>";
        return;
    }

    // Get departments separately
    const { data: departments, error: departmentError } =
        await supabaseClient
            .from("departments")
            .select("id, name");

    if (departmentError) {
        console.error("Department error:", departmentError);
    }

    if (!people || people.length === 0) {
        peopleList.innerHTML =
            "<p class='empty-state'>No members found.</p>";
        return;
    }

    peopleList.innerHTML = people.map(person => {

        const name = person.name || "Employee";

        // Find person's department
        const department = departments?.find(
            dept => dept.id === person.department_id
        );

        const departmentName = department
            ? department.name
            : "";

        return `
            <div class="person-row">

                <div class="person-avatar">
                    ${name.charAt(0).toUpperCase()}
                </div>

                <div class="person-info">

                    <strong>${name}</strong>

                    <span>
                        ${person.role || "Employee"}
                        ${departmentName
                            ? " • " + departmentName
                            : ""}
                    </span>

                </div>

                <div class="person-points">

                    <strong>${person.points ?? 0}</strong>

                    <span>points</span>

                </div>

                <div class="person-status">
                    ${person.status || "Member"}
                </div>

            </div>
        `;

    }).join("");
}


loadPeople();