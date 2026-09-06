let currentProjectProfile = null;
let allProjectDepartments = [];
let allProjectMembers = [];


/* LOAD PAGE */

async function loadProjectsPage() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        window.location.href = "login.html";
        return;

    }


    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (error) {

        console.error(error);
        return;

    }


    currentProjectProfile = profile;


    // Hide Add Project for normal employees

    const addButton =
        document.getElementById("addProjectBtn");


    if (
        profile.permission_level !== "EXECUTIVE"
    ) {

        addButton.style.display = "none";

    }


    await loadProjectData();

    loadProjects();

}



/* LOAD DEPARTMENTS + MEMBERS */

async function loadProjectData() {

    const {
        data: departments
    } = await supabaseClient
        .from("departments")
        .select("id, name")
        .order("name");


    allProjectDepartments =
        departments || [];


    const {
        data: members
    } = await supabaseClient
        .from("profiles")
        .select("id, name, role")
        .order("name");


    allProjectMembers =
        members || [];

}



/* LOAD PROJECTS */

async function loadProjects() {

    const list =
        document.getElementById("projectsList");


    const {
        data: projects,
        error
    } = await supabaseClient
        .from("projects")
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
            "<p>Unable to load projects.</p>";

        return;

    }


    if (
        !projects ||
        projects.length === 0
    ) {

        list.innerHTML = `

            <p class="empty-state">
                No projects created yet.
            </p>

        `;

        return;

    }


    list.innerHTML =
        projects.map(project => {


            const department =
                allProjectDepartments.find(
                    dept =>
                        dept.id ===
                        project.department_id
                );


            const manager =
                allProjectMembers.find(
                    member =>
                        member.id ===
                        project.project_manager_id
                );


            return `

                <div class="project-card">

                    <div class="project-card-top">

                        <span class="project-status ${getStatusClass(project.status)}">
                            ${project.status}
                        </span>
${currentProjectProfile.permission_level === "EXECUTIVE"
    ? `
        <button
            class="manage-team-btn"
            onclick="openProjectTeamModal('${project.id}')"
        >
            👥 Manage Team
        </button>
      `
    : ""
}
                    </div>


                    <h2>
                        ${project.name}
                    </h2>


                    <p class="project-description">
                        ${
                            project.description ||
                            "No description provided."
                        }
                    </p>


                    <div class="project-info">

                        <p>
                            🏢
                            ${
                                department
                                    ? department.name
                                    : "No Department"
                            }
                        </p>


                        <p>
                            👤
                            ${
                                manager
                                    ? manager.name
                                    : "No Manager"
                            }
                        </p>

                    </div>
                    <button
    class="view-project-btn"
    onclick="openProjectDetails('${project.id}')"
>
    View Details
</button>

                </div>

            `;

        }).join("");

}



/* STATUS CLASS */

function getStatusClass(status) {

    if (status === "Active") {
        return "status-active";
    }

    if (status === "Completed") {
        return "status-completed";
    }

    if (status === "On Hold") {
        return "status-hold";
    }

    return "status-planning";

}



/* OPEN MODAL */

const addProjectBtn =
    document.getElementById(
        "addProjectBtn"
    );


if (addProjectBtn) {

    addProjectBtn.addEventListener(
        "click",
        function () {

            fillProjectDropdowns();

            document
                .getElementById(
                    "projectModal"
                )
                .classList
                .remove("hidden");

        }
    );

}



/* CLOSE MODAL */

const closeProjectModal =
    document.getElementById(
        "closeProjectModal"
    );


if (closeProjectModal) {

    closeProjectModal.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "projectModal"
                )
                .classList
                .add("hidden");

        }
    );

}



/* FILL DROPDOWNS */

function fillProjectDropdowns() {

    const departmentSelect =
        document.getElementById(
            "projectDepartment"
        );


    const managerSelect =
        document.getElementById(
            "projectManager"
        );


    departmentSelect.innerHTML = `
        <option value="">
            No Department
        </option>
    `;


    managerSelect.innerHTML = `
        <option value="">
            No Manager
        </option>
    `;


    allProjectDepartments.forEach(
        department => {

            departmentSelect.innerHTML += `

                <option
                    value="${department.id}"
                >
                    ${department.name}
                </option>

            `;

        }
    );


    allProjectMembers.forEach(
        member => {

            managerSelect.innerHTML += `

                <option
                    value="${member.id}"
                >
                    ${member.name}
                    (${member.role || "Employee"})
                </option>

            `;

        }
    );

}



/* CREATE PROJECT */

const projectForm =
    document.getElementById(
        "projectForm"
    );


if (projectForm) {

    projectForm.addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            const {
                data: { user }
            } =
                await supabaseClient
                    .auth
                    .getUser();


            const name =
                document
                    .getElementById(
                        "projectName"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "projectDescription"
                    )
                    .value
                    .trim();


            const departmentId =
                document
                    .getElementById(
                        "projectDepartment"
                    )
                    .value;


            const managerId =
                document
                    .getElementById(
                        "projectManager"
                    )
                    .value;


            const status =
                document
                    .getElementById(
                        "projectStatus"
                    )
                    .value;


            const message =
                document
                    .getElementById(
                        "projectMessage"
                    );


            message.textContent =
                "Creating project...";


            const {
                error
            } =
                await supabaseClient
                    .from("projects")
                    .insert({

                        name: name,

                        description: description,

                        department_id:
                            departmentId || null,

                        project_manager_id:
                            managerId || null,

                        status: status,

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
                "Project created successfully!";


            projectForm.reset();


            await loadProjects();


            setTimeout(
                function () {

                    document
                        .getElementById(
                            "projectModal"
                        )
                        .classList
                        .add("hidden");

                },
                700
            );

        }

    );

}

let selectedProject = null;


/* OPEN PROJECT TEAM */

async function openProjectTeamModal(projectId) {

    selectedProject = projectId;


    const project = await supabaseClient
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();


    if (project.data) {

        document.getElementById(
            "projectTeamName"
        ).textContent =
            project.data.name;

    }


    document
        .getElementById(
            "projectTeamModal"
        )
        .classList
        .remove("hidden");


    await loadProjectTeam();

    fillProjectMemberSelect();

}



/* LOAD PROJECT TEAM */

async function loadProjectTeam() {

    const list =
        document.getElementById(
            "projectMembersList"
        );


    const {
        data: assignments,
        error
    } =
        await supabaseClient
            .from("project_members")
            .select("*")
            .eq(
                "project_id",
                selectedProject
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p>Unable to load team.</p>";

        return;

    }


    if (
        !assignments ||
        assignments.length === 0
    ) {

        list.innerHTML =
            "<p>No members assigned yet.</p>";

        return;

    }


    const memberIds =
        assignments.map(
            assignment =>
                assignment.user_id
        );


    const {
        data: members
    } =
        await supabaseClient
            .from("profiles")
            .select("id, name, role")
            .in("id", memberIds);


    list.innerHTML =
        members.map(member => `

            <div class="project-member-row">

                <div>

                    <strong>
                        ${member.name}
                    </strong>

                    <span>
                        ${member.role || "Employee"}
                    </span>

                </div>


                <button
                    class="remove-member-btn"
                    onclick="
                        removeProjectMember(
                            '${member.id}'
                        )
                    "
                >

                    Remove

                </button>

            </div>

        `).join("");

}



/* FILL MEMBER DROPDOWN */

function fillProjectMemberSelect() {

    const select =
        document.getElementById(
            "projectMemberSelect"
        );


    select.innerHTML = `
        <option value="">
            Select member
        </option>
    `;


    allProjectMembers.forEach(member => {

        select.innerHTML += `

            <option
                value="${member.id}"
            >
                ${member.name}
            </option>

        `;

    });

}



/* ADD PROJECT MEMBER */

const addProjectMemberBtn =
    document.getElementById(
        "addProjectMemberBtn"
    );


if (addProjectMemberBtn) {

    addProjectMemberBtn.addEventListener(
        "click",

        async function () {

            const userId =
                document.getElementById(
                    "projectMemberSelect"
                ).value;


            const message =
                document.getElementById(
                    "projectTeamMessage"
                );


            if (!userId) {

                message.textContent =
                    "Select a member.";

                return;

            }


            message.textContent =
                "Adding member...";


            const { error } =
                await supabaseClient
                    .from("project_members")
                    .insert({

                        project_id:
                            selectedProject,

                        user_id:
                            userId

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Member added!";


            await loadProjectTeam();

        }

    );

}



/* REMOVE MEMBER */

async function removeProjectMember(userId) {

    const message =
        document.getElementById(
            "projectTeamMessage"
        );


    const { error } =
        await supabaseClient
            .from("project_members")
            .delete()
            .eq(
                "project_id",
                selectedProject
            )
            .eq(
                "user_id",
                userId
            );


    if (error) {

        console.error(error);

        message.textContent =
            error.message;

        return;

    }


    message.textContent =
        "Member removed.";


    await loadProjectTeam();

}



/* CLOSE TEAM MODAL */

const closeProjectTeamModal =
    document.getElementById(
        "closeProjectTeamModal"
    );


if (closeProjectTeamModal) {

    closeProjectTeamModal.addEventListener(
        "click",

        function () {

            document
                .getElementById(
                    "projectTeamModal"
                )
                .classList
                .add("hidden");

        }

    );

}

async function openProjectDetails(projectId) {

    console.log("Opening project:", projectId);

    const modal =
        document.getElementById(
            "projectDetailsModal"
        );

    if (!modal) {

        console.error(
            "Project details modal not found!"
        );

        return;

    }


    modal.classList.remove("hidden");


    const {
        data: project,
        error
    } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();


    if (error) {

        console.error(
            "Project error:",
            error
        );

        return;

    }


    const department =
        allProjectDepartments.find(
            dept =>
                dept.id === project.department_id
        );


    const manager =
        allProjectMembers.find(
            member =>
                member.id ===
                project.project_manager_id
        );


    document.getElementById(
        "detailProjectName"
    ).textContent =
        project.name;


    document.getElementById(
        "detailProjectStatus"
    ).textContent =
        project.status || "-";


    document.getElementById(
        "detailProjectDepartment"
    ).textContent =
        department
            ? department.name
            : "No Department";


    document.getElementById(
        "detailProjectManager"
    ).textContent =
        manager
            ? manager.name
            : "No Manager";


    document.getElementById(
        "detailProjectDescription"
    ).textContent =
        project.description ||
        "No description provided.";


    await loadProjectDetailsMembers(
        projectId
    );

}


/* LOAD PROJECT DETAILS MEMBERS */

async function loadProjectDetailsMembers(projectId) {

    const container =
        document.getElementById(
            "detailProjectMembers"
        );


    const {
        data: assignments,
        error
    } = await supabaseClient
        .from("project_members")
        .select("*")
        .eq(
            "project_id",
            projectId
        );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load members.</p>";

        return;

    }


    if (!assignments || assignments.length === 0) {

        container.innerHTML =
            "<p>No team members assigned yet.</p>";

        return;

    }


    const memberIds =
        assignments.map(
            assignment =>
                assignment.user_id
        );


    const members =
        allProjectMembers.filter(
            member =>
                memberIds.includes(member.id)
        );


    container.innerHTML =
        members.map(member => `

            <div class="detail-member">

                <div class="detail-member-avatar">
                    ${member.name.charAt(0).toUpperCase()}
                </div>

                <div>

                    <strong>
                        ${member.name}
                    </strong>

                    <span>
                        ${member.role || "Employee"}
                    </span>

                </div>

            </div>

        `).join("");

}

/* CLOSE PROJECT DETAILS MODAL */

const closeProjectDetailsModal =
    document.getElementById(
        "closeProjectDetailsModal"
    );

if (closeProjectDetailsModal) {

    closeProjectDetailsModal.addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "projectDetailsModal"
                )
                .classList
                .add("hidden");

        }
    );

}

loadProjectsPage();