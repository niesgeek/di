/* DINO Mail landing page — i18n + topbar state */
(function () {
  "use strict";

  var I18N_ZH = {
    "nav.features": "功能",
    "nav.spirit": "理念",
    "nav.about": "关于",
    "nav.signin": "登录",
    "hero.l1": "一封小小的<mark class=\"hl hl-sky\">信</mark>，",
    "hero.l2": "一个<mark class=\"hl hl-sunset\">很大</mark>的世界",
    "hero.sub": "有了一点性格的电子邮件。你在互联网上的小角落。",
    "hero.tagline": "<span class=\"tl-key\">D.I.</span> Direct Interface <span class=\"tl-sep\">·</span> <span class=\"tl-key\">F.S.</span> Fast Send —— di.fs.kg 的由来",
    "hero.cta1": "打开你的邮箱",
    "hero.cta2": "看看里面有什么",
    "feat.title": "小小的邮箱，大大的想法",
    "feat.sub": "只保留一个个人邮箱真正需要的东西。",
    "feat.c1.t": "属于你的信箱",
    "feat.c1.d": "你在 di.fs.kg 上的专属地址——一个安静的、属于你的地方，而不是广告网络的。",
    "feat.c2.t": "带一点性格",
    "feat.c2.d": "温暖、从容、有人情味。没有花哨弹窗，没有诱导设计——就像一只小恐龙寄出的信。",
    "feat.c3.t": "通往大世界",
    "feat.c3.d": "抵达地球上任何一个收件箱。跨越海洋与时区写信——一次一封小信。",
    "spirit.title": "从海边的悬崖，到你所处的任何地方",
    "spirit.p1": "在云与海岸线之间的某处，一只小恐龙坐在那里，身旁放着一包信——每一封都写得从容、寄得温柔，送给远方的人。",
    "spirit.p2": "我们认为电子邮件本该如此。不是信息流，不是负担。只是一封信、一枚邮票，以及信那头整个辽阔的世界。",
    "spirit.quote": "\u201c你在互联网上的小角落。\u201d",
    "join.title": "准备好收一封小信了吗？",
    "join.sub": "来和我们一起坐在悬崖上吧。今天海面很平静。",
    "join.cta": "在 di.fs.kg 认领你的地址",
    "foot.line": "一封小小的信，一个很大的世界 — di.fs.kg",
    "foot.tag": "D.I. Direct Interface · F.S. Fast Send",
    "foot.about": "关于我们",
    "foot.privacy": "隐私政策",
    "foot.terms": "服务条款",
    "foot.note": "© 2026 DINO Mail. 带着一点性格送达。"
  };

  var html = document.documentElement;
  var toggle = document.getElementById("langToggle");
  var nodes = document.querySelectorAll("[data-i18n]");
  var orig = {};
  nodes.forEach(function (n) { orig[n.getAttribute("data-i18n")] = n.innerHTML; });

  function apply(lang) {
    var zh = lang === "zh";
    nodes.forEach(function (n) {
      var k = n.getAttribute("data-i18n");
      if (zh && I18N_ZH[k]) n.innerHTML = I18N_ZH[k];
      else if (!zh && orig[k]) n.innerHTML = orig[k];
    });
    html.lang = zh ? "zh-CN" : "en";
    var langTxt = toggle.querySelector(".lang-txt");
    if (langTxt) langTxt.textContent = zh ? "EN" : "中文";
    else toggle.textContent = zh ? "EN" : "中文";
    try { localStorage.setItem("dino-lang", lang); } catch (e) {}
  }

  toggle.addEventListener("click", function () {
    apply(html.lang === "zh-CN" ? "en" : "zh");
  });

  var saved = null;
  try { saved = localStorage.getItem("dino-lang"); } catch (e) {}
  if (saved === "zh") apply("zh");

  // topbar frosted after scroll
  var topbar = document.getElementById("topbar");
  function onScroll() { topbar.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
