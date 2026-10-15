
let currentPage = "home";

function openPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
  document.querySelectorAll(".menu-item").forEach(btn=>btn.classList.toggle("active", btn.dataset.page===page));
  currentPage = page;
}

document.querySelectorAll(".menu-item").forEach(btn=>{
  btn.addEventListener("click", ()=>openPage(btn.dataset.page));
});

async function loadModules(){
  const res = await fetch("data.json");
  const data = await res.json();
  const grid = document.getElementById("moduleGrid");
  document.getElementById("brandMeta").textContent = `Grade ${data.grade} • ${data.currentTopic}`;
  document.getElementById("studentTopic").textContent = `Topic: ${data.currentTopic}`;
  grid.innerHTML = data.modules.map(mod=>`
    <article class="module-card">
      <div class="module-head">
        <div class="module-badge">${mod.module}</div>
      </div>
      <h3>Module ${mod.module}: ${mod.title}</h3>
      <p>${mod.subtitle}</p>
      <div class="grammar-line">${mod.grammar}</div>
    </article>
  `).join("");
}
loadModules();
