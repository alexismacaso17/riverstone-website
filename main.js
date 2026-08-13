/* ============================================================
   The Riverstone Group — site interactions
   Plain vanilla JS. No dependencies except Lucide (icons).
   ============================================================ */
(function () {
  "use strict";

  /* ---- Lucide icons ------------------------------------------------- */
  if (window.lucide) window.lucide.createIcons();

  /* ---- Hero video: loop only the second scene ----------------------
     The footage opens with a brief first angle (~1.4s), then cuts to the
     preferred second scene. We start at the cut and loop back to it, so the
     opening scene never plays. Honours reduced-motion (pauses on the scene). */
  var heroVideo = document.querySelector(".rs-hero__video");
  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroVideo) {
    var HERO_IN = 1.4;
    heroVideo.loop = false;
    var seekToIn = function () { try { heroVideo.currentTime = HERO_IN; } catch (e) {} };
    if (heroVideo.readyState >= 1) seekToIn();
    heroVideo.addEventListener("loadedmetadata", seekToIn);
    heroVideo.addEventListener("timeupdate", function () {
      if (heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - 0.2) {
        heroVideo.currentTime = HERO_IN;
      }
    });
    heroVideo.addEventListener("ended", function () { seekToIn(); heroVideo.play(); });
    if (prefersReduced) { heroVideo.removeAttribute("autoplay"); seekToIn(); heroVideo.pause(); }
  }

  /* ---- Sticky header shadow on scroll ------------------------------ */
  var header = document.getElementById("header");
  var onScrollHeader = function () {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---- Reveal on scroll -------------------------------------------- */
  var reveals = document.querySelectorAll(".rs-reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Contact headline: compose the words once on entry ----------- */
  var statement = document.querySelector(".rs-contact__statement");
  if (statement) {
    if (prefersReduced) {
      statement.classList.add("is-composed");
    } else if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-composed"); cio.unobserve(en.target); }
        });
      }, { threshold: 0.3, rootMargin: "0px 0px -10% 0px" });
      cio.observe(statement);
    } else {
      statement.classList.add("is-composed");
    }
  }

  /* ---- Projects: reveal the rest on "See more" --------------------- */
  var projectsMoreBtn = document.getElementById("projectsMore");
  var projectsGrid = document.querySelector(".rs-projects__grid");
  if (projectsMoreBtn && projectsGrid) {
    projectsMoreBtn.addEventListener("click", function () {
      var expanded = projectsGrid.classList.toggle("is-expanded");
      projectsMoreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      projectsMoreBtn.textContent = expanded ? "See less" : "See more";
    });
  }

  /* ---- Scroll-spy: highlight the active nav link ------------------- */
  var sections = ["our-purpose", "our-projects", "contact"];
  var navLinks = document.querySelectorAll(".rs-header__nav-link[data-nav]");
  var onScrollSpy = function () {
    var y = window.scrollY + 140;
    var current = "";
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) current = id;
    });
    navLinks.forEach(function (link) {
      var target = link.getAttribute("href").replace("#", "");
      link.classList.toggle("is-active", target === current);
    });
  };
  window.addEventListener("scroll", onScrollSpy, { passive: true });
  onScrollSpy();

  /* ---- Mobile menu -------------------------------------------------- */
  var toggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  var scrim = document.getElementById("scrim");
  var setMenu = function (open) {
    mobileNav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (window.lucide) {
      toggle.innerHTML = '<i data-lucide="' + (open ? "x" : "menu") + '"></i>';
      window.lucide.createIcons();
    }
  };
  toggle.addEventListener("click", function () {
    setMenu(!mobileNav.classList.contains("is-open"));
  });
  scrim.addEventListener("click", function () { setMenu(false); });
  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileNav.classList.contains("is-open")) setMenu(false);
  });

  /* ---- Toast helper ------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  var showToast = function (msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 3600);
  };

  /* ---- Contact form -------------------------------------------------
     NOTE: A static site cannot email on its own. This handler validates
     and confirms client-side. To actually receive submissions, connect a
     form backend (Formspree, Netlify Forms, or your own endpoint) — see
     README.txt in this folder for the one-line change.
     ------------------------------------------------------------------ */
  var form = document.getElementById("inquiryForm");
  if (form) {
    var val = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ""; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = val("name");
      var email = val("email");
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name) { form.elements.name.focus(); showToast("Please add your name."); return; }
      if (!emailOk) { form.elements.email.focus(); showToast("Please enter a valid email address."); return; }

      var first = name.split(" ")[0];
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      var payload = {
        name: name, email: email,
        phone: val("phone"), method: val("method"), agent: val("agent"),
        message: val("message"), company: val("company") /* honeypot */
      };

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (data) {
          if (data && data.ok) {
            showToast("Thank you, " + first + " — we'll be in touch personally.");
            form.reset();
          } else {
            showToast((data && data.error) || "Something went wrong — please email us directly.");
          }
        })
        .catch(function () {
          // No endpoint (e.g. previewing the static files locally) or network error.
          showToast("Couldn't send just now — please email inquiries@theriverstonegroup.com.");
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label || "Begin the conversation"; }
        });
    });
  }
})();
