const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamPage.tsx', 'utf8');

const startStr = '        try {\n          const { GoogleGenAI, Type } = await import("@google/genai");';
const endStr = '        } catch (genErr) {\n          console.error("Error generating questions with Gemini: ", genErr);\n        }';

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `        try {
          const res = await fetch(\`/api/questions?subject=\${encodeURIComponent(targetSubject)}&year=\${encodeURIComponent(yearParam)}&type=\${encodeURIComponent(typeParam)}\`);
          if (!res.ok) throw new Error("Failed to fetch questions");
          const json = await res.json();
          if (json.success && json.data && Array.isArray(json.data)) {
            qList = json.data.map((item) => ({
              id: String(item.id),
              question_html: item.question,
              options: item.option,
              correct_answer: item.answer,
              subject: json.subject || targetSubject,
              explanation: item.solution,
              year: item.examyear || yearParam,
              isPremium: bankParam === "premium"
            }));
          }
        } catch (genErr) {
          console.error("Error fetching questions from API: ", genErr);
        }`;
  
  const newCode = code.slice(0, startIdx) + replacement + code.slice(endIdx + endStr.length);
  fs.writeFileSync('src/pages/ExamPage.tsx', newCode);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find start or end.", startIdx, endIdx);
}
