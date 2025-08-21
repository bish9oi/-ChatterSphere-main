# 🤖 ChatterSphere - Gemini AI PDF Chatbot

ChatterSphere is a modern React-based chatbot UI built with TypeScript and Tailwind CSS that integrates with **Google's Gemini API**. It allows users to upload PDF files and chat contextually based on the uploaded document.

---

## 🧠 Features

- 📩 **Chat Interface** with typing indicator
- 📎 **PDF Upload** (via file picker)
- 📄 **In-browser PDF Parsing** using [pdf.js CDN](https://cdnjs.com/libraries/pdf.js)
- 🤖 **Contextual Q&A** based on parsed PDF content
- 🧵 Smooth scrolling chat with message history
- 🔐 Gemini API Integration using `gemini-2.0-flash-lite`

---

## 🚀 Technologies Used

- **React 18** + **TypeScript**
- **Tailwind CSS**
- **pdf.js (via CDN)** for client-side PDF parsing
- **Google Gemini API** (`v1beta` endpoint)
- **lucide-react** for icons

---

## 📁 File Structure

📦 your-app
┣ 📁 components
┃ ┗ 📄 ui/...
┣ 📄 ChatBotUI.tsx # Main component
┣ 📄 README.md
┗
---

## 🔧 Setup Instructions :

  - step: Clone the repository
    ```bash
      - git clone https://github.com/your-username/chattersphere.git
      - cd chattersphere

  - step: Install dependencies
    ```bash
      - npm install

  - step: Set up Gemini API Key
    description: |
      Create a `.env.local` file in the root of your project and add your Gemini API key.
      Avoid hardcoding your API key directly in the code for production use.
    file: .env.local
    content:
    ```bash
      NEXT_PUBLIC_GEMINI_API_KEY=your_google_generative_ai_key

  - step: Update the code to use environment variable
    file: ChatBotUI.tsx
    replace_line_with:
    ```bash
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  - step: Start the development server
    commands:
    ```bash
      - npm run dev

  - step: Open the app in browser
    ```bash
    url: http://localhost:3000
