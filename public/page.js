/* DINO Mail — shared chrome for the static pages (about / privacy / terms / 404).
   Loaded synchronously from <head>: setting <html lang> before the body is
   parsed is what keeps Chinese readers from seeing an English flash. */
(function () {
  "use strict";

  var html = document.documentElement;

  try {
    if (localStorage.getItem("dino-lang") === "zh") html.lang = "zh-CN";
  } catch (e) {}

  function paintToggle() {
    var t = document.getElementById("langToggle");
    if (t) {
      var txt = t.querySelector(".lang-txt");
      if (txt) txt.textContent = html.lang === "zh-CN" ? "EN" : "中文";
      else t.textContent = html.lang === "zh-CN" ? "EN" : "中文";
    }

    var en = html.getAttribute("data-title-en");
    if (en) document.title = html.lang === "zh-CN" ? (html.getAttribute("data-title-zh") || en) : en;
  }

  // Highlights the table-of-contents entry for the heading you are reading.
  function tocSpy() {
    var links = [].slice.call(document.querySelectorAll(".doc-toc a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) byId[el.id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("active"); });
        var a = byId[en.target.id];
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-92px 0px -68% 0px" });

    Object.keys(byId).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function boot() {
    paintToggle();

    var toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var toZh = html.lang !== "zh-CN";
        html.lang = toZh ? "zh-CN" : "en";
        try { localStorage.setItem("dino-lang", toZh ? "zh" : "en"); } catch (e) {}
        paintToggle();
      });
    }

    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // Document pages ship with .scrolled already on; only the landing-style
    // pages need the scroll listener.
    var topbar = document.getElementById("topbar");
    if (topbar && !topbar.classList.contains("scrolled")) {
      var onScroll = function () { topbar.classList.toggle("scrolled", window.scrollY > 24); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    tocSpy();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
