# Exam City 🎓

An intelligent, AI-powered mock examination platform tailored for WAEC, JAMB, and NECO candidates. Exam City provides standard past questions alongside AI-generated predictive mock exams to help students prepare effectively.

## ✨ Features

- **Dual Question Banks:** Access a standard public bank of past questions and a premium AI-predictive question bank.
- **Micro & Standard Modes:** Choose between rapid 5-question targeted sessions or full 40-question standard exams.
- **Audio Accessibility:** Built-in Text-to-Speech (TTS) integration to read out questions and options.
- **Real-time Grading:** Instant assessment and detailed breakdown of exam results.
- **AI Explanations:** Powered by Google Gemini to explain incorrect answers and act as a study coach.
- **Offline Output:** Generate and print offline PDFs of exams for physical practice.
- **User Dashboard:** Track performance trends, total tests taken, and overall readiness. 

## 🌐 Live Demo

You can view the live application here: [https://exam-city.vercel.app](https://exam-city.vercel.app) *(Replace this with your actual Vercel deployment URL)*

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **Database & Auth:** Firebase (Firestore, Authentication)
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Passenger-rex/exam-city.git
   cd exam-city
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   *Note: You will need your Firebase configuration and a Google Gemini API Key.*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📦 Deployment (Vercel)

This application is configured for Vercel deployment with Serverless Functions (`vercel.json` included).

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` to link the project.
3. Run `vercel --prod` to deploy to production.
Make sure to add your environment variables in the Vercel project settings!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/Passenger-rex/exam-city/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📫 Contact

John Tobi - johntobismart@gmail.com

Project Link: [https://github.com/Passenger-rex/exam-city](https://github.com/Passenger-rex/exam-city)
