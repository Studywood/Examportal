import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut,
  GoogleAuthProvider, signInWithPopup, setPersistence,
  browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, getDoc,
  updateDoc, deleteDoc, setDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const ADMIN_EMAIL = "abhi.admin@examportal.app";
const ADMIN_DISPLAY_NAME = "Abhi Sir";

let user = null;
let tests = [];
let selectedTest = null;
let selectedClass = "";
let attempt = { answers:{}, startedAt:null };
let timerHandle = null;

const $ = s => document.querySelector(s);
const appEl = $("#app");

function toast(msg, good=false) {
  const t=$("#toast"); t.textContent=msg; t.className="toast show "+(good?"good":"");
  setTimeout(()=>t.className="toast",2800);
}

function isAdmin() {
  return !!user && user.email === ADMIN_EMAIL;
}

function nav() {
  $("#nav").innerHTML = user
    ? `<span class="user-pill">${isAdmin() ? "Admin" : (user.displayName || user.email)}</span>
       ${isAdmin()?'<button class="nav-btn" onclick="showPage(\'admin\')">Admin Panel</button>':''}
       <button class="nav-btn" onclick="logout()">Logout</button>`
    : `<button class="nav-btn" onclick="showPage('login')">Login</button>
       <button class="nav-primary" onclick="showPage('signup')">Sign up</button>`;
}

async function loadTests() {
  const snap = await getDocs(query(collection(db,"tests"), orderBy("createdAt","desc")));
  tests = snap.docs.map(d=>({id:d.id,...d.data()}));
}

function classCards() {
  const classes=["Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Competitive"];
  return classes.map(c=>`<button class="class-card" onclick="selectClass('${c}')">
    <span>${c.replace("Class ","")}</span><b>${c}</b><small>View mock tests</small>
  </button>`).join("");
}

window.showPage = async function(page) {
  nav();
  if(page==="home") {
    await loadTests().catch(()=>{});
    appEl.innerHTML=`<section class="hero">
      <div class="hero-copy"><span class="eyebrow">SMART ONLINE TEST PLATFORM</span>
      <h1>Practice. Test. <span>Improve.</span></h1>
      <p>Chapter-wise and full-length mock tests for students, with instant results and a dedicated teacher dashboard.</p>
      <div class="hero-actions">
        <button class="primary" onclick="showPage('classes')">Start a Mock Test</button>
        <button class="secondary" onclick="showPage('${user?'dashboard':'signup'}')">${user?'My Dashboard':'Create Account'}</button>
      </div></div>
      <div class="hero-card"><div class="live-dot"></div><b>Examportal</b><strong>Online Mock Tests</strong><span>LaTeX • Images • Timer • Results</span></div>
    </section>
    <section class="section"><div class="section-head"><h2>Choose your class</h2><span>Updated by Abhi Sir</span></div><div class="class-grid">${classCards()}</div></section>`;
  } else if(page==="classes") {
    await loadTests().catch(()=>{});
    appEl.innerHTML=`<section class="section page"><div class="section-head"><h1>Select your class</h1><span>${tests.length} tests available</span></div><div class="class-grid">${classCards()}</div></section>`;
  } else if(page==="login") renderLogin();
  else if(page==="signup") renderSignup();
  else if(page==="dashboard") renderDashboard();
  else if(page==="admin") { if(!isAdmin()) return showPage("login"); renderAdmin(); }
};
window.selectClass = async function(c) {
  selectedClass=c;
  await loadTests().catch(()=>{});
  const list=tests.filter(t=>t.className===c && t.published!==false);
  appEl.innerHTML=`<section class="section page"><button class="back" onclick="showPage('classes')">← Classes</button>
    <div class="section-head"><h1>${c} Mock Tests</h1><span>${list.length} tests</span></div>
    <div class="test-grid">${list.length ? list.map(testCard).join("") : '<div class="empty">No tests have been published for this class yet.</div>'}</div></section>`;
};
function testCard(t) {
  return `<article class="test-card"><div class="test-icon">✓</div><div><span class="tag">${t.subject||"General"}</span>
    <h3>${esc(t.title)}</h3><p>${t.questions?.length||0} questions • ${t.duration||30} min</p></div>
    <button class="primary small" onclick="startTest('${t.id}')">Start Test</button></article>`;
}

function renderLogin() {
  appEl.innerHTML=`<section class="auth-page"><div class="auth-card"><div class="brand centered"><div class="brand-mark">E</div><div><b>Examportal</b><small>Welcome back</small></div></div>
    <h1>Login</h1><p class="muted">Continue your mock-test journey.</p>
    <form onsubmit="login(event)">
      <label>Email<input id="loginEmail" type="email" required placeholder="you@example.com"></label>
      <label>Password<input id="loginPassword" type="password" required placeholder="••••••••"></label>
      <label class="check"><input id="remember" type="checkbox" checked> <span>Remember me</span></label>
      <button class="primary wide">Login</button>
    </form>
    <div class="or"><span>or</span></div>
    <button class="google wide" onclick="googleLogin()">Continue with Google</button>
    <p class="switch">Don't have an account? <a onclick="showPage('signup')">Sign up</a></p>
  </div></section>`;
}
function renderSignup() {
  appEl.innerHTML=`<section class="auth-page"><div class="auth-card"><div class="brand centered"><div class="brand-mark">E</div><div><b>Examportal</b><small>Create account</small></div></div>
    <h1>Sign up</h1><p class="muted">Create your student account.</p>
    <form onsubmit="signup(event)">
      <label>Full name<input id="signupName" required placeholder="Your name"></label>
      <label>Email<input id="signupEmail" type="email" required placeholder="you@example.com"></label>
      <label>Password<input id="signupPassword" type="password" minlength="6" required placeholder="At least 6 characters"></label>
      <label class="check"><input id="rememberSignup" type="checkbox" checked> <span>Remember me</span></label>
      <button class="primary wide">Create account</button>
    </form>
    <div class="or"><span>or</span></div><button class="google wide" onclick="googleLogin()">Continue with Google</button>
    <p class="switch">Already registered? <a onclick="showPage('login')">Login</a></p>
  </div></section>`;
}
window.login = async e => {
  e.preventDefault();
  try {
    await setPersistence(auth, $("#remember").checked ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth,$("#loginEmail").value,$("#loginPassword").value);
    toast("Logged in successfully.",true); showPage("dashboard");
  } catch(err) { toast(err.message.replace("Firebase: ","")); }
};
window.signup = async e => {
  e.preventDefault();
  try {
    await setPersistence(auth, $("#rememberSignup").checked ? browserLocalPersistence : browserSessionPersistence);
    const cred=await createUserWithEmailAndPassword(auth,$("#signupEmail").value,$("#signupPassword").value);
    await updateProfile(cred.user,{displayName:$("#signupName").value});
    await setDoc(doc(db,"users",cred.user.uid),{name:$("#signupName").value,email:cred.user.email,createdAt:serverTimestamp()});
    toast("Account created.",true); showPage("dashboard");
  } catch(err) { toast(err.message.replace("Firebase: ","")); }
};
window.googleLogin = async () => {
  try { await signInWithPopup(auth,new GoogleAuthProvider()); toast("Google login successful.",true); showPage("dashboard"); }
  catch(err) { toast(err.message.replace("Firebase: ","")); }
};
window.logout = async()=>{await signOut(auth); showPage("home");};

function renderDashboard() {
  if(!user) return showPage("login");
  appEl.innerHTML=`<section class="section page"><div class="dashboard-head"><div><span class="eyebrow">STUDENT DASHBOARD</span><h1>Hi, ${esc(user.displayName||"Student")} 👋</h1><p class="muted">Choose a test and start practising.</p></div>
    <button class="primary" onclick="showPage('classes')">Browse Tests</button></div>
    <div class="stats"><div><b>Mock Tests</b><strong>${tests.length}</strong></div><div><b>Subjects</b><strong>${new Set(tests.map(x=>x.subject)).size}</strong></div><div><b>Mode</b><strong>Online</strong></div></div>
    <h2>Available Tests</h2><div class="test-grid">${tests.filter(t=>t.published!==false).slice(0,8).map(testCard).join("")||'<div class="empty">No tests available yet.</div>'}</div></section>`;
}

window.startTest = async id => {
  if(!user) return showPage("login");
  selectedTest=tests.find(t=>t.id===id);
  if(!selectedTest) return toast("Test not found.");
  attempt={answers:{},startedAt:Date.now()};
  renderExam(0);
};
function renderExam(index) {
  clearInterval(timerHandle);
  const q=selectedTest.questions[index];
  const total=selectedTest.questions.length;
  const remain = selectedTest.duration*60 - Math.floor((Date.now()-attempt.startedAt)/1000);
  if(remain<=0) return submitTest(true);
  appEl.innerHTML=`<section class="exam-shell"><div class="exam-top"><button class="back" onclick="confirmExit()">← Exit</button><div><b>${esc(selectedTest.title)}</b><small>${esc(selectedTest.subject||"")}</small></div><div class="timer" id="timer"></div></div>
    <div class="exam-body"><aside class="palette"><b>Questions</b><div class="palette-grid">${selectedTest.questions.map((_,i)=>`<button class="${attempt.answers[i]!==undefined?'answered':''} ${i===index?'active':''}" onclick="renderExam(${i})">${i+1}</button>`).join("")}</div></aside>
    <article class="question-card"><div class="q-meta">Question ${index+1} of ${total}</div><div class="question-content">${renderContent(q.question,q.questionImage)}</div>
    <div class="options">${(q.options||[]).map((o,i)=>`<label class="option ${attempt.answers[index]===i?'selected':''}"><input type="radio" name="opt" ${attempt.answers[index]===i?'checked':''} onchange="answer(${index},${i})"><span>${String.fromCharCode(65+i)}</span><div>${renderContent(o.text,o.image)}</div></label>`).join("")}</div>
    <div class="exam-actions">${index?'<button class="secondary" onclick="renderExam('+(index-1)+')">Previous</button>':'<span></span>'}${index<total-1?'<button class="primary" onclick="renderExam('+(index+1)+')">Next</button>':'<button class="primary" onclick="submitTest(false)">Submit Test</button>'}</div>
    </article></div></section>`;
  updateTimer();
  timerHandle=setInterval(updateTimer,1000);
  function updateTimer(){
    const seconds=selectedTest.duration*60-Math.floor((Date.now()-attempt.startedAt)/1000);
    if(seconds<=0) return submitTest(true);
    const m=Math.floor(seconds/60), s=seconds%60;
    const el=$("#timer"); if(el) el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
}
window.answer=(q,i)=>{attempt.answers[q]=i;};
window.confirmExit=()=>{if(confirm("Exit this test? Your current attempt will be lost.")) showPage("dashboard");};
window.submitTest=async auto=>{
  clearInterval(timerHandle);
  const qs=selectedTest.questions;
  let correct=0, attempted=0;
  qs.forEach((q,i)=>{if(attempt.answers[i]!==undefined){attempted++;if(attempt.answers[i]===q.answer)correct++;}});
  const score=selectedTest.negativeMarking ? correct*(selectedTest.marks||1)-(attempted-correct)*(selectedTest.negative||0) : correct*(selectedTest.marks||1);
  try {
    await addDoc(collection(db,"results"),{uid:user.uid,testId:selectedTest.id,testTitle:selectedTest.title,score,correct,attempted,total:qs.length,submittedAt:serverTimestamp()});
  } catch(e){}
  appEl.innerHTML=`<section class="result-page"><div class="result-card"><span class="result-check">✓</span><span class="eyebrow">${auto?"TIME UP":"TEST SUBMITTED"}</span><h1>Test completed!</h1><div class="score">${score}</div><p>Score</p>
    <div class="result-stats"><div><b>${correct}</b><span>Correct</span></div><div><b>${attempted}</b><span>Attempted</span></div><div><b>${qs.length-correct}</b><span>Incorrect / Unanswered</span></div></div>
    <button class="primary" onclick="showPage('dashboard')">Back to Dashboard</button></div></section>`;
};

function renderContent(text,image) {
  let html="";
  if(text) html+=`<div class="latex">${esc(text)}</div>`;
  if(image) html+=`<img class="question-image" src="${esc(image)}" alt="Question image">`;
  return html;
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderAdmin() {
  appEl.innerHTML=`<section class="section page"><div class="admin-head"><div><span class="eyebrow">ADMIN PANEL</span><h1>Examportal Control Room</h1><p class="muted">Signed in as ${ADMIN_DISPLAY_NAME}</p></div><button class="primary" onclick="openTestEditor()">+ Create Test</button></div>
  <div class="admin-grid"><div class="admin-card"><h3>Tests</h3><strong>${tests.length}</strong><p>Create, edit, publish or delete tests.</p></div><div class="admin-card"><h3>Question types</h3><strong>∞</strong><p>LaTeX/KaTeX text or JPG/PNG/WebP images.</p></div><div class="admin-card"><h3>Cross-device</h3><strong>LIVE</strong><p>Published data is stored online for every device.</p></div></div>
  <div class="section-head"><h2>Manage Tests</h2><span>Admin only</span></div><div class="admin-list">${tests.map(t=>`<div class="admin-row"><div><span class="tag">${esc(t.className)}</span><b>${esc(t.title)}</b><small>${esc(t.subject||"General")} • ${t.questions?.length||0} questions • ${t.duration||30} min</small></div><div class="row-actions"><button class="secondary small" onclick="openTestEditor('${t.id}')">Edit</button><button class="danger small" onclick="removeTest('${t.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No tests created yet.</div>'}</div></section>`;
}
window.openTestEditor=async id=>{
  const t=id?tests.find(x=>x.id===id):null;
  appEl.innerHTML=`<section class="section page"><button class="back" onclick="showPage('admin')">← Admin</button><div class="editor-card"><h1>${t?"Edit":"Create"} Test</h1>
  <div class="form-grid"><label>Class<select id="fClass">${["Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Competitive"].map(x=>`<option ${t?.className===x?"selected":""}>${x}</option>`).join("")}</select></label>
  <label>Subject<input id="fSubject" value="${esc(t?.subject||"Mathematics")}" placeholder="Mathematics"></label>
  <label class="span2">Test title<input id="fTitle" value="${esc(t?.title||"Chapter Mock Test")}" placeholder="e.g. Class 10 Circles Mock Test"></label>
  <label>Time (minutes)<input id="fDuration" type="number" min="1" value="${t?.duration||30}"></label>
  <label>Marks / correct answer<input id="fMarks" type="number" value="${t?.marks||1}"></label>
  <label>Negative marks<input id="fNegative" type="number" step="0.25" value="${t?.negative||0}"></label>
  <label class="check"><input id="fPublished" type="checkbox" ${t?.published!==false?"checked":""}> Publish to students</label></div>
  <h2>Questions</h2><p class="muted">Enter LaTeX/KaTeX text or upload an image. For options, use text or an image.</p>
  <div id="questions">${(t?.questions||[blankQuestion()]).map((q,i)=>questionEditor(q,i)).join("")}</div>
  <button class="secondary" onclick="addQuestion()">+ Add Question</button><div class="editor-actions"><button class="secondary" onclick="showPage('admin')">Cancel</button><button class="primary" onclick="saveTest('${id||""}')">Save Test</button></div>
  </div></section>`;
};
function blankQuestion(){return {question:"",questionImage:"",options:[{text:""},{text:""},{text:""},{text:""}],answer:0};}
function questionEditor(q,i){
  return `<div class="question-editor" data-q="${i}"><div class="qe-head"><b>Question ${i+1}</b><button class="danger-link" onclick="this.closest('.question-editor').remove()">Remove</button></div>
  <textarea class="q-text" placeholder="Question text. Example: Find \\\\(x\\\\) if ...">${esc(q.question||"")}</textarea>
  <input class="q-image" type="url" value="${esc(q.questionImage||"")}" placeholder="Optional image URL (or upload to Firebase Storage)">
  <div class="option-editors">${[0,1,2,3].map(j=>`<div><label>Option ${String.fromCharCode(65+j)}</label><input class="o-text" data-o="${j}" value="${esc(q.options?.[j]?.text||"")}" placeholder="Option text"></div>`).join("")}</div>
  <label>Correct option<select class="q-answer">${[0,1,2,3].map(j=>`<option value="${j}" ${q.answer===j?"selected":""}>${String.fromCharCode(65+j)}</option>`).join("")}</select></label></div>`;
}
window.addQuestion=()=>$("#questions").insertAdjacentHTML("beforeend",questionEditor(blankQuestion(),document.querySelectorAll(".question-editor").length));
window.saveTest=async id=>{
  if(!isAdmin()) return toast("Admin access required.");
  const questions=[...document.querySelectorAll(".question-editor")].map(el=>({
    question:el.querySelector(".q-text").value.trim(), questionImage:el.querySelector(".q-image").value.trim(),
    options:[...el.querySelectorAll(".o-text")].map(x=>({text:x.value.trim()})),
    answer:Number(el.querySelector(".q-answer").value)
  })).filter(q=>q.question||q.questionImage);
  const data={className:$("#fClass").value,subject:$("#fSubject").value.trim(),title:$("#fTitle").value.trim(),duration:Number($("#fDuration").value),marks:Number($("#fMarks").value),negative:Number($("#fNegative").value),published:$("#fPublished").checked,questions,updatedAt:serverTimestamp()};
  try {
    if(id) await updateDoc(doc(db,"tests",id),data);
    else await addDoc(collection(db,"tests"),{...data,createdAt:serverTimestamp()});
    toast("Test saved successfully.",true); await showPage("admin");
  } catch(e){toast(e.message);}
};
window.removeTest=async id=>{
  if(!isAdmin()||!confirm("Delete this test permanently?")) return;
  try {await deleteDoc(doc(db,"tests",id));toast("Test deleted.",true);await showPage("admin");} catch(e){toast(e.message);}
};

onAuthStateChanged(auth, async u=>{user=u;nav();if(location.hash==="#admin"&&isAdmin())showPage("admin");});
showPage("home");
