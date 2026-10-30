// Static authoring source. Prints { file: HTML } for an apply_patch edit pass.
// Static HTML is the fallback; Strapi supplies published text and images at runtime.
import { preparePage, pages as cmsPages } from './cms-model.mjs';
import { readFile } from "node:fs";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
const read = promisify(readFile);
const source = JSON.parse(await read("content/site-source.json", "utf8"));
const universities = JSON.parse(
  await read("content/universities.json", "utf8"),
);
const imageMap = JSON.parse(await read("content/images.json", "utf8"));
const e = (row, col = 4) => source.english[row - 1]?.[col] || "";
const s = (row, col = 1) => source.studyAbroad[row - 1]?.[col]?.text || "";
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name, cls = "") =>
  `<span class="material-symbols-outlined ${cls}" aria-hidden="true">${name}</span>`;
const img = (src, alt, cls = "", eager = false) => {
  const asset = imageMap[src];
  return `<img src="${esc(asset?.file || src)}" alt="${esc(alt)}" class="${cls}" ${asset ? `width="${asset.width}" height="${asset.height}"` : ""} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};
const arrow = icon("arrow_forward");
const button = (text, href = "contact.html", secondary = false) =>
  `<a class="button ${secondary ? "button-secondary" : "button-primary"}" href="${esc(href)}">${esc(text)}${arrow}</a>`;
const paras = (text) =>
  text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
function rich(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.trim().split("\n");
      if (lines.every((line) => /^[✓-]\s/.test(line)))
        return `<ul class="check-list">${lines.map((line) => `<li>${esc(line.replace(/^[✓-]\s*/, ""))}</li>`).join("")}</ul>`;
      return `<p>${esc(chunk.trim()).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}
const latestIntro = e(5).split("Ver mới:\n")[1].split("\n\nVer 2:")[0];
const stats = [
  ["1,000+", "Students enrolled annually", 1000],
  ["100+", "Hands-on science classes", 100],
  ["100+", "Research & innovation projects", 100],
  ["50+", "Global competition awards", 50],
];
const statStrip = () =>
  `<div class="stats-strip">${stats.map(([value, label, count]) => `<div><strong data-count="${count}">${value}</strong><span>${label}</span></div>`).join("")}</div>`;
const programMeta = [
  [
    "study-abroad",
    "GSJ Study Abroad",
    "program_education_consulting.png",
    "school",
    "study-abroad.html",
  ],
  [
    "research",
    "Advanced Scientific Research",
    "research-experience.webp",
    "biotech",
    "research.html",
  ],
  [
    "business",
    "Business & Entrepreneurship Training",
    "business-experience.webp",
    "business_center",
  ],
  ["internship", "Professional Internship", "program_internship.jpg", "work"],
  [
    "competition",
    "International Competition Mentoring",
    "program_competition.jpg",
    "emoji_events",
  ],
  ["career-camp", "GSJ Career Youth Camp", "career-experience.webp", "public"],
  [
    "exam-prep",
    "International Academic Qualifications & Admissions Exams Preparation",
    "program_exam_prep.jpg",
    "menu_book",
  ],
  [
    "practical-science",
    "Integrated Practical Science",
    "program_practical_science.jpg",
    "science",
  ],
  [
    "career-roadmap",
    "Coaching & Mentoring on Career Roadmap",
    "coaching_career_roadmap.jpg",
    "explore",
  ],
];
const programs = programMeta.map((meta, i) => {
  const heading = e(i + 10, 3).split(/\n\s*\n/);
  let body = e(i + 10)
    .replace(/\[[^\]]+\]/g, "")
    .replace(
      'More than a research project - a foundation for future academic work. => đổi "academic" thành career/...',
      "More than a research project — a foundation for your future career.",
    )
    .trim();
  return {
    id: meta[0],
    title: meta[1],
    image: `images/${meta[2]}`,
    icon: meta[3],
    href: meta[4] || `services.html#${meta[0]}`,
    subtitle: heading.slice(1).join(" ").trim(),
    body,
  };
});
const stageStarts = [54, 63, 72, 83, 92, 101];
const stageNames = [
  "Self-discovery",
  "Academic excellence",
  "Research & leadership",
  "University selection",
  "Essays & applications",
  "University transition",
];
const stages = stageStarts.map((row, i) => ({
  id: `stage-${i + 1}`,
  title: s(row + 1).replace(/^\d+\.\s*/, ""),
  subtitle: s(row + 2),
  why: s(row + 4),
  challenge: s(row + 6),
  solution: s(row + 8),
}));
const offices = e(40)
  .split("\n\n")
  .slice(0, 4)
  .map((text, i) => text.replace(/^Hotline:[^\n]+\n/, "").split(/:\s(.+)/s))
  .map(([name, address]) => ({ name, address }));
const navItems = [
  ["about.html", "About us"],
  ["services.html", "Our Programs"],
  ["study-abroad.html", "Study Abroad"],
  ["research.html", "Research"],
  ["become-mentor.html", "Become a Mentor"],
  ["student-stories.html", "Student Stories"],
];
function header(current) {
  const links = navItems
    .map(
      ([href, label]) =>
        `<a href="${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join("");
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="container header-inner"><a class="brand" href="index.html" aria-label="GSJ — Global Scholars Journey home">${img("images/gsj_logo_new.png", "GSJ", "", true)}<span>GLOBAL SCHOLARS<br>JOURNEY</span></a><nav class="desktop-nav" aria-label="Main navigation">${links}</nav><div class="header-actions"><a href="contact.html" class="button button-primary header-cta">Let’s talk${icon("north_east")}</a><button class="menu-toggle icon-button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="site-menu">${icon("menu")}</button></div></div><div class="reading-progress" aria-hidden="true"></div></header>
<dialog id="site-menu" class="menu-drawer" aria-labelledby="menu-title"><div class="drawer-top"><p id="menu-title" class="eyebrow">YOUR NEXT CHAPTER</p><button class="menu-close icon-button" aria-label="Close navigation menu">${icon("close")}</button></div><nav aria-label="Sidebar navigation">${navItems.map(([href, label], i) => `<a href="${href}"${current === href ? ' aria-current="page"' : ""}><span class="menu-number">0${i + 1}</span><span>${label}</span>${icon("north_east")}</a>`).join("")}</nav><div class="drawer-bottom">${button("Book a consultation", "contact.html?program=study-abroad#consultation")}<a href="questions.html" class="text-link">Frequently asked questions${arrow}</a><a href="tel:0327326655">032 732 6655</a><a href="mailto:info@gsj.edu.vn">info@gsj.edu.vn</a><span class="small">Hanoi · Ho Chi Minh City · Da Nang</span></div></dialog>`;
}
function footer() {
  return `<footer class="site-footer"><div class="container"><div class="footer-top"><div><a class="footer-logo" href="index.html">${img("images/gsj_logo_new.png", "GSJ — Global Scholars Journey")}</a><h2>Your potential.<br>A world of possibilities.</h2><p>Empowering young minds on their journey<br>to becoming global scholars.</p><a href="mailto:info@gsj.edu.vn">info@gsj.edu.vn</a><a href="tel:0327326655">032 732 6655</a></div><div class="footer-links"><h3>Explore GSJ</h3>${navItems.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</div><div class="footer-links"><h3>Let’s connect</h3><a href="contact.html">Book a consultation</a><a href="questions.html">FAQs & support</a><a href="https://www.facebook.com/hocvienkhoahocgsj" target="_blank" rel="noopener noreferrer">Facebook ↗</a><a href="https://www.tiktok.com/@gsj.education" target="_blank" rel="noopener noreferrer">TikTok ↗</a><a href="https://www.youtube.com/@gsj-hocviensangtaokhoahoc" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div></div><div class="footer-offices">${offices.map((o) => `<div><h3>${esc(o.name)}</h3><p>${esc(o.address)}</p></div>`).join("")}</div><div class="footer-bottom"><span>© 2026 GSJ. All rights reserved.</span><a href="terms.html">Terms of service</a><span>Global Scholars Journey</span></div></div></footer><button class="back-top icon-button" aria-label="Back to top">${icon("arrow_upward")}</button><div id="form-status" class="form-status" role="status" aria-live="polite" hidden></div>`;
}
function layout(file, title, description, body, form = false) {
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | GSJ — Global Scholars Journey</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#0f4c81"><link rel="icon" href="images/gsj_logo_new.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet"><link rel="stylesheet" href="style.css?v=20261031-approach"><script src="main.js?v=20261031-cms" defer></script>${form ? '<script src="supabase.js?v=20261030" defer></script>' : ""}</head><body>${header(file)}<main id="main" tabindex="-1">${body}</main>${footer()}</body></html>\n`;
}
const sectionHead = (eyebrow, title, description = "", action = "") =>
  `<div class="section-head reveal"><div><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2>${description ? `<p class="section-intro">${esc(description)}</p>` : ""}</div>${action}</div>`;
function cta(
  title = "Every great journey starts with you.",
  text = "Explore your strengths, discuss your goals, and discover your next step with GSJ.",
  label = "Book a 1-on-1 consultation",
) {
  return `<section class="cta-section section"><div class="container cta-inner reveal"><div><p class="eyebrow">LET’S SHAPE WHAT’S NEXT</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>${button(label, "contact.html?program=study-abroad#consultation")}</div></section>`;
}
function pageHero(eyebrow, title, text, image, alt, extra = "") {
  return `<section class="page-hero"><div class="container split-hero"><div class="hero-copy"><p class="eyebrow">${esc(eyebrow)}</p><h1>${title}</h1><p class="hero-description">${esc(text)}</p>${extra}</div><figure class="page-hero-visual">${img(image, alt, "", true)}<figcaption><span class="caption-dot"></span>Real experiences. Meaningful growth.</figcaption></figure></div></section>`;
}
function logoGrid(rankings = false, limit = universities.length, id = "") {
  return `<div class="university-grid ${rankings ? "with-rankings" : ""}" ${id ? `id="${id}"` : ""}>${(rankings || limit < universities.length ? universities.slice(0, limit) : [...universities, { name: "Trinity College", file: "images/universities/trinity-college.svg" }]).map((u, i) => `<figure class="university-logo" data-region="${i < 18 ? "us" : i < 20 ? "singapore" : i < 26 ? "australia" : "asia"}">${u.file ? img(u.file, u.name) : `<span class="university-wordmark">${esc(u.name)}</span>`}${rankings ? `<figcaption>${esc(u.ranking || "Vietnam")}</figcaption>` : ""}</figure>`).join("")}</div>`;
}
function programCards(limit = 3) {
  return `<div class="program-grid">${programs
    .slice(0, limit)
    .map(
      (p, i) =>
        `<article class="program-card reveal"><a class="card-image" href="${p.href}">${img(p.image, p.title)}<span class="image-number">0${i + 1}</span></a><div class="program-card-copy"><p class="eyebrow">${i === 0 ? "YOUR GLOBAL FUTURE" : i === 1 ? "CURIOSITY INTO DISCOVERY" : "IDEAS INTO IMPACT"}</p><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.subtitle)}</p><a class="text-link" href="${p.href}">Discover the program${arrow}</a></div></article>`,
    )
    .join("")}</div>`;
}
const visionMission = e(6).split("\n\n");
const people = e(7)
  .split(/\n\n(?=2\.)/)
  .map((p, i) => {
    const lines = p.split("\n");
    return {
      name: lines[0].replace(/^\d\.\s*/, ""),
      role: lines[1],
      bio: lines.slice(3).filter(Boolean),
      image: i === 0 ? "Mrs._Dang_Thuy_Nga.JPG" : "Mrs._Vu_Ngan_Binh.JPG",
    };
  });
function team() {
  return `<div class="team-grid">${people.map((p) => `<article class="team-card reveal"><div class="team-portrait">${img(`images/${p.image}`, p.name)}</div><div><p class="eyebrow">${esc(p.role)}</p><h3>${esc(p.name)}</h3><ul>${p.bio.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div></article>`).join("")}</div>`;
}
function mission() {
  return `<div class="mission-grid"><article class="reveal"><span class="line-icon">${icon("visibility")}</span><h3>Vision</h3><p>${esc(visionMission[1])}</p></article><article class="mission-card reveal"><span class="line-icon">${icon("flag")}</span><p class="eyebrow">OUR MISSION</p><h3>One million students.<br>One million possibilities.</h3><p>${esc(visionMission[3])}</p></article></div>`;
}

const storyAssets = [
  "Ảnh_testimonial_Đỗ_Hoàng_Minh_Tuệ.jpg",
  "Ảnh_testimonial_Hwang_YoungGoon_-_Gold_Medalist_at_iWise_Global_Final_(Dubai).jpg",
  "Ảnh_testimonial_Nguyen_Lan_Bao_-_Gold_Medalist_at_iWise_Global_Final_(Dubai).jpg",
  "Ảnh_testimonial_Tran_Mai_Chi,_Student_at_Hanoi_Amsterdam_High_School_for_the_Gifted.jpg",
  "Ảnh_testimonial_Vu_Ba_Minh,_Student_in_the_Environmental_Chemistry_Research_Project.jpg",
  "testimonial_cao_bich_hue.png",
  "testimonial_duong_quynh_huong.jpg",
  "testimonial_le_khanh_hoa.jpg",
  "testimonial_le_trinh_bao_han.jpg",
  "testimonial_pham_anh_kiet.jpg",
  "testimonial_vu_bao_nghi.jpg",
];
const stories = [33, 34, 35].map((row) => {
  const [heading, ...body] = e(row).split("\n\n");
  return { heading, body: body.join("\n\n") };
});
for (const row of [36, 37]) {
  const chunks = e(row)
    .replace(/^[\s\S]*?\n\n(?=1\.)/, "")
    .split(/\n\n(?=\d\.)/);
  for (const chunk of chunks) {
    const match = chunk.match(/^\d\.\s*([^\n]+)\n+([\s\S]*)$/);
    if (match)
      stories.push({
        heading: match[1],
        body: match[2].trim().replace(/^["“]|["”]$/g, ""),
      });
  }
}
stories.forEach((story, i) => {
  story.image = `images/${storyAssets[i]}`;
  story.name = story.heading.split(/\s[-–,]\s|,\s/)[0];
  story.caption = story.heading
    .slice(story.name.length)
    .replace(/^[\s,–-]+/, "");
});
function storyCard(story, full = false) {
  const first = story.body.split("\n\n")[0];
  return `<article class="story-card ${full ? "full-story" : ""}"><div class="quote-mark" aria-hidden="true">“</div><blockquote>${paras(first)}</blockquote>${story.body.length > first.length ? `<details class="story-more"><summary>Read the full story ${icon("add")}</summary><div>${paras(story.body.slice(first.length))}</div></details>` : ""}<div class="story-person">${img(story.image, story.name)}<div><h3>${esc(story.name)}</h3><p>${esc(story.caption)}</p></div></div></article>`;
}
function testimonialSection() {
  return `<section class="section pale" id="testimonials"><div class="container">${sectionHead("OUR STUDENTS, OUR IMPACT", "Real journeys, In their own words.", "Hear from the students and families behind the achievements.", '<div class="carousel-actions"><button class="icon-button" data-carousel-prev aria-label="Previous student story">' + icon("arrow_back") + '</button><button class="icon-button" data-carousel-next aria-label="Next student story">' + arrow + "</button></div>")}<div class="story-carousel" tabindex="0" role="region" aria-label="Student stories carousel">${stories.map((x) => storyCard(x)).join("")}</div><a class="text-link stories-link" href="student-stories.html">Read all student stories${arrow}</a></div></section>`;
}
function awards() {
  const chunks = e(32)
    .split(/\n\n-\s/)
    .slice(1);
  const images = [
    "award_kiyo.jpg",
    "award_gys.jpg",
    "award_tesla.jpg",
    "award_ai_jam.jpg",
    "award_abs.jpg",
    "award_icpc.jpg",
    "award_iwise.png",
    "award_iwise.png",
  ];
  return `<div class="awards-grid">${chunks
    .map((chunk, i) => {
      const [heading, ...body] = chunk.trim().split("\n\n");
      return `<article class="award-card reveal">${i < 7 ? img(`images/${images[i]}`, heading) : ""}<div><h3>${esc(heading)}</h3>${rich(body.join("\n\n"))}</div></article>`;
    })
    .join("")}</div>`;
}
const files = {};
files["index.html"] = layout(
  "index.html",
  "Explore, Research, Innovate, Lead.",
  latestIntro,
  `<section class="home-hero"><div class="container home-hero-grid"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-line"></span>YOUR CAREER JOURNEY STARTS NOW</p><h1>Explore, Research,<br>Innovate, <em>Lead.</em></h1><p class="hero-description">${esc(latestIntro)}</p><div class="button-row">${button("Explore your possibilities", "services.html")}${button("Meet GSJ", "about.html", true)}</div><div class="hero-note"><div class="avatar-stack">${stories
    .slice(0, 3)
    .map((t) => img(t.image, t.name))
    .join(
      "",
    )}</div><span>Individual potential.<br><strong>Extraordinary journeys.</strong></span></div></div><div class="home-visual"><div class="photo-frame">${img("images/career-experience.webp", "GSJ students exploring a global university campus", "", true)}<div class="photo-caption"><span>LEARN FOR REAL. DO FOR REAL.</span><p>Your future starts<br>with real experience.</p></div></div><div class="orbit-stamp" aria-hidden="true">${icon("public")}<span>LOCAL ROOTS<br>GLOBAL POSSIBILITIES</span></div><a class="hero-float" href="study-abroad.html">${icon("school")}<span>THE NEXT CHAPTER<br><strong>GSJ Study Abroad</strong></span>${icon("north_east")}</a></div></div><div class="container">${statStrip()}</div></section>
<section class="section"><div class="container">${sectionHead("A PATH THAT’S YOUR OWN", "Discover what you can become.", "Personalized pathways from self-discovery to meaningful experiences and a future built around you.", '<a class="text-link" href="services.html">Explore all 9 programs' + arrow + "</a>")}${programCards()}</div></section>
<section class="section pale"><div class="container"><div class="intro-split reveal" id="approach"><p class="eyebrow">THE GSJ APPROACH</p><div><h2>More than academic excellence,<br><em>A foundation for life.</em></h2><p>${esc(e(5).split("Ver 3:\n")[1])}</p><a href="about.html" class="text-link">Discover our story${arrow}</a></div></div>${mission()}</div></section>
<section class="section"><div class="container">${sectionHead("BEYOND BORDERS", "GSJ Students’ University Destinations", "The next chapter of our students’ journeys, at universities around the world.", '<a class="text-link" href="study-abroad.html#destinations">See all destinations' + arrow + "</a>")}${logoGrid(false, 12)}</div></section>${testimonialSection()}${cta()}`,
);

files["about.html"] = layout(
  "about.html",
  "About us",
  latestIntro,
  `${pageHero("GLOBAL SCHOLARS JOURNEY", "Every student deserves<br><em>their own path.</em>", latestIntro, "images/about_hero.jpg", "GSJ students learning from a university educator", button("Explore our programs", "services.html"))}<section class="section"><div class="container"><div class="narrow prose reveal">${sectionHead("WHO WE ARE", "Education built around the individual.")}${paras(e(5).split("Ver 1:\n")[1].split("\n\nVer mới:")[0])}</div>${mission()}</div></section><section class="section pale" id="leadership"><div class="container">${sectionHead("PEOPLE BEHIND THE PURPOSE", "Our Leadership Team")}${team()}</div></section><section class="section" id="destinations"><div class="container">${sectionHead("OUR STUDENTS’ NEXT CHAPTER", "GSJ Students’ University Destinations")}${logoGrid()}</div></section><section class="section pale" id="partnership"><div class="container">${sectionHead("CONNECTING PEOPLE & POSSIBILITY", "Our learning network", "GSJ connects students with educators, researchers and professional learning environments in Vietnam and around the world.")}<div class="partner-logos">${[
    ["logo_hust.png", "Hanoi University of Science and Technology"],
    ["logo_hemispheres.png", "Hemispheres Foundation"],
    ["logo_english_connection.jpg", "The English Connection"],
    ["logo_kevin_doan.png", "Kevin Doan English Center"],
    ["logo_cn_vision.png", "CN Vision"],
  ]
    .map(([src, alt]) => img("images/" + src, alt))
    .join(
      "",
    )}</div></div></section><section class="section" id="blog"><div class="container story-callout reveal"><div><p class="eyebrow">GSJ STUDENTS’ BLOG</p><h2>Discover the experiences<br>behind the achievements.</h2><p>Research, competitions and the moments that shape a student’s direction — told by our students and families.</p>${button("Read student stories", "student-stories.html")}</div>${img(stories[0].image, stories[0].name)}</div></section>${cta()}`,
);

files["services.html"] = layout(
  "services.html",
  "Our Programs",
  "Discover nine personalized GSJ pathways in study abroad, research, business, internships, competitions and career development.",
  `${pageHero("OUR PROGRAMS", "Many possibilities,<br><em>Your own direction.</em>", "From discovering your interests to preparing for your future, explore the experiences and support that help you take the next step.", "images/services_hero.jpg", "GSJ students celebrating their achievements", button("Find your pathway", "#programs"))}<section class="section" id="programs"><div class="container program-layout"><aside class="section-sidebar"><p class="eyebrow">EXPLORE OUR PROGRAMS</p><nav aria-label="Program sections" data-section-nav>${programs.map((p, i) => `<a href="#${p.id}"><span>0${i + 1}</span>${esc(p.title)}</a>`).join("")}</nav></aside><div class="program-details">${programs.map((p, i) => `<article id="${p.id}" class="program-detail" data-spy><div class="program-detail-top"><p class="eyebrow">PROGRAM 0${i + 1} / 09</p>${icon(p.icon)}</div><h2>${esc(p.title)}</h2><p class="program-subtitle">${esc(p.subtitle)}</p><figure class="program-wide-photo">${img(p.image, p.title)}</figure><div class="prose">${rich(p.body)}</div><div class="button-row">${button("Discuss this program", `contact.html?program=${p.id}#consultation`)}${i < 2 ? button("Explore the pathway", p.href, true) : ""}</div></article>`).join("")}</div></div></section>${cta()}`,
);

function stageSolution(text) {
  const [body, outcome] = text.split(/\n\s*Outcome:\s*/);
  const steps = body
    .trim()
    .split(/\n\s*(?=(?:Step\s)?\d+[.:])/)
    .filter(Boolean);
  return `<ol class="support-steps">${steps
    .map((step) => {
      const cleaned = step.replace(/^(?:Step\s)?\d+[.:]\s*/, "").trim();
      const split = cleaned.match(/^([^\n:]+?)(?:\n|:\s|\s-\s)([\s\S]*)$/);
      return `<li><div>${split ? `<h4>${esc(split[1])}</h4><p>${esc(split[2].trim())}</p>` : `<p>${esc(cleaned)}</p>`}</div></li>`;
    })
    .join(
      "",
    )}</ol>${outcome ? `<div class="stage-outcome">${icon("check_circle")}<div><span class="eyebrow">YOUR OUTCOME</span><p>${esc(outcome.trim())}</p></div></div>` : ""}`;
}
const ecosystemMeta = [
  ["research-experience.webp", "research.html", "Science & research"],
  [
    "business-experience.webp",
    "services.html#business",
    "Business & entrepreneurship",
  ],
  [
    "leadership-experience.webp",
    "services.html#competition",
    "Leadership & global skills",
  ],
  [
    "career-experience.webp",
    "services.html#career-camp",
    "University & career experiences",
  ],
];
function ecosystem() {
  const entries = s(82).split(/\n\s*\n/);
  return `<div class="ecosystem"><p class="eyebrow">LEARN FOR REAL. DO FOR REAL.</p><h4>${esc(s(81))}</h4><div class="ecosystem-grid">${entries
    .map((entry, i) => {
      const [title, ...desc] = entry.split("\n");
      const meta = ecosystemMeta[i];
      return `<a class="ecosystem-card" href="${meta[1]}">${img("images/" + meta[0], meta[2])}<div><h5>${esc(title.replace(/^\d\.\s*/, ""))}</h5><p>${esc(desc.join(" ").trim())}</p><span class="text-link">Explore the program${arrow}</span></div></a>`;
    })
    .join(
      "",
    )}</div><div class="stage-stories">${[stories[0], stories[8]].map((story) => `<blockquote><p>“${esc(story.body.split("\n\n")[0])}”</p><cite>${esc(story.name)} · ${esc(story.caption)}</cite></blockquote>`).join("")}</div></div>`;
}
const studyBody = `${pageHero(s(3), "Beyond University Admissions,<br><em>Towards a Future<br>Built Around You.</em>", s(5), "images/program_education_consulting.png", "GSJ students attending a university career experience", `<div class="button-row">${button(s(6), "contact.html?program=study-abroad#consultation")}${button("Explore your journey", "#journey", true)}</div><p class="hero-meta">US · UK · Australia · Singapore · Canada · Europe</p>`)}
<section class="section" id="destinations"><div class="container">${sectionHead("THEIR JOURNEYS, NEW HORIZONS", s(8))}<div class="filter-row" role="group" aria-label="Filter university destinations"><button type="button" class="filter-button" data-filter="all" aria-pressed="true">All destinations</button><button type="button" class="filter-button" data-filter="us" aria-pressed="false">United States</button><button type="button" class="filter-button" data-filter="australia" aria-pressed="false">Australia</button><button type="button" class="filter-button" data-filter="singapore" aria-pressed="false">Singapore</button><button type="button" class="filter-button" data-filter="asia" aria-pressed="false">Other Asia</button></div>${logoGrid(true, universities.length, "destination-grid")}<p class="small ranking-note">Rankings supplied by GSJ; systems and editions vary. NU: National Universities · LAC: Liberal Arts Colleges. QS labels refer to the 2026 edition.</p><p class="transition-copy">${esc(s(41))}${icon("south")}</p></div></section>
<section class="section ink" id="admissions"><div class="container"><div class="insight-layout"><div>${sectionHead("ADMISSIONS INSIGHTS", s(43), s(44))}<div class="admission-stats"><div><strong>76.8<span>%</span></strong><p>of surveyed colleges rated grades in college-preparatory courses as considerably important.</p></div><div><strong>63.8<span>%</span></strong><p>rated the strength of the high school curriculum as considerably important.</p></div></div><a class="source-link" href="https://www.nacacnet.org/factors-in-the-admission-decision/" target="_blank" rel="noopener noreferrer">Source: NACAC · Fall 2023 survey${icon("north_east")}</a></div><aside class="admissions-quote"><p class="eyebrow">WHAT HARVARD SAYS</p><blockquote>“There is no formula for gaining admission to Harvard.”</blockquote><p>Harvard considers academic accomplishment alongside leadership, community involvement, extracurricular distinction and personal character.</p><a class="source-link" href="https://college.harvard.edu/resources/faq/what-admissions-criteria-do-you-use" target="_blank" rel="noopener noreferrer">Harvard College Admissions${icon("north_east")}</a></aside></div><div class="insight-conclusion">${paras(s(49))}</div></div></section>
<section class="section journey-section" id="journey"><div class="container">${sectionHead("A PERSONALIZED MENTORING JOURNEY", s(51), s(52))}<div class="journey-layout"><aside class="section-sidebar journey-sidebar"><p class="eyebrow">YOUR SIX-STAGE ROADMAP</p><nav aria-label="Mentoring journey stages" data-section-nav>${stages.map((st, i) => `<a href="#${st.id}"><span>0${i + 1}</span>${stageNames[i]}</a>`).join("")}</nav><div class="sidebar-help"><p>Not sure where to start?</p><a class="text-link" href="contact.html?program=study-abroad#consultation">Let’s find your direction${arrow}</a></div></aside><div class="journey-content">${stages.map((st, i) => `<article id="${st.id}" class="journey-stage" data-spy><div class="stage-heading"><span class="stage-number">0${i + 1}</span><div><p class="eyebrow">YOUR JOURNEY / STAGE 0${i + 1}</p><h3>${esc(st.title)}</h3><p class="stage-subtitle">${esc(st.subtitle)}</p></div></div><div class="stage-context"><details><summary>Why it matters${icon("add")}</summary><div class="prose">${paras(st.why)}${[0, 1, 2, 3].includes(i) ? `<a class="source-link" href="${i === 2 ? "https://mitadmissions.org/apply/process/what-we-look-for/" : "https://admissions.yale.edu/what-yale-looks-for"}" target="_blank" rel="noopener noreferrer">Read the university’s admissions guidance${icon("north_east")}</a>` : ""}</div></details><details><summary>The challenges students face${icon("add")}</summary><div class="prose">${paras(st.challenge)}</div></details></div><h4 class="support-title">How GSJ supports you</h4>${stageSolution(st.solution)}${i === 2 ? ecosystem() : ""}</article>`).join("")}</div></div></div></section>
<section class="section pale" id="why-gsj"><div class="container">${sectionHead("WHY CHOOSE GSJ?", s(111), s(112))}<div class="usp-list">${[
  113, 114, 115, 116, 117,
]
  .map((row, i) => {
    const [title, ...body] = s(row).split(/\n\s*\n/);
    return `<article class="reveal"><span>0${i + 1}</span><h3>${esc(title)}</h3><p>${esc(body.join(" "))}</p></article>`;
  })
  .join(
    "",
  )}</div><blockquote class="pull-quote">${esc(s(118))}</blockquote></div></section>
<section class="section" id="impact"><div class="container">${sectionHead("OUR STUDENTS, OUR IMPACT", "The experiences behind the applications.")}<div class="impact-feature"><figure>${img(stories[0].image, stories[0].name)}</figure><div><p class="eyebrow">DO HOANG MINH TUE</p><h3>From hands-on research<br>to a future in medicine.</h3><p class="impact-result">VinUniversity Medicine · 80% scholarship <span>(reported in GSJ’s student account)</span></p><blockquote>“${esc(stories[0].body.split("\n\n")[0])}”</blockquote><a href="student-stories.html#story-1" class="text-link">Read Minh Tue’s story${arrow}</a></div></div><div class="impact-quotes">${[stories[3], stories[6]].map((t) => storyCard(t)).join("")}</div></div></section>${cta(s(129), s(130) + " " + s(131), "Book your personalized consultation")}`;
files["study-abroad.html"] = layout(
  "study-abroad.html",
  "GSJ Study Abroad",
  s(5),
  studyBody,
);

const researchOverview = e(21)
  .split(/\n\n(?=-\s)/)
  .map((p) => p.replace(/^-\s*/, ""));
const researchBenefits = e(22)
  .split(/\n\n(?=-\s)/)
  .map((p) => p.replace(/^-\s*/, ""));
const nounHeadings = [
  "Curiosity & Creativity",
  "Hands-On Experience",
  "Professional Networking",
  "Skill Development",
  "Stronger University Applications",
];
const processTitles = [
  "Topic Selection",
  "Research Question",
  "Research Plan",
  "Research Execution",
  "Analysis & Conclusions",
  "Findings & Presentation",
];
const processTexts = [
  "Choose a topic driven by your own interests and curiosity.",
  "Review the literature, identify a gap and frame an original question.",
  "Design the methodology and plan the work with your mentor.",
  "Collect evidence and carry out your research in professional environments.",
  "Analyze the data and develop evidence-based conclusions.",
  "Write a research report and share your findings with an expert audience.",
];
files["research.html"] = layout(
  "research.html",
  "Advanced Scientific Research",
  e(20).split("\n\n")[0],
  `${pageHero("ADVANCED SCIENTIFIC RESEARCH", "Your curiosity,<br><em>Original discoveries.</em>", programs[1].subtitle, "images/research-experience.webp", "GSJ students conducting hands-on laboratory research", button("Start your research journey", "contact.html?program=research#consultation"))}<section class="section"><div class="container"><div class="prose narrow">${sectionHead("ASK ORIGINAL QUESTIONS", "What is Advanced Scientific Research?")}${paras(e(20).replace(/^Advanced Scientific Research' refers/, "Advanced Scientific Research refers"))}</div><div class="discipline-strip">${["Business & Economics", "Technology & Engineering", "Natural Sciences", "Social Sciences"].map((t) => `<span>${esc(t)}</span>`).join("")}</div></div></section><section class="section pale"><div class="container">${sectionHead("FROM QUESTION TO CONTRIBUTION", "Our Research Program Overview")}<div class="info-grid">${researchOverview
    .map((p, i) => {
      const [title, ...text] = p.split("\n");
      return `<article class="info-card reveal"><span class="line-icon">${icon(["groups", "description", "record_voice_over", "article"][i])}</span><h3>${esc(title)}</h3><p>${esc(text.join(" "))}</p></article>`;
    })
    .join(
      "",
    )}</div></div></section><section class="section"><div class="container">${sectionHead("GROW THROUGH DISCOVERY", "Why participate?")}<div class="benefit-list">${researchBenefits.map((p, i) => `<article class="reveal"><span>0${i + 1}</span><div><h3>${nounHeadings[i]}</h3><p>${esc(p.split("\n").slice(1).join(" "))}</p></div></article>`).join("")}</div></div></section><section class="section ink"><div class="container">${sectionHead("THE RESEARCH PROCESS", "From a question to something that matters.")}<ol class="process-grid">${processTitles.map((t, i) => `<li><span>0${i + 1}</span><h3>${t}</h3><p>${processTexts[i]}</p></li>`).join("")}</ol></div></section>${testimonialSection()}${cta("Ready to start your research journey?", "Explore a question that matters to you, with expert mentorship at every stage.", "Talk to our research team")}`,
);

function field(id, label, type = "text", required = false, help = "") {
  return `<div class="field"><label for="${id}">${label}${required ? ' <span aria-hidden="true">*</span>' : ""}</label><input id="${id}" name="${id}" type="${type}"${required ? " required" : ""}${type === "email" ? ' autocomplete="email"' : type === "tel" ? ' autocomplete="tel"' : ""}>${help ? `<p class="field-help">${esc(help)}</p>` : ""}</div>`;
}
function textarea(id, label, required = false, help = "") {
  return `<div class="field"><label for="${id}">${label}${required ? ' <span aria-hidden="true">*</span>' : ""}</label><textarea id="${id}" name="${id}" rows="4"${required ? " required" : ""}></textarea>${help ? `<p class="field-help">${esc(help)}</p>` : ""}</div>`;
}
function select(id, label, options, required = false) {
  return `<div class="field"><label for="${id}">${label}${required ? ' <span aria-hidden="true">*</span>' : ""}</label><select id="${id}" name="${id}"${required ? " required" : ""}><option value="">Select an option</option>${options
    .map((o) => {
      const [value, text] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(value)}">${esc(text)}</option>`;
    })
    .join("")}</select></div>`;
}
const mentorForm = `<form id="mentor-form" data-form="mentor"><p class="small form-required">Fields marked * are required.</p><div class="form-row">${field("mentor-first-name", "First name", "text", true)}${field("mentor-last-name", "Last name", "text", true)}</div><div class="form-row">${field("mentor-email", "Email", "email", true)}${field("mentor-phone", "Phone", "tel", true)}</div>${field("mentor-project-title", "Research project title", "text", false, "A working title is welcome.")}${textarea("mentor-project-overview", "Project overview", false, "Briefly describe the research project a student would participate in.")}${field("mentor-research-field", "Research field")}<div class="form-row">${select(
  "mentor-availability",
  "Availability",
  [
    ["open", "Open Enrollment"],
    ["cohort", "Cohort"],
    ["either", "Either"],
  ],
)}${select("mentor-mode", "Mode of engagement", [
  ["in-person", "In-Person"],
  ["remote", "Remote"],
  ["either", "Either"],
])}</div>${select(
  "mentor-experience",
  "Prior experience with high school students",
  [
    ["yes", "Yes"],
    ["no", "No"],
  ],
)}${textarea("mentor-responsibilities", "Student responsibilities")}${textarea("mentor-student-profile", "Ideal student profile")}${textarea("mentor-skills", "Skills and learning outcomes")}${select(
  "mentor-time",
  "Weekly time commitment",
  [
    ["2-3", "2 to 3 hours per week"],
    ["4-6", "4 to 6 hours per week"],
    ["7-10", "7 to 10 hours per week"],
    ["10-20", "10 to 20 hours per week"],
  ],
)}${textarea("mentor-additional", "Additional information")}${field("mentor-how-heard", "How did you hear about GSJ?", "text", false, "If someone referred you, please include their name.")}<button class="button button-primary" type="submit">Submit application${arrow}</button><p class="form-feedback" role="status" aria-live="polite"></p></form>`;
const mentorInfoRows = [25, 26, 27, 28];
const mentorTitles = [
  "Benefits for Mentors",
  "What We Provide",
  "Expectations & Requirements",
  "Time Commitment",
];
const mentorBody = `${pageHero("BECOME A MENTOR", "Share your expertise,<br><em>Shape a scholar’s future.</em>", e(24), "images/program_scientific_research_new.jpg", "GSJ mentor guiding students during a collaborative research session", button("Join our mentor community", "#mentor-apply"))}<section class="section"><div class="container mentor-info">${mentorInfoRows.map((row, i) => `<article class="mentor-info-block reveal"><p class="eyebrow">0${i + 1} / MENTORING AT GSJ</p><h2>${mentorTitles[i]}</h2><div class="prose">${rich(e(row))}</div></article>`).join("")}</div></section><section class="section pale"><div class="container">${sectionHead("A COMMUNITY OF EXPERTISE", "Notable places where our mentors work")}<ul class="institution-list">${e(
  29,
)
  .split("\n")
  .filter(Boolean)
  .map((t) => `<li>${esc(t.replace(/^-\s*/, ""))}</li>`)
  .join(
    "",
  )}</ul></div></section><section class="section" id="mentor-apply"><div class="container form-layout"><div class="form-intro"><p class="eyebrow">BECOME PART OF THE JOURNEY</p><h2>Let’s Work Together</h2>${paras(e(30))}<p class="small">For questions, reach us at <a href="mailto:info@gsj.edu.vn">info@gsj.edu.vn</a>.</p></div><div class="form-panel">${mentorForm}</div></div></section>`;
files["become-mentor.html"] = layout(
  "become-mentor.html",
  "Become a Mentor",
  e(24),
  mentorBody,
  true,
);
files["mentors.html"] = layout(
  "mentors.html",
  "Our Mentors",
  e(24),
  mentorBody,
  true,
);

files["student-stories.html"] = layout(
  "student-stories.html",
  "Student Stories",
  "Student and parent experiences with GSJ research, competitions, mentorship and university pathways.",
  `${pageHero("OUR STUDENTS, OUR IMPACT", "Real experiences,<br><em>Lasting possibilities.</em>", "Meet the students and families behind the achievements. Their stories bring research, competition and personal growth to life.", "images/services_hero.jpg", "GSJ students celebrating competition achievements", button("Explore their stories", "#stories"))}<section class="section ink"><div class="container">${sectionHead("RECOGNIZED EXCELLENCE", "Ambition, put into practice.")}${statStrip()}</div></section><section class="section" id="stories"><div class="container">${sectionHead("IN THEIR OWN WORDS", "The moments that shape a journey.")}<div class="all-stories">${stories.map((story, i) => `<div id="story-${i + 1}">${storyCard(story, true)}</div>`).join("")}</div></div></section><section class="section pale" id="awards"><div class="container">${sectionHead("ON THE GLOBAL STAGE", "Students’ Achievements & Awards")}${awards()}</div></section>${cta()}`,
);

const faq = e(38)
  .split(/\n\n(?=\d+\.)/)
  .map((chunk) => {
    const [q, ...a] = chunk.split("\n");
    return {
      q: q.replace(/^\d+\.\s*/, ""),
      a: a
        .join(" ")
        .replace("an research", "a research")
        .replace("Student is paired", "Each student is paired")
        .replace("Australia,America,...", "Australia and America"),
    };
  });
files["questions.html"] = layout(
  "questions.html",
  "Frequently Asked Questions",
  "Answers about GSJ programs, mentoring, research projects, competitions and study abroad.",
  `<section class="text-hero"><div class="container"><p class="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p><h1>Your questions.<br><em>Our guidance.</em></h1><p>Everything you need to take your next step with confidence.</p></div></section><section class="section"><div class="container faq-layout"><aside><p class="eyebrow">WE’RE HERE TO HELP</p><h2>Let’s talk it through.</h2><p>Every student’s journey is different. Our team can help you find a starting point that fits.</p>${button("Talk to GSJ", "contact.html#consultation")}</aside><div class="faq-list">${faq.map((f, i) => `<details><summary><span class="faq-number">${String(i + 1).padStart(2, "0")}</span>${esc(f.q)}${icon("add")}</summary><div class="prose"><p>${esc(f.a)}</p></div></details>`).join("")}</div></div></section><section class="section pale"><div class="container form-layout"><div class="form-intro"><p class="eyebrow">STILL SOMETHING ON YOUR MIND?</p><h2>Tell us what<br>you’re thinking.</h2><p>Share your situation and our team will get back to you with guidance.</p></div><div class="form-panel"><form id="question-form" data-form="question"><p class="small form-required">Fields marked * are required.</p><div class="form-row">${field("question-name", "Full name", "text", true)}${field("question-email", "Email", "email", true)}</div>${select("question-concern", "What is your main concern?", ["Time commitment", "Choosing a research topic", "Skills and preparation", "Program costs", "Study abroad pathways", "Something else"])}${textarea("question-message", "Tell us more about your situation", true)}<button class="button button-primary" type="submit">Get advice from our team${arrow}</button><p class="form-feedback" role="status" aria-live="polite"></p></form></div></div></section>`,
  true,
);

files["contact.html"] = layout(
  "contact.html",
  "Book a Consultation",
  "Contact GSJ in Hanoi, Ho Chi Minh City and Da Nang for personalized academic and university guidance.",
  `<section class="text-hero"><div class="container"><p class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Let’s discover<br><em>what’s next for you.</em></h1><p>A conversation today. A clearer direction tomorrow.</p></div></section><section class="section" id="consultation"><div class="container form-layout"><div class="form-intro"><p class="eyebrow">BOOK A PERSONALIZED CONSULTATION</p><h2>Tell us about<br>your ambitions.</h2><p>Explore your strengths, discuss your goals, and discover how GSJ can support your university journey.</p><div class="contact-methods"><a href="tel:0327326655">${icon("call")}<span><small>CALL OUR TEAM</small>032 732 6655</span>${icon("north_east")}</a><a href="mailto:info@gsj.edu.vn">${icon("mail")}<span><small>SEND US AN EMAIL</small>info@gsj.edu.vn</span>${icon("north_east")}</a></div><p class="small">Prefer a call? Include a convenient date and time in your message. Our team will contact you to confirm availability.</p></div><div class="form-panel"><form id="contact-form" data-form="contact"><p class="small form-required">Fields marked * are required.</p><div class="form-row">${field("contact-name", "Full name", "text", true)}${field("contact-email", "Email", "email", true)}</div>${select("contact-subject", "What would you like to explore?", [...programs.map((p) => [p.id, p.title]), ["mentorship", "Mentorship opportunities"], ["partnership", "Partnerships"], ["other", "Something else"]], true)}${textarea("contact-message", "Your goals, questions or preferred consultation time", true)}<button class="button button-primary" type="submit">Request a consultation${arrow}</button><p class="small">We’ll use your information to respond to your enquiry. <a href="terms.html">View our terms</a>.</p><p class="form-feedback" role="status" aria-live="polite"></p></form></div></div></section><section class="section pale"><div class="container">${sectionHead("CLOSER TO YOU", "Visit our offices.")}<div class="office-grid">${offices.map((o, i) => `<article><span class="line-icon">${icon("location_on")}</span><p class="eyebrow">0${i + 1}</p><h3>${esc(o.name)}</h3><p>${esc(o.address)}</p><a class="text-link" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}">Find us on the map${icon("north_east")}</a></article>`).join("")}</div></div></section>`,
  true,
);

const legal = await read("content/terms.html", "utf8");
files["terms.html"] = layout(
  "terms.html",
  "Terms of Service",
  "GSJ program policies, responsibilities and guidelines.",
  `<section class="text-hero"><div class="container"><p class="eyebrow">PROGRAM POLICIES</p><h1>Terms of Service</h1><p>Our responsibilities, policies and guidelines.</p></div></section><section class="section"><div class="container narrow prose legal-copy">${legal.replaceAll("Global Science Journey", "Global Scholars Journey").replace(/style="[^"]*"/g, "")}</div></section>`,
);

const write = process.argv.includes("--write");
const requested = process.argv.slice(2).filter((arg) => arg !== "--write");
const formattedFiles = Object.fromEntries(
  Object.entries(files).map(([file, html]) => [
    file,
    preparePage(html.replace(/\r/g, "").replace(/></g, ">\n<"), cmsPages.find(([name]) => name === file)?.[1] || 'become-mentor').html,
  ]),
);
const selected = requested.length
  ? Object.fromEntries(
      Object.entries(formattedFiles).filter(([file]) =>
        requested.includes(file),
      ),
    )
  : formattedFiles;
if (write) {
  for (const [file, html] of Object.entries(selected))
    await writeFile(file, html, "utf8");
  console.log(`Rendered ${Object.keys(selected).length} static pages.`);
} else process.stdout.write(JSON.stringify(selected));
