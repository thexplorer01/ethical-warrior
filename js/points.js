async function loadPointsPage() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }


    // GET CURRENT PROFILE

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("points, name")
        .eq("id", user.id)
        .single();


    if (error) {
        console.error(error);
        return;
    }


    document.getElementById("currentPoints").textContent =
        profile.points ?? 0;


    // AVATAR

    const avatar = document.getElementById("avatar");

    if (avatar) {

        avatar.textContent =
            profile.name.charAt(0).toUpperCase();

    }


    // LOAD HISTORY

    loadPointsHistory(user.id);

}



async function loadPointsHistory(userId) {

    const history =
        document.getElementById("pointsHistory");


    const { data: transactions, error } =
        await supabaseClient
            .from("point_transactions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        history.innerHTML =
            "<p>Unable to load history.</p>";

        return;
    }


    if (!transactions || transactions.length === 0) {

        history.innerHTML = `
            <p class="empty-state">
                No point activity yet.
            </p>
        `;

        return;
    }


    history.innerHTML =
        transactions.map(transaction => {

            const amount =
                transaction.amount;


            const sign =
                amount > 0 ? "+" : "";


            const date =
                new Date(
                    transaction.created_at
                ).toLocaleString();


            return `

                <div class="transaction-row">

                    <div>

                        <strong>
                            ${transaction.reason}
                        </strong>

                        <span>
                            ${transaction.category}
                            •
                            ${date}
                        </span>

                    </div>


                    <div class="transaction-amount">

                        ${sign}${amount}

                    </div>

                </div>

            `;

        }).join("");

}



// SUBMIT POINTS

const pointsForm =
    document.getElementById("pointsForm");


if (pointsForm) {

    pointsForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "pointsMessage"
                );


            const {
                data: { user }
            } =
                await supabaseClient
                    .auth
                    .getUser();


            const action =
                document.getElementById(
                    "pointAction"
                ).value;


            let amount =
                Number(
                    document.getElementById(
                        "pointAmount"
                    ).value
                );


            const reason =
                document.getElementById(
                    "pointReason"
                ).value
                .trim();


            const category =
                document.getElementById(
                    "pointCategory"
                ).value;


            // MAKE NEGATIVE

            if (action === "remove") {

                amount = -amount;

            }


            message.textContent =
                "Updating points...";


            const { error } =
                await supabaseClient
                    .from("point_transactions")
                    .insert({

                        user_id:
                            user.id,

                        amount:
                            amount,

                        reason:
                            reason,

                        category:
                            category,

                        created_by:
                            user.id,

                        source:
                            "Manual"

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    error.message;

                return;

            }


            message.textContent =
                "Points updated successfully!";


            pointsForm.reset();


            loadPointsPage();

        }
    );

}


loadPointsPage();