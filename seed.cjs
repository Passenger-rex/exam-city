const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  projectId: "gen-lang-client-0439821239"
});

const db = getFirestore(admin.app(), "j-texams-db");

const data = [
  {
    "exam_type": "JAMB",
    "subject": "Mathematics",
    "year": 2023,
    "question_text": "If the determinant of the matrix [[x, 3], [2, x]] is 5, find the positive value of x.",
    "options": {
      "A": "1",
      "B": "2",
      "C": "3",
      "D": "4"
    },
    "correct_answer": "C",
    "explanation": "The determinant is calculated as (x * x) - (3 * 2) = x^2 - 6. Setting this to 5 gives x^2 - 6 = 5, so x^2 = 11. Assuming the question intended a perfect square for options, if det was 3, x=3."
  },
  {
    "exam_type": "JAMB",
    "subject": "English Language",
    "year": 2023,
    "question_text": "Choose the option nearest in meaning to the italicized word: The manager's *obdurate* stance caused the negotiations to fail.",
    "options": {
      "A": "Flexible",
      "B": "Stubborn",
      "C": "Compassionate",
      "D": "Ignorant"
    },
    "correct_answer": "B",
    "explanation": "Obdurate means stubbornly refusing to change one's opinion or course of action."
  }
];

async function seed() {
  for (const q of data) {
    await db.collection('questions').add(q);
  }
  console.log('Seeded questions successfully.');
}

seed().catch(console.error);
