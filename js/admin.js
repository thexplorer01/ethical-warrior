let allMembers = [];
let selectedMember = null;


async function loadAdminPage() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        window.location.href = "login.html";

        return;

    }


    // GET CURRENT USER PROFILE

    const {
        data: currentProfile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (profileError) {

        console.error(profileError);

        return;

    }


    // CHECK EXECUTIVE PERMISSION

    if (
        currentProfile.permission_level !== "EXECUTIVE"
    ) {

        document.querySelector(".main-content").innerHTML = `

            <div class="access-denied">

                <h1>
                    Access Denied
                </h1>

                <p>
                    You do not have permission
                    to access Management.
                </p>

                <a
                    href="dashboard.html"
                    class="btn"
                >

                    Return to Dashboard

                </a>

            </div>

        `;

        return;

    }


    // AVATAR

    const avatar =
        document.getElementById("avatar");


    if (avatar) {

        avatar.textContent =
            currentProfile.name
                .charAt(0)
                .toUpperCase();

    }


    loadMembers();

}



async function loadMembers() {

    const list =
        document.getElementById(
            "adminPeopleList"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .order(
                "points",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "Unable to load members.";

        return;

    }


    allMembers = data;

    renderMembers(data);

}



function renderMembers(members) {

    const list =
        document.getElementById(
            "adminPeopleList"
        );


    list.innerHTML =
        members.map(member => {

            const name =
                member.name || "Employee";


            return `

                <div
                    class="person-row"
                >

                    <div
                        class="person-avatar"
                    >

                        ${name
                            .charAt(0)
                            .toUpperCase()}

                    </div>


                    <div
                        class="person-info"
                    >

                        <strong>
                            ${name}
                        </strong>

                        <span>

                            ${member.role}

                        </span>

                    </div>


                    <div
                        class="person-points"
                    >

                        <strong>

                            ${member.points ?? 0}

                        </strong>

                        <span>
                            points
                        </span>

                    </div>


    <div class="member-actions">

         <button
              class="manage-points-btn"
             onclick="openPointModal('${member.id}')"
         >   
          Manage Points
         </button>

    <button
        class="assign-department-btn"
        onclick="openDepartmentModal('${member.id}')"
    >
        Assign Department
    </button>

</div>

                </div>

            `;

        }).join("");

}



// SEARCH

const memberSearch =
    document.getElementById(
        "memberSearch"
    );


if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase();


            const filtered =
                allMembers.filter(
                    member =>

                        member.name
                            .toLowerCase()
                            .includes(search)

                );


            renderMembers(filtered);

        }
    );

}



// OPEN MODAL

function openPointModal(memberId) {

    selectedMember =
        allMembers.find(
            member =>
                member.id === memberId
        );


    if (!selectedMember) return;


    document.getElementById(
        "selectedMemberName"
    ).textContent =
        selectedMember.name;


    document
        .getElementById("pointModal")
        .classList
        .remove("hidden");

}



// CLOSE MODAL

const closeModal =
    document.getElementById(
        "closeModal"
    );


if (closeModal) {

    closeModal.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "pointModal"
                )
                .classList
                .add("hidden");

        }
    );

}



// SUBMIT ADMIN POINTS

const adminPointsForm =
    document.getElementById(
        "adminPointsForm"
    );


if (adminPointsForm) {

    adminPointsForm.addEventListener(
        "submit",

        async function (event) {

            event.preventDefault();


            if (!selectedMember) {

                return;

            }


            const {
                data: { user }
            } =
                await supabaseClient
                    .auth
                    .getUser();


            let amount =
                Number(
                    document.getElementById(
                        "adminPointAmount"
                    ).value
                );


            const action =
                document.getElementById(
                    "adminPointAction"
                ).value;


            if (
                action === "remove"
            ) {

                amount = -amount;

            }


            const reason =
                document.getElementById(
                    "adminPointReason"
                ).value;


            const category =
                document.getElementById(
                    "adminPointCategory"
                ).value;


            const message =
                document.getElementById(
                    "adminPointsMessage"
                );


            message.textContent =
                "Updating points...";


            const { error } =
                await supabaseClient
                    .from(
                        "point_transactions"
                    )
                    .insert({

                        user_id:
                            selectedMember.id,

                        amount:
                            amount,

                        reason:
                            reason,

                        category:
                            category,

                        created_by:
                            user.id,

                        source:
                            "Management"

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Points updated!";


            adminPointsForm.reset();


            loadMembers();


            setTimeout(
                () => {

                    document
                        .getElementById(
                            "pointModal"
                        )
                        .classList
                        .add("hidden");

                },

                800
            );

        }

    );

}

let selectedDepartmentMember = null;
let allDepartments = [];


// LOAD DEPARTMENTS

async function loadDepartmentsForAssignment() {

    const { data, error } = await supabaseClient
        .from("departments")
        .select("id, name")
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    allDepartments = data || [];

}


// OPEN DEPARTMENT MODAL

async function openDepartmentModal(memberId) {

    selectedDepartmentMember = allMembers.find(
        member => member.id === memberId
    );

    if (!selectedDepartmentMember) return;


    document.getElementById(
        "departmentMemberName"
    ).textContent =
        selectedDepartmentMember.name;


    await loadDepartmentsForAssignment();


    const select =
        document.getElementById(
            "departmentSelect"
        );


    select.innerHTML = `
        <option value="">
            Select a department
        </option>
    `;


    allDepartments.forEach(department => {

        select.innerHTML += `
            <option value="${department.id}">
                ${department.name}
            </option>
        `;

    });


    // Select current department if assigned

    if (
        selectedDepartmentMember.department_id
    ) {

        select.value =
            selectedDepartmentMember.department_id;

    }


    document
        .getElementById(
            "departmentAssignModal"
        )
        .classList
        .remove("hidden");

}


// CLOSE MODAL

const closeDepartmentAssignModal =
    document.getElementById(
        "closeDepartmentAssignModal"
    );


if (closeDepartmentAssignModal) {

    closeDepartmentAssignModal.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "departmentAssignModal"
                )
                .classList
                .add("hidden");

        }
    );

}


// ASSIGN DEPARTMENT

const assignDepartmentForm =
    document.getElementById(
        "assignDepartmentForm"
    );


if (assignDepartmentForm) {

    assignDepartmentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!selectedDepartmentMember) return;


            const departmentId =
                document.getElementById(
                    "departmentSelect"
                ).value;


            const message =
                document.getElementById(
                    "assignDepartmentMessage"
                );


            if (!departmentId) {

                message.textContent =
                    "Please select a department.";

                return;

            }


            message.textContent =
                "Assigning department...";


            const { error } =
                await supabaseClient
                    .from("profiles")
                    .update({

                        department_id:
                            departmentId

                    })
                    .eq(
                        "id",
                        selectedDepartmentMember.id
                    );


            if (error) {

                console.error(error);

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Department assigned successfully!";


            // Reload members

            await loadMembers();


            setTimeout(
                function () {

                    document
                        .getElementById(
                            "departmentAssignModal"
                        )
                        .classList
                        .add("hidden");

                },
                700
            );

        }
    );

}

loadAdminPage();