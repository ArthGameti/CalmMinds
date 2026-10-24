(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  // Same-origin API in production; fall back to the local FastAPI server when the page is
  // opened from file:// or a dev server such as VS Code Live Server.
  const devHost = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const API = (location.protocol === "file:" || (devHost && location.port !== "8000")) ? "http://127.0.0.1:8000/api" : "/api";
  const form = $("#form"), stressInp = $("#stress_level");

  /* nav */
  const toggle = $(".nav-toggle"), links = $(".nav-links");
  toggle.addEventListener("click", () => { const o = links.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); });
  links.addEventListener("click", e => { if (e.target.tagName === "A") links.classList.remove("open"); });

  /* stress selector */
  const seg = $("#stress-seg");
  seg.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    seg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    stressInp.value = b.dataset.v; clearErr("stress_level");
  });
  const setStress = v => { stressInp.value = v; seg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x.dataset.v === v)); };

  /* validation */
  const rules = {
    age: [10, 100, "Age"], gender: 0, country: 0, academic_level: 0, most_used_platform: 0, purpose_of_use: 0, stress_level: 0,
    avg_daily_usage_hours: [0, 24, "Social-media time"], daily_unlocks: [0, 1000, "Unlocks"],
    study_hours: [0, 24, "Study hours"], physical_activity_hours: [0, 24, "Activity"], sleep_hours_per_night: [0, 24, "Sleep"]
  };
  function setErr(n, m) { const e = $(`.err[data-for="${n}"]`); if (e) e.textContent = m; const f = $("#" + n); if (f && f.closest(".field")) f.closest(".field").classList.add("bad"); }
  function clearErr(n) { const e = $(`.err[data-for="${n}"]`); if (e) e.textContent = ""; const f = $("#" + n); if (f && f.closest(".field")) f.closest(".field").classList.remove("bad"); }
  function validate() {
    let ok = true;
    for (const [n, r] of Object.entries(rules)) {
      clearErr(n);
      const v = ($("#" + n).value || "").trim();
      if (!v) { setErr(n, "Required"); ok = false; continue; }
      if (r) { const x = parseFloat(v); if (isNaN(x) || x < r[0] || x > r[1]) { setErr(n, `Enter ${r[0]}–${r[1]}`); ok = false; } }
    }
    return ok;
  }
  form.addEventListener("input", e => e.target.id && clearErr(e.target.id));

  /* states */
  const S = { idle: $("#s-idle"), load: $("#s-load"), res: $("#s-res"), err: $("#s-err") };
  const show = k => Object.entries(S).forEach(([n, el]) => el.hidden = n !== k);

  /* stats */
  let stats = null;
  const avg = () => (stats ? stats.mean : 6.23);

  const band = s => s < 4.5 ? ["Needs attention", "b-low"] : s < 6 ? ["Mixed signal", "b-mid"] : s < 7.5 ? ["Steady signal", "b-good"] : ["Strong signal", "b-top"];
  const summary = s => s < 4.5 ? "Your habits point to considerable strain. Small changes to sleep, screen time and rest can make a real difference — and talking to someone you trust helps."
    : s < 6 ? "A mixed picture: some habits are supporting you while others add pressure. Focus on the suggestions below."
    : s < 7.5 ? "A reasonably balanced routine. A few consistent tweaks could lift your score further."
    : "Your routine is associated with a strong wellbeing signal. Keep protecting the habits that work for you.";

  function tips(d) {
    const t = [];
    const add = (c, x) => t.push({ c, x });
    if (d.sleep_hours_per_night < 6) add("n", "Aim for 7–8 hours of sleep. In the dataset, students sleeping under 6 hours average about 5.1/10 vs 7.2+ for 7–8 hours.");
    else if (d.sleep_hours_per_night < 7) add("w", "You're close — nudging sleep to 7+ hours is associated with a noticeably higher score.");
    else add("p", "Great sleep habits — keep a consistent bedtime.");
    if (d.avg_daily_usage_hours >= 6) add("n", "Social media use above 6 hours/day is associated with the lowest scores. Try app timers or phone-free hours.");
    else if (d.avg_daily_usage_hours >= 4) add("w", "Cutting social-media time by an hour or so could help — scores rise steadily as usage falls below 4 hours.");
    else add("p", "Your social-media time is in a healthy range.");
    if (d.daily_unlocks > 120) add("w", "Frequent phone unlocks fragment attention. Try batching notifications.");
    if (d.physical_activity_hours < 0.5) add("w", "Add even 20–30 minutes of movement a day — activity correlates positively with wellbeing.");
    else if (d.physical_activity_hours >= 1) add("p", "Regular physical activity is working in your favour.");
    if (d.stress_level === "High" || d.stress_level === "Very High") add("n", "Stress is the strongest lever. Consider breaks, talking with a friend or counsellor, or campus support services.");
    if (d.study_hours > 8) add("w", "A heavy study load — schedule real recovery time between sessions.");
    return t.slice(0, 5);
  }

  function render(score, d) {
    const [label, cls] = band(score);
    $("#r-score").textContent = score.toFixed(1);
    const b = $("#r-band"); b.textContent = label; b.className = "band " + cls;
    $("#r-text").textContent = summary(score);
    $("#r-avgv").textContent = avg().toFixed(1);
    const ul = $("#r-tips"); ul.innerHTML = "";
    tips(d).forEach(x => { const li = document.createElement("li"); if (x.c !== "p") li.className = x.c; li.textContent = x.x; ul.appendChild(li); });
    const fill = $("#g-fill"), you = $("#r-you"), av = $("#r-avg");
    fill.style.transition = "none"; fill.style.strokeDashoffset = 100; you.style.width = "0";
    show("res");
    av.style.left = `calc(${avg() * 10}% - 1px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = ""; fill.style.strokeDashoffset = 100 - score * 10; you.style.width = score * 10 + "%";
    }));
    if (window.innerWidth < 900) $(".result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* submit → real model via API */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validate()) { const f = $(".field.bad input, .field.bad select"); f && f.focus(); return; }
    const num = n => parseFloat(form[n].value);
    const d = {
      age: parseInt(form.age.value, 10), gender: form.gender.value, country: form.country.value.trim(),
      academic_level: form.academic_level.value, most_used_platform: form.most_used_platform.value,
      purpose_of_use: form.purpose_of_use.value, avg_daily_usage_hours: num("avg_daily_usage_hours"),
      daily_unlocks: parseInt(form.daily_unlocks.value, 10), study_hours: num("study_hours"),
      physical_activity_hours: num("physical_activity_hours"), sleep_hours_per_night: num("sleep_hours_per_night"),
      stress_level: stressInp.value
    };
    const btn = $("#submit"); btn.disabled = true; show("load");
    try {
      const res = await fetch(`${API}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      if (!res.ok) throw new Error(res.status === 422 ? "Some inputs were rejected by the model. Please check the values." : `Server error (${res.status}).`);
      const { predicted_mental_health_score: s } = await res.json();
      render(s, d);
    } catch (err) {
      $("#e-text").textContent = err instanceof TypeError ? "Can't reach the prediction server. Make sure the app is running (uvicorn main:app)." : err.message;
      show("err");
    } finally { btn.disabled = false; }
  });
  $("#again").addEventListener("click", () => { show("idle"); $("#predict").scrollIntoView({ behavior: "smooth" }); });
  $("#retry").addEventListener("click", () => show("idle"));

  $("#sample").addEventListener("click", () => {
    const v = { age: 21, gender: "Female", country: "India", academic_level: "Undergraduate", most_used_platform: "Instagram", purpose_of_use: "Entertainment", avg_daily_usage_hours: 4.5, daily_unlocks: 110, study_hours: 4, physical_activity_hours: 1, sleep_hours_per_night: 6.8 };
    Object.entries(v).forEach(([k, x]) => { form[k].value = x; clearErr(k); }); setStress("Medium"); clearErr("stress_level");
  });

  /* charts */
  const col = v => v >= 7.5 ? "#3D9B74" : v >= 6.5 ? "#8DBF7A" : v >= 5.5 ? "#E3B341" : "#E0705F";
  function vbars(id, obj) {
    const el = $(id); el.innerHTML = "";
    Object.entries(obj).forEach(([k, v]) => {
      const c = document.createElement("div"); c.className = "col";
      c.innerHTML = `<b>${v.toFixed(1)}</b><i style="background:${col(v)}" data-h="${v / 10 * 100}"></i><span>${k}</span>`; el.appendChild(c);
    });
    return el;
  }
  function hbars(id, obj) {
    const el = $(id); el.innerHTML = "";
    Object.entries(obj).reverse().forEach(([k, v]) => {
      const r = document.createElement("div"); r.className = "hrow";
      r.innerHTML = `<span>${k}</span><div><i style="background:${col(v)}" data-w="${v * 10}"></i></div><b>${v.toFixed(1)}</b>`; el.appendChild(r);
    });
    return el;
  }
  const names = { Avg_Daily_Usage_Hours: "Social-media hours", Daily_Unlocks: "Phone unlocks", Study_Hours: "Study hours", Physical_Activity_Hours: "Physical activity", Sleep_Hours_Per_Night: "Sleep hours" };
  function corr(id, obj) {
    const el = $(id); el.innerHTML = "";
    Object.entries(obj).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      const r = document.createElement("div"); r.className = "crow";
      const pos = v >= 0;
      r.innerHTML = `<span>${names[k] || k}</span><div class="track"><i style="background:${pos ? "#3D9B74" : "#E0705F"};${pos ? "left:50%" : "right:50%"};width:0" data-w="${Math.abs(v) * 50}"></i></div><b>${v > 0 ? "+" : ""}${v.toFixed(2)}</b>`;
      el.appendChild(r);
    });
    return el;
  }
  function animate(root) {
    root.querySelectorAll("[data-h]").forEach(i => i.style.height = i.dataset.h + "%");
    root.querySelectorAll("[data-w]").forEach(i => i.style.width = i.dataset.w + "%");
  }
  fetch(`${API}/stats`).then(r => r.json()).then(s => {
    stats = s; $("#m-n").textContent = s.n.toLocaleString();
    const els = [vbars("#c-stress", s.stress), vbars("#c-sleep", s.sleep), vbars("#c-usage", s.usage), hbars("#c-plat", s.platform), corr("#c-corr", s.corr)];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }), { threshold: .3 });
    els.forEach(e => io.observe(e));
  }).catch(() => { document.querySelector("#insights .charts").innerHTML = '<p class="note">Charts unavailable — start the server to load dataset statistics.</p>'; });
})();
