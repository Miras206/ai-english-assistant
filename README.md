# AI English Lesson Builder — AI v4

This is the approved mockup connected to the live Cloudflare Workers AI backend.

Worker API:
https://ai-english-lesson-builder-api.mahanmadi2007.workers.dev/

Current automation:
- Grade / Page / Topic / Duration from the website
- Textbook Module 5 summary is sent to the Worker
- Workers AI generates structured JSON
- Teacher Version and Student Version are filled automatically
- 10-point progress and microphone demo remain available

Important:
The upload control does not yet extract arbitrary PDF/image content. That is the next automation step.

Upload these files to the GitHub repository root:
index.html
styles.css
app.js
data.js
README.md
