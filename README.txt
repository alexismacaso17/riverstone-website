THE RIVERSTONE GROUP — WEBSITE
================================

A self-contained, static rebuild of theriverstonegroup.com in the new
Riverstone brand design system. Plain HTML/CSS/JS — no build step.

FILES
-----
  index.html            The whole page (single-page site with anchored sections).
  styles.css            Site-specific component styles.
  colors_and_type.css   Brand tokens (colors, type, spacing). Copied from the design system.
  main.js               Header, scroll-spy nav, reveal-on-scroll, mobile menu, contact form.
  assets/               Logos + favicon.

RUN LOCALLY
-----------
  Just open index.html in a browser, or serve the folder:
      python3 -m http.server 8000
  then visit http://localhost:8000

DEPLOY
------
  Drag this folder into Netlify, Vercel, Cloudflare Pages, or GitHub Pages.
  Everything is relative-path and self-contained.

TO DO — THINGS THAT NEED YOUR INPUT
-----------------------------------
  1. PHOTOGRAPHY. Every image is currently a warm brand-color gradient
     placeholder (hero, each project cover, each team portrait). Drop real
     photos into assets/ and replace the .rs-hero__photo / .rs-project__cover
     / .rs-person__portrait blocks. Follow the brand photo rules: warm,
     naturally-lit, architectural — never cold-blue corporate stock.

  2. TEAM TITLES. The live site shows names only, so roles are placeholders
     ("Principal" / "Team member"). Send me the real titles and I'll set them.

  3. CONTACT FORM BACKEND. A static page can't send email by itself. To
     receive submissions, pick one:
       - Formspree: change <form ...> to
         <form ... action="https://formspree.io/f/XXXX" method="POST">
         and delete the JS submit handler in main.js.
       - Netlify Forms: add  name="inquiry" data-netlify="true"  to the <form>.
     Until then, the form validates and shows a confirmation toast only.

  4. HERO VIDEO. Now SELF-HOSTED at assets/hero.mp4 (index.html points at it),
     so the site no longer depends on the old WordPress host. The file is ~35 MB
     — it works, but before launch it's worth compressing for faster loads
     (e.g. HandBrake, or: ffmpeg -i hero.mp4 -vf scale=1280:-2 -c:v libx264
     -crf 28 -an hero-web.mp4). Replace assets/hero.mp4 with the smaller file
     and keep the same filename.
