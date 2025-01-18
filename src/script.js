const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#detele-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_URL_BASE = "http://localhost:8000/api/v1/";

const loadLocalstorageData = () => {
  const saveChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  //Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Restore saved chats
  chatList.innerHTML = saveChats || "";

  document.body.classList.toggle("hide-header", saveChats);
  chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
};

loadLocalstorageData();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currenWordIndex = 0;

  const typingInterval = setInterval(() => {
    // Append each word to the text element with a space
    textElement.innerText +=
      (currenWordIndex === 0 ? "" : " ") + words[currenWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    //If all words are displayed
    if (currenWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); //Save chats to local storage
    }
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
  }, 75);
};

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); // Get text element
  // Send a POST request to the API with the user's message

  const params = new URLSearchParams({
    question: userMessage,
    max_retrieve_try: 2,
    max_generation_try: 2,
  });

  const fetchUrl = new URL("./chat", API_URL_BASE);
  fetchUrl.search = "?" + params.toString();

  try {
    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Get the API response text and remove asterisks from it
    const apiResponse = data.answer;
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

//Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `  <div class="message-content">
                        <img src="gemini.jpg" alt="Gemini Image" class="avatar">
                        <p class="text"></p>
                        <div class="loading-indicator">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                        </div>
                    </div>
                    <span onclick="copyMessage(this)" class="icon 
                    material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
};

// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; // Show tick icon
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000); // Revert icon after 1 second
};

//Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; // Exit if there is no message

  isResponseGenerating = true;

  const html = `<div class="message-content">
                <img src="user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //Clear input field
  chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
  document.body.classList.add("hide-header"); // Hide the header once that start
  setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
};

//Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to detele all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalstorageData();
  }
});

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
