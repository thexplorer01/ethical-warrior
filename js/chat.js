let currentChatUser = null;
let allChatProfiles = [];


/* LOAD CHAT PAGE */

async function loadChatPage() {

    const {
        data: { user }
    } = await supabaseClient
        .auth
        .getUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    currentChatUser = user;


    // Load profiles first

    const {
        data: profiles,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("id, name");


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

    }


    allChatProfiles =
        profiles || [];


    await loadMessages();

    subscribeToMessages();

}



/* LOAD MESSAGES */

async function loadMessages() {

    const messagesList =
        document.getElementById(
            "messagesList"
        );


    const {
        data: messages,
        error
    } = await supabaseClient
        .from("messages")
        .select("*")
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Message error:",
            error
        );


        messagesList.innerHTML =
            "<p>Unable to load messages.</p>";

        return;

    }


    if (
        !messages ||
        messages.length === 0
    ) {

        messagesList.innerHTML = `

            <div class="empty-chat">

                <div class="empty-chat-icon">
                    💬
                </div>

                <h3>
                    No messages yet
                </h3>

                <p>
                    Start the conversation!
                </p>

            </div>

        `;

        return;

    }


    messagesList.innerHTML =
        messages.map(message => {


            const sender =
                allChatProfiles.find(
                    profile =>
                        profile.id ===
                        message.user_id
                );


            const senderName =
                sender
                    ? sender.name
                    : "Unknown Member";


            const isOwnMessage =
                message.user_id ===
                currentChatUser.id;


            const date =
                new Date(
                    message.created_at
                );


            const time =
                date.toLocaleTimeString(
                    [],
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
                    }
                );


            return `

                <div
                    class="message-row ${
                        isOwnMessage
                            ? "own-message"
                            : ""
                    }"
                >


                    <div class="message-bubble">


                        <div class="message-sender">

                            ${senderName}

                        </div>


                        <div class="message-text">

                            ${message.message}

                        </div>


                        <div class="message-time">

                            ${time}

                        </div>


                    </div>


                </div>

            `;

        }).join("");


    // Scroll to newest message

    messagesList.scrollTop =
        messagesList.scrollHeight;

}



/* SEND MESSAGE */

const messageForm =
    document.getElementById(
        "messageForm"
    );


if (messageForm) {

    messageForm.addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            const input =
                document.getElementById(
                    "messageInput"
                );


            const status =
                document.getElementById(
                    "messageStatus"
                );


            const message =
                input.value.trim();


            if (!message) {

                return;

            }


            input.disabled = true;


            status.textContent =
                "Sending...";


            const {
                error
            } = await supabaseClient
                .from("messages")
                .insert({

                    user_id:
                        currentChatUser.id,

                    message:
                        message

                });


            input.disabled = false;


            if (error) {

                console.error(error);

                status.textContent =
                    error.message;

                return;

            }


            input.value = "";


            status.textContent = "";


            input.focus();

        }

    );

}



/* START */

/* REALTIME CHAT */

function subscribeToMessages() {

    supabaseClient
        .channel("company-chat")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages"
            },

            async () => {

                await loadMessages();

            }
        )

        .subscribe();

}

loadChatPage();