const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const STORAGE_KEY = "turnos_ia_2x2_v1";
const STATUS = {
  work: { label: "Trabajo", short: "N", css: "status-work", color: "#ef4444", time: "8:00 p.m. - 8:00 a.m." },
  rest: { label: "Descanso", short: "D", css: "status-rest", color: "#22c55e", time: "Libre" },
  vacation: { label: "Vacaciones", short: "VAC", css: "status-vacation", color: "#38bdf8", time: "Programado" },
  course: { label: "Curso", short: "CUR", css: "status-course", color: "#facc15", time: "Capacitación" },
  overtime: { label: "Tiempo extra", short: "TE", css: "status-overtime", color: "#a78bfa", time: "Extra" },
  permission: { label: "Permiso", short: "PER", css: "status-permission", color: "#94a3b8", time: "Autorizado" },
};
const state = loadState();
let current = startOfMonth(new Date());
let selectedDate = null;
let deferredPrompt = null;

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) return JSON.parse(raw);
  const today = ymd(new Date());
  return {
    users: [{ id: crypto.randomUUID(), name: "David", role: "Turno nocturno", baseDate: today, color: "#38bdf8" }],
    overrides: {}
  };
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ymd(date){ const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseYMD(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a,b){ return Math.floor((parseYMD(ymd(a))-parseYMD(ymd(b)))/86400000); }
function monthName(d){ return d.toLocaleDateString("es-MX",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase()); }
function longDate(d){ return d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase()); }
function activeView(){ return $(".tab.active")?.dataset.view || "calendar"; }
function selectedUserId(){ return $("#userFilter").value; }
function getUsersForView(){ const id=selectedUserId(); return id==="all" ? state.users : state.users.filter(u=>u.id===id); }
function overrideKey(userId,date){ return `${userId}|${date}`; }
function autoStatus(user,date){
  const idx = ((diffDays(parseYMD(date), parseYMD(user.baseDate)) % 4) + 4) % 4;
  return idx === 0 || idx === 1 ? "work" : "rest";
}
function dayRecord(user,date){
  const ov = state.overrides[overrideKey(user.id,date)];
  const status = ov?.status && ov.status !== "auto" ? ov.status : autoStatus(user,date);
  return { user, date, status, note: ov?.note || "", auto: !ov || ov.status === "auto" };
}
function render(){
  save();
  renderMonthHeader(); renderUserFilter(); renderCalendar(); renderAgenda(); renderSummary(); renderUsers();
}
function renderMonthHeader(){
  $("#monthLabel").textContent = monthName(current);
  $("#todayLabel").textContent = `Hoy: ${new Date().toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}`;
}
function renderUserFilter(){
  const filter = $("#userFilter"); const prev = filter.value || "all";
  filter.innerHTML = `<option value="all">Todos los usuarios</option>` + state.users.map(u=>`<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("");
  filter.value = state.users.some(u=>u.id===prev) ? prev : "all";
}
function renderCalendar(){
  const grid = $("#calendarGrid"); grid.innerHTML="";
  if(!state.users.length){ grid.append(emptyNode()); return; }
  const first = startOfMonth(current); const start = addDays(first, -first.getDay());
  const today = ymd(new Date());
  for(let i=0;i<42;i++){
    const d=addDays(start,i); const date=ymd(d); const records=getUsersForView().map(u=>dayRecord(u,date));
    const cell=document.createElement("button"); cell.className=`day ${d.getMonth()!==current.getMonth()?"other":""} ${date===today?"today":""}`; cell.dataset.date=date;
    const max = selectedUserId()==="all" ? 3 : 5;
    cell.innerHTML = `<div class="date-number"><span>${d.getDate()}</span><span class="mini-count">${records.length>1?records.length+" pers.":""}</span></div>` +
      records.slice(0,max).map(recordBadge).join("") + (records.length>max?`<span class="more">+${records.length-max} más</span>`:"");
    cell.addEventListener("click",()=>handleDayClick(date)); grid.append(cell);
  }
}
function recordBadge(r){ const s=STATUS[r.status]; return `<div class="badge ${s.css}" title="${escapeHtml(r.user.name)} · ${s.label}"><span class="dot" style="background:${r.user.color}"></span><div><strong>${escapeHtml(r.user.name)}</strong><small>${s.short} · ${r.note?escapeHtml(r.note):s.time}</small></div></div>`; }
function renderAgenda(){
  const box=$("#agendaList"); box.innerHTML="";
  if(!state.users.length){ box.append(emptyNode()); return; }
  const days = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
  for(let n=1;n<=days;n++){
    const d=new Date(current.getFullYear(), current.getMonth(), n); const date=ymd(d);
    const records=getUsersForView().map(u=>dayRecord(u,date)).filter(r=>["work","vacation","course","overtime","permission"].includes(r.status));
    if(!records.length) continue;
    const card=document.createElement("div"); card.className="agenda-day glass";
    card.innerHTML=`<h3>${longDate(d)}</h3><div class="agenda-items">${records.map(recordBadge).join("")}</div>`;
    box.append(card);
  }
  if(!box.children.length) box.innerHTML=`<div class="empty glass"><h2>Sin eventos especiales</h2><p>Este mes solo aparecen descansos o no hay registros para la vista elegida.</p></div>`;
}
function renderSummary(){
  const box=$("#summaryCards"); box.innerHTML="";
  if(!state.users.length){ box.append(emptyNode()); return; }
  const days = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
  getUsersForView().forEach(u=>{
    const counts = Object.keys(STATUS).reduce((a,k)=>(a[k]=0,a),{});
    for(let n=1;n<=days;n++){ const date=ymd(new Date(current.getFullYear(), current.getMonth(), n)); counts[dayRecord(u,date).status]++; }
    const card=document.createElement("div"); card.className="summary-card glass";
    card.innerHTML=`<h3><span class="dot" style="display:inline-block;background:${u.color};width:12px;height:12px;border-radius:50%;margin-right:7px"></span>${escapeHtml(u.name)}</h3>`+
      Object.entries(STATUS).map(([k,s])=>`<div class="metric"><span>${s.label}</span><strong>${counts[k]}</strong></div>`).join("");
    box.append(card);
  });
}
function renderUsers(){
  const list=$("#usersList"); list.innerHTML="";
  $("#baseDate").value ||= ymd(new Date());
  state.users.forEach(u=>{
    const card=document.createElement("div"); card.className="user-card";
    card.innerHTML=`<div class="user-card-top"><div style="display:flex;gap:12px;align-items:center"><div class="avatar" style="background:${u.color}">${escapeHtml(u.name[0]||"U")}</div><div><h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.role||"Sin área")} · Base ${u.baseDate}</p></div></div></div><div class="card-actions"><button class="soft view-user" data-id="${u.id}">Ver individual</button><button class="danger delete-user" data-id="${u.id}">Eliminar</button></div>`;
    list.append(card);
  });
  $$(".view-user").forEach(b=>b.addEventListener("click",()=>{ $("#userFilter").value=b.dataset.id; switchView("calendar"); render(); }));
  $$(".delete-user").forEach(b=>b.addEventListener("click",()=>{ if(confirm("¿Eliminar este usuario y sus modificaciones?")){ state.users=state.users.filter(u=>u.id!==b.dataset.id); Object.keys(state.overrides).forEach(k=>{ if(k.startsWith(b.dataset.id+"|")) delete state.overrides[k]; }); render(); }}));
}
function emptyNode(){ const node=$("#emptyTemplate").content.cloneNode(true); node.querySelector(".go-users").addEventListener("click",()=>switchView("users")); return node; }
function handleDayClick(date){
  const quick=$("#quickStatus").value;
  const users=getUsersForView();
  if(quick){
    users.forEach(u=>{ const key=overrideKey(u.id,date); if(quick==="clear") delete state.overrides[key]; else state.overrides[key]={status:quick,note:state.overrides[key]?.note||""}; });
    $("#quickStatus").value=""; render(); return;
  }
  selectedDate=date; openDialog(date);
}
function openDialog(date){
  $("#dialogDate").textContent=longDate(parseYMD(date));
  const sel=$("#dialogUser"); const users=getUsersForView();
  sel.innerHTML=users.map(u=>`<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("");
  if(users[0]) sel.value=users[0].id;
  loadDialogUser(); $("#dayDialog").showModal();
}
function loadDialogUser(){
  const uid=$("#dialogUser").value; const ov=state.overrides[overrideKey(uid,selectedDate)];
  $("#dialogStatus").value=ov?.status || "auto"; $("#dialogNote").value=ov?.note || "";
}
function switchView(view){ $$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view)); $$(".view").forEach(v=>v.classList.remove("active")); $(`#${view}View`).classList.add("active"); }
function escapeHtml(str=""){ return String(str).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

$("#prevMonth").addEventListener("click",()=>{ current=new Date(current.getFullYear(), current.getMonth()-1,1); render(); });
$("#nextMonth").addEventListener("click",()=>{ current=new Date(current.getFullYear(), current.getMonth()+1,1); render(); });
$("#todayBtn").addEventListener("click",()=>{ current=startOfMonth(new Date()); render(); });
$("#userFilter").addEventListener("change",render);
$$(".tab").forEach(t=>t.addEventListener("click",()=>{ switchView(t.dataset.view); render(); }));
$("#userForm").addEventListener("submit",e=>{ e.preventDefault(); const name=$("#userName").value.trim(); if(!name) return; state.users.push({id:crypto.randomUUID(),name,role:$("#userRole").value.trim(),baseDate:$("#baseDate").value,color:$("#userColor").value}); e.target.reset(); $("#baseDate").value=ymd(new Date()); render(); });
$("#dialogUser").addEventListener("change",loadDialogUser);
$("#saveDay").addEventListener("click",()=>{ const uid=$("#dialogUser").value; const status=$("#dialogStatus").value; const note=$("#dialogNote").value.trim(); const key=overrideKey(uid,selectedDate); if(status==="auto" && !note) delete state.overrides[key]; else state.overrides[key]={status,note}; $("#dayDialog").close(); render(); });
$("#deleteOverride").addEventListener("click",()=>{ delete state.overrides[overrideKey($("#dialogUser").value,selectedDate)]; $("#dayDialog").close(); render(); });
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e; $("#installBtn").classList.remove("hidden"); });
$("#installBtn").addEventListener("click",async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt=null; $("#installBtn").classList.add("hidden"); });

render();
