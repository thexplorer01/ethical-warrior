let currentProfile = null;


// LOAD PAGE

async function loadDepartmentsPage() {

    const {
        data: { user }
    } =
        await supabaseClient
            .auth
            .getUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    // GET CURRENT PROFILE

    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();


    if (error) {

        console.error(error);

        return;

    }


    currentProfile = profile;


    // ONLY EXECUTIVE SEES ADD BUTTON

    const addButton =
        document.getElementById(
            "addDepartmentBtn"
        );


    if (
        profile.permission_level !==
        "EXECUTIVE"
    ) {

        addButton.style.display =
            "none";

    }


    loadDepartments();

}



// LOAD DEPARTMENTS

async function loadDepartments() {

    const list =
        document.getElementById(
            "departmentsList"
        );


    const {
        data: departments,
        error
    } =
        await supabaseClient
            .from("departments")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p>Unable to load departments.</p>";

        return;

    }


    if (
        !departments ||
        departments.length === 0
    ) {

        list.innerHTML = `

            <p class="empty-state">
                No departments created yet.
            </p>

        `;

        return;

    }


    // GET ALL MEMBERS

    const {
        data: members
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, department_id"
            );


    // RENDER

    list.innerHTML =
        departments.map(
            department => {


                const memberCount =
                    members.filter(
                        member =>

                            member.department_id ===
                            department.id

                    ).length;


                return `

                    <div
                        class="department-card"
                    >

                        <div
                            class="department-icon"
                        >
                            🏢
                        </div>


                        <h2>
                            ${department.name}
                        </h2>


                        <p>
                            ${
                                department.description ||
                                "No description provided."
                            }
                        </p>


                        <div
                            class="department-footer"
                        >

                            <span>

                                👥
                                ${memberCount}
                                Members

                            </span>


                            <span>
                                Department
                            </span>

                        </div>

                    </div>

                `;

            }

        ).join("");

}



// MODAL

const addDepartmentBtn =
    document.getElementById(
        "addDepartmentBtn"
    );


if (addDepartmentBtn) {

    addDepartmentBtn.addEventListener(
        "click",

        function () {

            document
                .getElementById(
                    "departmentModal"
                )
                .classList
                .remove("hidden");

        }

    );

}


const closeDepartmentModal =
    document.getElementById(
        "closeDepartmentModal"
    );


if (closeDepartmentModal) {

    closeDepartmentModal.addEventListener(
        "click",

        function () {

            document
                .getElementById(
                    "departmentModal"
                )
                .classList
                .add("hidden");

        }

    );

}



// CREATE DEPARTMENT

const departmentForm =
    document.getElementById(
        "departmentForm"
    );


if (departmentForm) {

    departmentForm.addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "departmentName"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "departmentDescription"
                    )
                    .value
                    .trim();


            const message =
                document
                    .getElementById(
                        "departmentMessage"
                    );


            const {
                data: { user }
            } =
                await supabaseClient
                    .auth
                    .getUser();


            message.textContent =
                "Creating department...";


            const {
                error
            } =
                await supabaseClient
                    .from("departments")
                    .insert({

                        name:
                            name,

                        description:
                            description,

                        created_by:
                            user.id

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Department created!";


            departmentForm.reset();


            loadDepartments();


            setTimeout(

                function () {

                    document
                        .getElementById(
                            "departmentModal"
                        )
                        .classList
                        .add("hidden");

                },

                700

            );

        }

    );

}


loadDepartmentsPage();