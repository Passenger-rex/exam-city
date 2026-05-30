# Exam City 🎓

An intelligent, AI-powered mock examination platform tailored for WAEC, JAMB, NECO candidates, and university-level or professional certification test takers. Exam City provides standard past questions alongside AI-generated predictive mock exams, providing a hyper-realistic and intellectually rigorous testing environment.

## ✨ Features

- **Dual Question Banks:** Access an authentic public bank of past questions powered by the [ALOC Past Questions API](https://questions.aloc.com.ng/).
- **AI-Powered Fallback & Rigor Engine:** Powered by Google Gemini (`@google/genai`). If a specific subject or topic isn't found in the past question database, Exam City utilizes AI to generate highly rigorous, multi-disciplinary questions.
- **Deep Scenarios & Mixed Modalities:** The engine generates diverse question sets encompassing "clinical vignettes", "gross anatomy", "histology", "pathophysiology", and deep theoretical reasoning, guaranteeing you get well-rounded practice not basic memory recall.
- **Micro & Standard Modes:** Choose between rapid 5-question micro-targeted sessions or full 40-question standard exams.
- **Audio Accessibility:** Built-in Text-to-Speech (TTS) integration to read out questions and options.
- **Real-time Grading:** Instant assessment and detailed breakdown of exam results.
- **AI Explanations:** Powered by Google Gemini to explain incorrect answers and act as a study coach.
- **Offline Output:** Generate and print offline PDFs of exams for physical practice.
- **User Dashboard:** Track performance trends, total tests taken, and overall readiness. 

## 🔌 API Integrations & Data Sources

1. **ALOC API (`questions.aloc.com.ng`)** 
   Provides real past questions for Nigerian subjects including: 
   Mathematics, English, Biology, Chemistry, Physics, Economics, Geography, Government, Literature, CRK, IRK, Commerce, Accounting, Agric, and Civic Education.
2. **Google Gemini (`@google/genai`)**
   Used for dynamic question generation, rigorous fallback mechanisms, mixing clinical and normal question variants, and step-by-step explanatory coaching.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express (Single server ESM setup with `tsx` & `esbuild`)
- **Database & Auth:** Firebase (Firestore, Authentication)
- **APIs:** ALOC Past Question API, Google GenAI SDK
- **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your machine.

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
   *Required Keys:*
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `VITE_ALOC_ACCESS_TOKEN`: Your ALOC API Access Token (Defaults safely to public testing token if omitted).
   - `VITE_FIREBASE_*`: Firebase configuration keys.

4. Start the development server (runs both frontend Vite and Express backend on port 3000):
   ```bash
   npm run dev
   ```

## 📦 Building & Deployment

Exam City uses a single-server Express architecture capable of being deployed as a monolithic full-stack app.

```bash
npm run build
npm run start
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/Passenger-rex/exam-city/issues).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📫 Contact

John Tobi - johntobismart@gmail.com

Project Link: [https://github.com/Passenger-rex/exam-city](https://github.com/Passenger-rex/exam-city)
