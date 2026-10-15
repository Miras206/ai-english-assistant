
const D=window.BOOK_DATA.demo;
let currentStudentStep=0;
const steps=["Vocabulary","Reading","Listening","Grammar","Speaking","Quiz"];
const icons=["🦅","🦄","🐉","👁️","🐴","🔥"];

function showView(id){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 document.querySelectorAll(".topnav").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
 if(id==="dashboard") renderDashboard();
 window.scrollTo({top:0,behavior:"smooth"});
}
window.showView=showView;
document.querySelectorAll(".topnav").forEach(b=>b.onclick=()=>showView(b.dataset.view));

const uploadBtn=document.getElementById("uploadBtn"), fileInput=document.getElementById("fileInput");
let uploadedImageDataUrl="";

uploadBtn.onclick=()=>fileInput.click();

fileInput.onchange=()=>{
 const f=fileInput.files[0];
 if(!f) return;

 if(!f.type.startsWith("image/")){
   alert("Қазір тек JPG, PNG немесе WEBP сурет жүктеңіз. PDF кейін қосылады.");
   fileInput.value="";
   uploadedImageDataUrl="";
   return;
 }

 const reader=new FileReader();

 reader.onload=()=>{
   uploadedImageDataUrl=reader.result;

   document.getElementById("fileName").textContent=
     "Selected: "+f.name+" • AI image ready";

   toast("Image uploaded. AI can analyse it now.");
 };

 reader.readAsDataURL(f);
};

document.querySelectorAll(".example").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".example").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 if(b.dataset.page!=="57"){toast("This prototype currently generates the full demo for Module 5, p.57.");}
 document.getElementById("page").value=b.dataset.page;
});

const API_URL="https://ai-english-lesson-builder-api.mahanmadi2007.workers.dev/";
let aiLesson=null;

function buildTextbookText(){
 return `
Module ${D.module}: ${D.title}.
Topic: ${document.getElementById("topic").value || D.topic}.
Vocabulary: ${D.vocabulary.map(v=>v.en).join(", ")}.
Language focus: ${D.language.join(", ")}.
Skills focus: ${D.skills.join("; ")}.
Themes: ${D.themes.join(", ")}.
Values: ${D.values}.
 `;
}

document.getElementById("generateBtn").onclick=async()=>{
 const btn=document.getElementById("generateBtn");
 const grade=Number(document.getElementById("grade").value||5);
 const page=document.getElementById("page").value||"57";
 const topic=document.getElementById("topic").value||D.topic;
 const duration=document.getElementById("duration").value||"40 minutes";

 btn.disabled=true;
 btn.textContent="⏳ AI is generating...";
 toast("AI is creating the lesson...");

 try{
   let response;

   if(uploadedImageDataUrl){
     response=await fetch(API_URL+"image-to-lesson",{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify({
         grade,
         page,
         topic,
         duration,
         image:uploadedImageDataUrl
       })
     });
   }else{
     response=await fetch(API_URL+"generate",{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify({
         grade,
         page,
         topic,
         duration,
         textbookText:buildTextbookText()
       })
     });
   }

   const data=await response.json();
   if(!response.ok || !data.success){
     throw new Error(data.error || "AI request failed");
   }

   aiLesson=data.lesson;

   if(data.analysis){
     if(data.analysis.topic){
       document.getElementById("topic").value=data.analysis.topic;
     }

     document.getElementById("fileName").textContent=
       "AI analysed image: "+
       (
         data.analysis.pageTitle ||
         data.analysis.topic ||
         "Textbook page"
       );
   }

   localStorage.setItem("aelb_ai_lesson",JSON.stringify(aiLesson));
   localStorage.setItem("aelb_generated","1");

   document.getElementById("generated").classList.remove("hidden");
   renderGeneratedHeader();
   renderTeacherAI("overview");
   renderStudentAI(0);

   toast("AI lesson generated successfully.");
   document.getElementById("generated").scrollIntoView({behavior:"smooth"});
 }catch(error){
   console.error(error);
   alert("AI lesson generation failed:\n"+error.message);
   toast("Generation failed.");
 }finally{
   btn.disabled=false;
   btn.textContent="✨ Generate Lesson";
 }
};


function arr(v){return Array.isArray(v)?v:[];}

function renderGeneratedHeader(){
 if(!aiLesson)return;
 const p=document.querySelector(".generated-head p");
 if(p){
   p.textContent=`${aiLesson.lessonTitle || "Generated Lesson"} • Grade ${aiLesson.grade || 5} • ${aiLesson.duration || ""}`;
 }
}

function renderTeacherAI(tab){
 if(!aiLesson){renderTeacher(tab);return;}
 const l=aiLesson;
 const a=l.assessment||{};
 const pages={
  overview:`<h3>Lesson Overview</h3>
   <table class="info-table">
    <tr><td>Lesson title</td><td>${l.lessonTitle||""}</td></tr>
    <tr><td>Grade</td><td>${l.grade||5}</td></tr>
    <tr><td>Duration</td><td>${l.duration||""}</td></tr>
    <tr><td>Grammar</td><td>${l.grammarTopic||""}</td></tr>
    <tr><td>Assessment</td><td>${a.total??10}/10</td></tr>
   </table>`,
  objectives:`<h3>Learning Objectives</h3><ul class="objective-list">${arr(l.objectives).map(x=>`<li>${x}</li>`).join("")}</ul>`,
  warmup:`<h3>Warm-up</h3><div class="warm">${l.warmup||""}</div>`,
  vocab:`<h3>Vocabulary</h3><ul>${arr(l.vocabulary).map(v=>`<li><b>${v.word||""}</b> — ${v.kazakh||""}</li>`).join("")}</ul>`,
  reading:`<h3>Reading</h3><p>${l.readingTask||""}</p><ol>${arr(l.readingQuestions).map(q=>`<li>${q}</li>`).join("")}</ol>`,
  grammar:`<h3>Grammar / Use of English</h3><p><b>${l.grammarTopic||""}</b></p><div class="warm">${l.grammarKazakh||""}</div><ul>${arr(l.grammarExamples).map(x=>`<li>${x}</li>`).join("")}</ul>`,
  listening:`<h3>Listening</h3><p>${l.listeningTask||""}</p><ol>${arr(l.listeningQuestions).map(q=>`<li>${q}</li>`).join("")}</ol>`,
  speaking:`<h3>Speaking</h3><p>${l.speakingTask||""}</p>`,
  assessment:`<h3>Assessment — ${a.total??10} points</h3>
    <table class="info-table">
      <tr><td>Vocabulary</td><td>${a.vocabulary??2}/2</td></tr>
      <tr><td>Reading</td><td>${a.reading??2}/2</td></tr>
      <tr><td>Listening</td><td>${a.listening??2}/2</td></tr>
      <tr><td>Grammar</td><td>${a.grammar??2}/2</td></tr>
      <tr><td>Speaking</td><td>${a.speaking??2}/2</td></tr>
      <tr><td><b>Total</b></td><td><b>${a.total??10}/10</b></td></tr>
    </table>`,
  homework:`<h3>Homework</h3><p>${l.homework||""}</p>`,
  answers:`<h3>Answer Key</h3><p>Closed-task answers can be added in the next version. Open tasks are checked with descriptors.</p>`,
  descriptors:`<h3>Descriptors</h3><ul class="objective-list">${arr(l.descriptors).map(x=>`<li>${x}</li>`).join("")}</ul>`
 };
 document.getElementById("teacherContent").innerHTML=pages[tab]||pages.overview;
 document.querySelectorAll(".teacher-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
}

function renderStudentAI(step){
 if(!aiLesson){renderStudent(step);return;}
 currentStudentStep=step;
 document.querySelectorAll("#progressSteps span").forEach((s,i)=>s.classList.toggle("on",i===step));
 const l=aiLesson;
 const box=document.getElementById("studentTask");

 if(step===0){
   box.innerHTML=`<div class="task-card"><h3>📘 Vocabulary <span style="float:right;color:#3168ee">2 points</span></h3>
   <div class="vocab-grid">${arr(l.vocabulary).map((v,i)=>`<div class="vocab-card"><div class="creature">${icons[i%icons.length]}</div><b>${v.word||""}</b><small>${v.kazakh||""}</small></div>`).join("")}</div>
   <p>Write one sentence using two new words.</p>
   <textarea id="studentText" style="width:100%;min-height:80px;border:1px solid #dbe4f5;border-radius:9px;padding:10px"></textarea>
   <button class="primary wide-btn" onclick="completeStepAI()">Check</button><div id="studentFeedback" class="feedback">Complete the task, then press Check.</div></div>`;
 }else if(step===1){
   box.innerHTML=`<div class="task-card"><h3>2. Reading <span style="float:right;color:#7155ef">2 points</span></h3><p>${l.readingTask||""}</p><ol>${arr(l.readingQuestions).map(q=>`<li>${q}</li>`).join("")}</ol><textarea id="studentText" style="width:100%;min-height:100px;border:1px solid #dbe4f5;border-radius:9px;padding:10px"></textarea><button class="primary wide-btn" onclick="completeStepAI()">Check</button><div id="studentFeedback" class="feedback">Write your answers.</div></div>`;
 }else if(step===2){
   box.innerHTML=`<div class="task-card"><h3>3. Listening <span style="float:right;color:#7155ef">2 points</span></h3><p>${l.listeningTask||""}</p><ol>${arr(l.listeningQuestions).map(q=>`<li>${q}</li>`).join("")}</ol><textarea id="studentText" style="width:100%;min-height:90px;border:1px solid #dbe4f5;border-radius:9px;padding:10px"></textarea><button class="primary wide-btn" onclick="completeStepAI()">Check</button><div id="studentFeedback" class="feedback">Listening task ready.</div></div>`;
 }else if(step===3){
   box.innerHTML=`<div class="task-card"><h3>4. Grammar <span style="float:right;color:#7155ef">2 points</span></h3><p><b>${l.grammarTopic||""}</b></p><div class="warm">${l.grammarKazakh||""}</div><ul>${arr(l.grammarExamples).map(x=>`<li>${x}</li>`).join("")}</ul><textarea id="studentText" style="width:100%;min-height:80px;border:1px solid #dbe4f5;border-radius:9px;padding:10px" placeholder="Write your own example"></textarea><button class="primary wide-btn" onclick="completeStepAI()">Check</button><div id="studentFeedback" class="feedback">Use the target grammar.</div></div>`;
 }else if(step===4){
   box.innerHTML=`<div class="task-card"><h3>5. Speaking <span style="float:right;color:#7155ef">2 points</span></h3><p>${l.speakingTask||""}</p><button class="primary" id="micBtn">🎤 Start speaking</button><div id="studentFeedback" class="feedback">Microphone feedback will appear here.</div></div>`;
   bindMic();
 }else{
   box.innerHTML=`<div class="task-card"><h3>6. Result</h3><p>Lesson complete. Open the dashboard to see the 10-point progress.</p><button class="primary wide-btn" onclick="showView('dashboard')">View Dashboard</button></div>`;
 }
}

window.completeStepAI=function(){
 const f=document.getElementById("studentFeedback");
 if(f){f.className="feedback good";f.textContent="✓ Completed. +2 points";}
 localStorage.setItem("aelb_step_"+currentStudentStep,"2");
 setTimeout(()=>{if(currentStudentStep<5)renderStudentAI(currentStudentStep+1);renderDashboard();},450);
};

const teacherData={
overview:`<h3>Lesson Overview</h3>
<div class="overview-card"><table class="info-table">
<tr><td>Topic</td><td>Creativity — Mythical creatures</td></tr>
<tr><td>Grade / Module</td><td>Grade 5 • Module 5 • page 57</td></tr>
<tr><td>Lesson duration</td><td>${document.getElementById("duration").value}</td></tr>
<tr><td>Skills focus</td><td>Reading • Listening • Speaking • Writing</td></tr>
<tr><td>Language focus</td><td>${D.language.join(" • ")}</td></tr>
<tr><td>Vocabulary</td><td>${D.vocabulary.map(x=>x.en).join(", ")}</td></tr>
<tr><td>Values</td><td>${D.values}</td></tr>
<tr><td>Materials</td><td>Student's Book p.57, teacher audio, generated worksheet</td></tr>
</table><div class="fake-page"><b>5</b><br>Creativity<br><div style="font-size:42px">🦅</div><small>p.57</small></div></div>`,
objectives:`<h3>Learning Objectives</h3><ul class="objective-list">
<li>identify and use key vocabulary for mythical creatures;</li>
<li>understand the main idea and specific information in short topic-based input;</li>
<li>use selected past forms from the module language focus;</li>
<li>describe a mythical creature using simple sentences;</li>
<li>work in pairs and give a short response.</li></ul>`,
warmup:`<h3>Warm-up</h3><div class="warm"><b>5 minutes</b><p>Show the Module 5 creature images. Ask: “What creatures can you see?” and “Which creature looks the most unusual?” Students discuss in pairs, then share one answer.</p></div>`,
vocab:`<h3>Vocabulary</h3><p>Use the Module 5 creature vocabulary from the textbook opener.</p><ul>${D.vocabulary.map(v=>`<li><b>${v.en}</b> — ${v.kk}</li>`).join("")}</ul>`,
reading:`<h3>Reading</h3><p>Teacher selects or displays the textbook reading connected with Module 5. The generated task focuses on main idea and specific information without reproducing the full textbook passage.</p><div class="warm">Task: identify the creature, two features, and one ability from the source text.</div>`,
grammar:`<h3>Grammar / Use of English</h3><p><b>Language focus from Module 5:</b> ${D.language.join("; ")}.</p><div class="warm">Қазақша қысқа түсіндіру: was/were — өткен шақтағы «болды»; had — «болды/бар еді»; could — «істей алды».</div>`,
listening:`<h3>Listening</h3><p>Use the module audio/source selected by the teacher. Students listen for the name of the creature, appearance and abilities.</p>`,
speaking:`<h3>Speaking</h3><p>Describe one mythical creature. Include its name, appearance and what it could do.</p>`,
assessment:`<h3>Assessment — 10 points</h3><table class="info-table"><tr><td>Vocabulary</td><td>2 points</td></tr><tr><td>Reading</td><td>2 points</td></tr><tr><td>Listening</td><td>2 points</td></tr><tr><td>Use of English</td><td>2 points</td></tr><tr><td>Speaking</td><td>2 points</td></tr><tr><td><b>Total</b></td><td><b>10 points</b></td></tr></table>`,
homework:`<h3>Homework</h3><p>Create a mini profile of one mythical creature using 5–6 English sentences and at least three module words.</p>`,
answers:`<h3>Answer Key</h3><p>Answer keys are generated for closed tasks. Open speaking/writing tasks are assessed with descriptors.</p>`,
descriptors:`<h3>Descriptors</h3><ul class="objective-list"><li>identifies target vocabulary;</li><li>finds key information;</li><li>uses target grammar correctly;</li><li>gives a clear short oral response;</li><li>completes the task independently.</li></ul>`
};

function renderTeacher(tab){
 document.getElementById("teacherContent").innerHTML=teacherData[tab]||teacherData.overview;
 document.querySelectorAll(".teacher-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
}
document.querySelectorAll(".teacher-tab").forEach(b=>b.onclick=()=>aiLesson?renderTeacherAI(b.dataset.tab):renderTeacher(b.dataset.tab));
document.getElementById("viewKmj").onclick=()=>{aiLesson?renderTeacherAI("overview"):renderTeacher("overview");toast("ҚМЖ preview opened in Teacher Version.");};

function renderStudent(step){
 currentStudentStep=step;
 document.querySelectorAll("#progressSteps span").forEach((s,i)=>s.classList.toggle("on",i===step));
 const box=document.getElementById("studentTask");
 if(step===0){
   box.innerHTML=`<div class="task-card"><h3>📘 Vocabulary <span style="float:right;color:#3168ee">2 points</span></h3>
   <p>Match the module words with the creature cards.</p>
   <div class="vocab-grid">${D.vocabulary.map((v,i)=>`<div class="vocab-card"><div class="creature">${icons[i]}</div><b>${v.en}</b><small>${v.kk}</small></div>`).join("")}</div>
   <div class="word-bank">${D.vocabulary.map(v=>`<button>${v.en}</button>`).join("")}</div>
   <button class="primary wide-btn" onclick="completeStep()">Check</button><div id="studentFeedback" class="feedback">Choose the words, then press Check.</div></div>`;
 } else if(step===1){
   box.innerHTML=`<div class="task-card"><h3>2. Reading <span style="float:right;color:#7155ef">2 points</span></h3><p>The full textbook passage is not copied here. Read the selected Module 5 source in your book and answer:</p><p><b>1.</b> Which mythical creature is described?<br><b>2.</b> What does it look like?<br><b>3.</b> What could it do?</p><textarea id="readingAns" style="width:100%;min-height:100px;border:1px solid #dbe4f5;border-radius:9px;padding:10px"></textarea><button class="primary wide-btn" onclick="completeStep()">Check</button><div id="studentFeedback" class="feedback">Write your answer in English.</div></div>`;
 } else if(step===2){
   box.innerHTML=`<div class="task-card"><h3>3. Listening <span style="float:right;color:#7155ef">2 points</span></h3><p>Listen to the teacher/audio from the selected module. Write the creature name and two details you hear.</p><textarea style="width:100%;min-height:90px;border:1px solid #dbe4f5;border-radius:9px;padding:10px"></textarea><button class="primary wide-btn" onclick="completeStep()">Check</button><div id="studentFeedback" class="feedback">Listening task ready.</div></div>`;
 } else if(step===3){
   box.innerHTML=`<div class="task-card"><h3>4. Grammar <span style="float:right;color:#7155ef">2 points</span></h3><p><b>Module 5 language focus:</b> was/were, had, could, Past Simple.</p><p>Complete: “The creature ___ very large. It ___ wings. It ___ fly.”</p><input id="grammarAns" style="width:100%;padding:10px;border:1px solid #dbe4f5;border-radius:9px" placeholder="Write your answer"><button class="primary wide-btn" onclick="completeStep()">Check</button><div id="studentFeedback" class="feedback">Use the target grammar.</div></div>`;
 } else if(step===4){
   box.innerHTML=`<div class="task-card"><h3>5. Speaking <span style="float:right;color:#7155ef">2 points</span></h3><p>Describe a mythical creature. Say its name, appearance and what it could do.</p><button class="primary" id="micBtn">🎤 Start speaking</button><div id="studentFeedback" class="feedback">Microphone feedback will appear here.</div></div>`;
   bindMic();
 } else {
   box.innerHTML=`<div class="task-card"><h3>6. Quiz</h3><p>Lesson complete. Your demo score is calculated from completed skill steps.</p><button class="primary wide-btn" onclick="showView('dashboard')">View Dashboard</button></div>`;
 }
}

window.completeStep=function(){
 const f=document.getElementById("studentFeedback"); if(f){f.className="feedback good";f.textContent="✓ Completed. +2 points";}
 localStorage.setItem("aelb_step_"+currentStudentStep,"2");
 setTimeout(()=>{if(currentStudentStep<5)renderStudent(currentStudentStep+1); renderDashboard();},450);
};
function bindMic(){
 const mic=document.getElementById("micBtn"); if(!mic)return;
 mic.onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const f=document.getElementById("studentFeedback");
  if(!SR){f.textContent="Speech Recognition is not supported in this browser. Use Chrome or Edge.";return;}
  const r=new SR(); r.lang="en-US"; mic.textContent="🎙 Listening...";
  r.onresult=e=>{const t=e.results[0][0].transcript;f.className="feedback good";f.textContent=t+" — Good attempt!";localStorage.setItem("aelb_step_4","2");renderDashboard();};
  r.onend=()=>mic.textContent="🎤 Start speaking";r.start();
 };
}
document.getElementById("startLesson").onclick=()=>aiLesson?renderStudentAI(0):renderStudent(0);

function renderDashboard(){
 let total=0; for(let i=0;i<5;i++) total+=Number(localStorage.getItem("aelb_step_"+i)||0);
 document.getElementById("dashBox").innerHTML=`<h2>Teacher Dashboard</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px"><div class="task-card"><b style="font-size:28px">${total}/10</b><p>Total score</p></div><div class="task-card"><b style="font-size:28px">${total/2}/5</b><p>Completed skills</p></div><div class="task-card"><b style="font-size:28px">Module 5</b><p>Creativity</p></div></div>`;
}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
const savedAi=localStorage.getItem("aelb_ai_lesson");
if(savedAi){
 try{
   aiLesson=JSON.parse(savedAi);
   document.getElementById("generated").classList.remove("hidden");
   renderGeneratedHeader();
   renderTeacherAI("overview");
   renderStudentAI(0);
 }catch(e){console.error(e);}
}else if(localStorage.getItem("aelb_generated")==="1"){
 document.getElementById("generated").classList.remove("hidden");
 renderTeacher("overview");
 renderStudent(0);
}
renderDashboard();
