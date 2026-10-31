/* DINO Mail — app logic */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  // ============================================================
  // i18n
  // ============================================================
  var ZH = {
    "auth.sub": "一封小小的<mark class=\"hl hl-sky\">信</mark>，一个很大的世界。",
    "auth.point1": "在 di.fs.kg 拥有自己的地址 —— 永久免费",
    "auth.point2": "一个安静的邮箱，没有广告，没有算法",
    "auth.point3": "每一封信都带一点温度",
    "auth.signin": "登录",
    "auth.create": "创建地址",
    "auth.email": "邮箱名",
    "auth.password": "密码",
    "auth.signin2": "登录",
    "auth.pick": "选择你的名字",
    "auth.password2": "密码",
    "auth.pwhint": "（至少 8 个字符）",
    "auth.claim": "认领你的地址",
    "auth.invite": "邀请码",
    "auth.back": "← 返回首页",

    "nav.write": "写信",
    "nav.inbox": "收件箱",
    "nav.starred": "已加星标",
    "nav.sent": "已发送",
    "nav.drafts": "草稿箱",
    "nav.trash": "垃圾箱",
    "nav.contacts": "通讯录",
    "nav.alias": "别名",
    "nav.settings": "设置",
    "nav.admin": "管理",
    "nav.back": "返回",

    "empty.greet": "桌面很安静。挑一封信读读，<br>或者写点什么吧。",
    "kbd.write": "写信",
    "kbd.nav": "下一封 / 上一封",
    "kbd.open": "打开",
    "list.more": "加载更多",

    "contacts.note": "从你的往来邮件里自动收集，随时可以修改。",
    "contacts.add": "添加联系人",
    "contacts.save": "保存",

    "alias.title": "别名",
    "alias.add": "添加",

    "settings.title": "设置",
    "settings.note": "你的身份、签名和密码。",
    "settings.profile": "个人信息",
    "settings.name": "显示名称",
    "settings.sig": "邮件签名",
    "settings.save": "保存资料",
    "settings.pw": "修改密码",
    "settings.pwcur": "当前密码",
    "settings.pwnew": "新密码",
    "settings.pwconfirm": "再次输入新密码",
    "settings.pwsave": "更新密码",
    "settings.account": "账号",
    "settings.addr": "地址",
    "settings.quota": "附件",
    "settings.quotav": "每封最多 2 MB",
    "settings.about": "关于我们",
    "settings.privacy": "隐私政策",
    "settings.terms": "服务条款",

    "rules.title": "通知与转发",
    "rules.note": "新邮件可以抄送到别的邮箱，也可以推到 Telegram。",
    "rules.fwd": "转发新邮件",
    "rules.fwdsub": "每封新邮件抄送一份到下面这个地址，原件仍留在收件箱。",
    "rules.fwdto": "转发到",
    "rules.tg": "Telegram 通知",
    "rules.tgsub": "每收到一封新邮件，推一条简短消息。",
    "rules.tgchat": "Telegram Chat ID",
    "rules.tgnobot": "服务端还没配置 Telegram Bot Token，请联系管理员设置 TELEGRAM_BOT_TOKEN。",
    "rules.how": "怎么拿到 Chat ID？",
    "rules.h1": "找 @BotFather 建一个机器人，复制 token 交给站点管理员。",
    "rules.h2": "给这个机器人随便发一条消息；拉进群的话在群里发 /start。",
    "rules.h3": "打开 api.telegram.org/bot&lt;TOKEN&gt;/getUpdates，读里面的 chat.id，群组 ID 是负数。",
    "rules.test": "发送测试",
    "rules.save": "保存设置",
    "rules.saved": "已保存",
    "rules.testing": "正在发送测试…",
    "rules.okchan": "成功",
    "rules.nochan": "先填一个转发地址或 Chat ID，再点测试。",

    "admin.title": "邀请码",
    "admin.note": "新注册需要邀请码。未使用的邀请码可以撤销。",
    "admin.gen": "生成邀请码",
    "admin.users": "用户",
    "admin.usersnote": "所有邮箱账号。重置密码会让对方的所有登录失效，并生成一个临时密码。",

    "settings.data": "我的数据",
    "settings.datanote": "把邮件、联系人、别名打包成一个 JSON 文件下载。",
    "settings.export": "导出数据",
    "settings.danger": "危险区",
    "settings.delnote": "注销账号会删除所有邮件、联系人、别名和设置，无法恢复。",
    "settings.delbtn": "注销账号",
    "settings.pwhelp": "密码没有自助找回。忘了的话只能联系管理员重置，请把它记在稳妥的地方。",

    "bulk.read": "标记已读",
    "bulk.unread": "标记未读",
    "bulk.star": "加星标",
    "bulk.trash": "删除",
    "bulk.delete": "永久删除",

    "compose.cancel": "取消",
    "confirm.ok": "确认",
    "ph.setname": "别人看到的你的名字",
    "ph.setsig": "—— 会附在新邮件末尾",

    "compose.title": "新邮件",
    "compose.reply": "回复",
    "compose.replyall": "全部回复",
    "compose.forward": "转发",
    "compose.to": "收件人",
    "compose.cc": "抄送/密送",
    "compose.cc2": "抄送",
    "compose.bcc": "密送",
    "compose.subject": "主题",
    "compose.discard": "放弃",
    "compose.send": "发送",

    "ph.ctsearch": "搜索联系人…",
    "ph.ctname": "姓名",
    "ph.alias": "别名名称",
    "ph.you": "你的名字",
    "ph.to": "对方邮箱，如 someone@example.com",
    "ph.search": "搜索邮件…",
    "ph.subject": "（无主题）",
    "ph.body": "慢慢写。远方的人会读到的。"
  };

  var i18nNodes = document.querySelectorAll("[data-i18n]");
  var i18nTNodes = document.querySelectorAll("[data-i18n-t]");
  var i18nPh = document.querySelectorAll("[data-i18n-ph]");
  var origI18n = {}, origT = {}, origPh = {};
  i18nNodes.forEach(function (n) { origI18n[n.getAttribute("data-i18n")] = n.innerHTML; });
  i18nTNodes.forEach(function (n) { origT[n.getAttribute("data-i18n-t")] = n.textContent; });
  i18nPh.forEach(function (n) { origPh[n.getAttribute("data-i18n-ph")] = n.getAttribute("placeholder"); });

  function isZh() { return document.documentElement.lang === "zh-CN"; }
  function T(en, zh) { return isZh() ? zh : en; }

  function applyLang(lang) {
    var zh = lang === "zh";
    document.documentElement.lang = zh ? "zh-CN" : "en";
    i18nNodes.forEach(function (n) {
      var k = n.getAttribute("data-i18n");
      n.innerHTML = zh && ZH[k] ? ZH[k] : (origI18n[k] || n.innerHTML);
    });
    i18nTNodes.forEach(function (n) {
      var k = n.getAttribute("data-i18n-t");
      n.textContent = zh && ZH[k] ? ZH[k] : (origT[k] || n.textContent);
    });
    i18nPh.forEach(function (n) {
      var k = n.getAttribute("data-i18n-ph");
      n.setAttribute("placeholder", zh && ZH[k] ? ZH[k] : origPh[k]);
    });
    // 按钮里还有两面国旗 SVG（CSS 按 html[lang] 自动切换），只改文字部分
    var langTxt = $("langToggle").querySelector(".lang-txt");
    if (langTxt) langTxt.textContent = zh ? "EN" : "中文";
    else $("langToggle").textContent = zh ? "EN" : "中文";
    try { localStorage.setItem("dino-lang", lang); } catch (e) {}
    // 启动阶段（state 尚未赋值）只换文案，不碰依赖登录态的渲染。
    // 注意：var state 在这里还是 undefined，不能直接读 state.user。
    if (state && state.user) { refreshChrome(); renderList(); }
  }
  $("langToggle").addEventListener("click", function () { applyLang(isZh() ? "en" : "zh"); });
  (function () {
    var saved = null;
    try { saved = localStorage.getItem("dino-lang"); } catch (e) {}
    if (saved === "zh") applyLang("zh");
  })();

  // ============================================================
  // state
  // ============================================================
  var authView = $("authView"), mailView = $("mailView"), readCol = $("readCol"), listCol = $("listCol");

  var state = {
    user: null,
    view: "mail",              // mail | contacts | aliases | settings | admin | compose
    folder: "in",
    mails: [],
    nextBefore: null,
    q: "",
    counts: {},
    openId: null,
    openMailData: null,
    selected: {},
    contacts: [],
    aliases: [],
    editingContact: 0,
    compose: { id: 0, inReplyTo: 0, attachments: [], timer: null, dirty: false, sending: false }
  };

  // ============================================================
  // api
  // ============================================================
  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    if (opts.body && typeof opts.body !== "string") {
      opts.headers = { "content-type": "application/json" };
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.status === 401 && state.user) { showAuth(); }
        if (!r.ok) { var e = new Error(data.error || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return data;
      });
    });
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.hidden = true; }, 2800);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function debounce(fn, ms) {
    var t = null;
    return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }

  // ============================================================
  // 确认 / 提示弹窗（替代原生 confirm）
  // ============================================================
  function modalBox(msg, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var box = $("confirmBox");
      var ok = $("confirmOk"), cancel = $("confirmCancel");
      $("confirmMsg").textContent = msg;
      ok.textContent = opts.okText || T("Confirm", "确认");
      cancel.textContent = opts.cancelText || T("Cancel", "取消");
      cancel.hidden = !!opts.info;
      ok.className = "btn " + (opts.danger ? "btn-danger" : "btn-solid");
      box.hidden = false;
      (cancel.hidden ? ok : cancel).focus();
      function done(v) {
        box.hidden = true;
        document.removeEventListener("keydown", onKey);
        resolve(v);
      }
      ok.addEventListener("click", function h() { done(true); }, { once: true });
      cancel.addEventListener("click", function h() { done(false); }, { once: true });
      box.onclick = function (e) { if (e.target === box) done(false); };
      function onKey(e) { if (e.key === "Escape") { e.preventDefault(); done(false); } }
      document.addEventListener("keydown", onKey);
    });
  }
  function confirmBox(msg, opts) { return modalBox(msg, opts); }
  function infoBox(msg, okText) { return modalBox(msg, { info: true, okText: okText }); }

  // ============================================================
  // auth
  // ============================================================
  var tabLogin = $("tabLogin"), tabRegister = $("tabRegister");
  var loginForm = $("loginForm"), registerForm = $("registerForm");
  tabLogin.addEventListener("click", function () { setTab(true); });
  tabRegister.addEventListener("click", function () { setTab(false); });
  function setTab(login) {
    tabLogin.classList.toggle("active", login);
    tabRegister.classList.toggle("active", !login);
    loginForm.hidden = !login; registerForm.hidden = login;
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var local = loginForm.querySelector('[name="local"]').value.trim().toLowerCase();
    var domain = loginForm.querySelector('[name="domain"]').value;
    auth("/api/auth/login", { address: local + "@" + domain, password: loginForm.querySelector('[name="password"]').value }, $("loginErr"));
  });
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = {};
    new FormData(registerForm).forEach(function (v, k) { body[k] = v; });
    auth("/api/auth/register", body, $("registerErr"));
  });
  function auth(url, body, errEl) {
    errEl.hidden = true;
    api(url, { method: "POST", body: body })
      .then(function () { boot(); })
      .catch(function (e) { errEl.textContent = e.message; errEl.hidden = false; });
  }
  $("signoutBtn").addEventListener("click", function () {
    api("/api/auth/logout", { method: "POST" }).then(function () { location.reload(); });
  });

  // register live checks
  var localIn = registerForm.querySelector('[name="local"]');
  var domainIn = registerForm.querySelector('[name="domain"]');
  var hint = $("addrHint");
  var addrOk = false, checkTimer = null;

  document.querySelectorAll("form .domain-pick").forEach(function (group) {
    group.querySelectorAll(".dom-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        group.querySelectorAll(".dom-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        group.parentElement.querySelector('[name="domain"]').value = b.dataset.domain;
        group.closest("form").querySelectorAll(".pfx-suffix").forEach(function (s) { s.textContent = "@" + b.dataset.domain; });
        if (group.closest("form") === registerForm) queueCheck();
      });
    });
  });
  document.querySelectorAll(".pfx-wrap input").forEach(function (inp) {
    inp.addEventListener("input", function () {
      if (inp.value.indexOf("@") !== -1) {
        var pos = inp.selectionStart;
        inp.value = inp.value.split("@")[0];
        try { inp.setSelectionRange(Math.min(pos, inp.value.length), Math.min(pos, inp.value.length)); } catch (e) {}
      }
    });
  });
  function queueCheck() {
    clearTimeout(checkTimer);
    var v = localIn.value.trim().toLowerCase();
    if (!v) { hint.hidden = true; addrOk = false; return; }
    checkTimer = setTimeout(function () {
      fetch("/api/auth/check?local=" + encodeURIComponent(v) + "&domain=" + encodeURIComponent(domainIn.value))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          hint.hidden = false;
          hint.className = "addr-hint " + (d.ok ? "ok" : "bad");
          if (d.ok) { hint.textContent = v + "@" + domainIn.value + T(" is available ✓", " 可以使用 ✓"); addrOk = true; }
          else {
            hint.textContent = d.reason === "format"
              ? T("2-34 chars: letters, digits, dot, dash, underscore", "名称格式不对（2-34 位字母/数字/./-/_）")
              : d.message;
            addrOk = false;
          }
        })
        .catch(function () { hint.hidden = true; addrOk = false; });
    }, 350);
  }
  localIn.addEventListener("input", queueCheck);

  var ST_LABELS = { 0: "", 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong" };
  var ST_ZH = { 0: "", 1: "弱", 2: "一般", 3: "良好", 4: "强" };
  function pwScore(v) {
    if (!v) return 0;
    var s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(4, Math.max(1, Math.round(s * 0.8)));
  }
  var regPw = registerForm.querySelector('[name="password"]');
  var stBox = $("strength");
  regPw.addEventListener("input", function () {
    var s = pwScore(regPw.value);
    stBox.hidden = !regPw.value;
    stBox.className = "strength s" + s;
    $("stLabel").textContent = isZh() ? ST_ZH[s] : ST_LABELS[s];
  });
  document.querySelectorAll(".pw-eye").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.parentElement.querySelector("input");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.classList.toggle("showing", show);
    });
  });
  registerForm.addEventListener("submit", function (e) {
    if (!localIn.value.trim() || !addrOk) {
      e.preventDefault(); e.stopPropagation();
      queueCheck();
      var err = $("registerErr");
      err.textContent = T("Please pick an available address", "请选择一个可用的地址");
      err.hidden = false;
    }
  }, true);

  function showAuth() {
    authView.classList.remove("hidden");
    mailView.classList.add("hidden");
  }

  // ============================================================
  // boot
  // ============================================================
  boot();
  function boot() {
    api("/api/auth/me").then(function (d) {
      if (!d.user) { showAuth(); return; }
      state.user = d.user;
      state.counts = d.counts || {};
      showMail();
    }).catch(function () { showAuth(); });
  }

  function showMail() {
    authView.classList.add("hidden");
    mailView.classList.remove("hidden");
    $("meAddr").textContent = state.user.address;
    $("setAddr").textContent = state.user.address;
    $("setName").value = state.user.display_name || "";
    $("setSig").value = state.user.signature || "";
    document.querySelectorAll(".admin-only").forEach(function (el) {
      el.classList.toggle("hidden", !state.user.is_admin);
    });
    loadAliases().then(fillFromSelect);
    loadContacts("").then(fillDatalist).catch(function () {});
    loadFolder("in");
  }

  function refreshChrome() {
    if (!state.user) return;
    $("meAddr").textContent = state.user.address;
    renderCounts();
    $("listTitle").textContent = titleFor();
  }

  // ============================================================
  // pane switching
  // ============================================================
  var PANES = { read: "readPane", contacts: "contactsPane", aliases: "aliasPane", settings: "settingsPane", admin: "adminPane", compose: "composePane" };
  function showPane(name) {
    Object.keys(PANES).forEach(function (k) {
      $(PANES[k]).classList.toggle("hidden", k !== name);
    });
    if (name === "read" || name === "compose") {
      // keep the read column as-is
    }
  }
  function openMobilePane() {
    if (window.innerWidth <= 980) {
      readCol.classList.add("open");
      listCol.classList.add("hide-on-open");
    }
  }
  function closeMobilePane() {
    readCol.classList.remove("open");
    listCol.classList.remove("hide-on-open");
  }
  $("mobileBack").addEventListener("click", closeMobilePane);

  // ============================================================
  // navigation
  // ============================================================
  var navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(function (btn) {
    btn.addEventListener("click", function () {
      flushDraft();
      navItems.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      if (btn.dataset.view) {
        state.view = btn.dataset.view;
        closeMobilePane();
        if (state.view === "contacts") showContacts();
        else if (state.view === "aliases") showAliases();
        else if (state.view === "settings") showSettings();
        else if (state.view === "admin") showAdmin();
      } else {
        state.view = "mail";
        closeMobilePane();
        loadFolder(btn.dataset.folder);
      }
    });
  });

  function titleFor() {
    if (state.view === "contacts") return T("Contacts", "通讯录");
    if (state.view === "aliases") return T("Aliases", "别名");
    if (state.view === "settings") return T("Settings", "设置");
    if (state.view === "admin") return T("Admin", "管理");
    if (state.view === "compose") return T("New message", "新邮件");
    return {
      in: T("Inbox", "收件箱"),
      out: T("Sent", "已发送"),
      drafts: T("Drafts", "草稿箱"),
      starred: T("Starred", "已加星标"),
      trash: T("Trash", "垃圾箱")
    }[state.folder] || T("Inbox", "收件箱");
  }

  $("refreshBtn").addEventListener("click", function () {
    if (state.view === "mail") loadFolder(state.folder);
    else if (state.view === "contacts") showContacts();
    else if (state.view === "aliases") showAliases();
    else if (state.view === "admin") showAdmin();
    refreshCounts();
  });

  // ============================================================
  // counts
  // ============================================================
  function renderCounts() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var v = state.counts[el.dataset.count] || 0;
      el.hidden = !v;
      el.textContent = v > 99 ? "99+" : v;
    });
  }
  function refreshCounts() {
    if (!state.user) return Promise.resolve();
    return api("/api/mail/counts").then(function (d) {
      state.counts = d.counts || {};
      renderCounts();
    }).catch(function () {});
  }

  // ============================================================
  // list
  // ============================================================
  function loadFolder(folder, opts) {
    opts = opts || {};
    state.folder = folder;
    state.view = "mail";
    state.q = "";
    state.selected = {};
    state.openId = null;
    $("searchInput").value = "";
    $("searchClear").hidden = true;
    $("listTitle").textContent = titleFor();
    showPane("read");
    resetReadPane();
    closeMobilePane();
    renderBulkBar();
    return fetchPage(null, opts.append);
  }

  function fetchPage(before, append) {
    var qs = "folder=" + encodeURIComponent(state.folder) + "&limit=50";
    if (state.q) qs += "&q=" + encodeURIComponent(state.q);
    if (before) qs += "&before=" + encodeURIComponent(before);
    var list = $("mailList");
    if (!append) list.classList.add("loading");
    $("refreshBtn").classList.add("spinning");
    return api("/api/mail?" + qs).then(function (d) {
      state.mails = append ? state.mails.concat(d.mails || []) : (d.mails || []);
      state.nextBefore = d.nextBefore;
      state.counts = d.counts || state.counts;
      renderCounts();
      renderList();
    }).catch(function (e) { toast(e.message); }).then(function () {
      list.classList.remove("loading");
      $("refreshBtn").classList.remove("spinning");
    });
  }

  var searchDebounced = debounce(function () {
    state.q = $("searchInput").value.trim();
    $("searchClear").hidden = !state.q;
    fetchPage(null, false);
  }, 300);
  $("searchInput").addEventListener("input", searchDebounced);
  $("searchClear").addEventListener("click", function () {
    $("searchInput").value = ""; state.q = ""; $("searchClear").hidden = true; fetchPage(null, false);
    $("searchInput").setAttribute("readonly", ""); // 清空即重新上膛（blur 先于 click，这里补一刀）
  });

  // 搜索框只读进场：浏览器不会往 readonly 字段里自动填充保存的用户名，
  // 点进去 / 聚焦时才解锁；失焦且为空时重新上膛。
  ["searchInput", "ctSearch"].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    var unlock = function () { el.removeAttribute("readonly"); };
    el.addEventListener("pointerdown", unlock);
    el.addEventListener("focus", unlock);
    el.addEventListener("blur", function () { if (!el.value) el.setAttribute("readonly", ""); });
  });
  $("loadMoreBtn").addEventListener("click", function () {
    if (state.nextBefore) fetchPage(state.nextBefore, true);
  });

  function dayKey(ts) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    if (ts >= today) return "today";
    if (ts >= today - 86400) return "yesterday";
    if (ts >= today - 7 * 86400) return "week";
    return "older";
  }
  var DAY_LABELS = {
    en: { today: "Today", yesterday: "Yesterday", week: "This week", older: "Earlier" },
    zh: { today: "今天", yesterday: "昨天", week: "本周", older: "更早" }
  };
  function LOC() { return isZh() ? "zh-CN" : "en-US"; }
  function fmtTime(ts) {
    return new Date(ts * 1000).toLocaleTimeString(LOC(), { hour: "2-digit", minute: "2-digit" });
  }
  function fmtShort(ts) {
    var d = new Date(ts * 1000), now = new Date();
    if (d.getFullYear() !== now.getFullYear())
      return d.toLocaleDateString(LOC(), { year: "2-digit", month: "numeric", day: "numeric" });
    return d.toLocaleDateString(LOC(), { month: "short", day: "numeric" });
  }
  function fmtFull(ts) {
    return new Date(ts * 1000).toLocaleString(LOC(), {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }
  var AVA_COLORS = ["#7FB98A", "#8FBCD4", "#D4A76F", "#C48BB0", "#9AA5CE", "#B5CC7E", "#D48B8B", "#7EC4B8"];
  function avaColor(addr) {
    var s = String(addr || "?"), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVA_COLORS[h % AVA_COLORS.length];
  }
  function initial(name) {
    var s = String(name || "?").trim();
    return (s.replace(/@.*/, "").charAt(0) || "?").toUpperCase();
  }
  function fmtSize(n) {
    if (!n) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  function renderList() {
    var list = $("mailList");
    var lang = isZh() ? "zh" : "en";
    var mails = state.mails;

    if (!mails.length) {
      var msg;
      if (state.q) msg = T("No matching mail", "没有找到匹配的邮件");
      else if (state.folder === "in") msg = T("No mail yet. Share your address — ", "还没有收到信。把地址分享出去吧 —— ") + state.user.address;
      else if (state.folder === "out") msg = T("Nothing sent yet.", "还没有发过信。");
      else if (state.folder === "drafts") msg = T("No drafts. A clean desk.", "没有草稿。桌面很干净。");
      else if (state.folder === "starred") msg = T("No starred mail yet.", "还没有加星标的邮件。");
      else msg = T("Trash is empty.", "垃圾箱是空的。");
      list.innerHTML = '<div class="list-empty"><img src="img/dino-nap.webp" alt="" class="le-mark"><p class="le-title">' + esc(msg) + "</p></div>";
      $("listFoot").hidden = true;
      return;
    }

    var html = "", lastKey = null;
    mails.forEach(function (m) {
      var outbound = m.folder === "out" || m.folder === "draft";
      var who = outbound ? (m.to_name || m.to_addr || T("(no recipient)", "(无收件人)")) : (m.from_name || m.from_addr);
      var k = state.q ? "flat" : dayKey(m.created_at);
      if (k !== lastKey) {
        lastKey = k;
        if (k !== "flat") html += '<div class="day-sep"><span>' + DAY_LABELS[lang][k] + "</span></div>";
      }
      var unread = m.folder === "in" && !m.read;
      var time = (k === "today" || k === "flat") ? fmtTime(m.created_at) : fmtShort(m.created_at);
      var sel = !!state.selected[m.id];
      var badges = "";
      if (m.thread_count > 1) badges += '<span class="mi-thread">' + m.thread_count + "</span>";
      if (m.has_attach) badges += '<span class="mi-att" aria-label="attachment">' + clipSvg + "</span>";

      html += '<div class="mail-item' + (unread ? " unread" : "") + (m.id === state.openId ? " active" : "") + (sel ? " sel" : "") + '" data-id="' + m.id + '" tabindex="0" role="button">' +
        '<label class="mi-check-wrap" title="' + esc(T("Select", "选择")) + '"><input type="checkbox" class="mi-check" data-id="' + m.id + '"' + (sel ? " checked" : "") + "></label>" +
        '<span class="mi-ava" style="background:' + avaColor(who) + '">' + esc(initial(who)) + "</span>" +
        '<span class="mi-main">' +
          '<span class="mi-top"><span class="mi-from">' + esc(who) + '</span><span class="mi-date">' + time + "</span></span>" +
          '<span class="mi-line">' +
            (m.folder === "draft" ? '<span class="mi-draft">' + T("Draft", "草稿") + "</span>" : "") +
            '<span class="mi-sub' + (m.subject ? "" : " empty") + '">' + esc(m.subject || T("(no subject)", "（无主题）")) + "</span>" +
            (badges ? '<span class="mi-badges">' + badges + "</span>" : "") +
          "</span>" +
          (m.snippet ? '<span class="mi-prev">' + esc(m.snippet) + "</span>" : "") +
        "</span>" +
        '<button class="mi-star' + (m.starred ? " on" : "") + '" type="button" data-star="' + m.id + '" title="' + esc(T("Star", "星标")) + '" tabindex="-1">' + starSvg + "</button>" +
      "</div>";
    });

    list.innerHTML = html;
    $("listFoot").hidden = !state.nextBefore;

    list.querySelectorAll(".mail-item").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest(".mi-check-wrap") || e.target.closest(".mi-star")) return;
        openById(+el.dataset.id);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openById(+el.dataset.id); }
      });
    });
    list.querySelectorAll(".mi-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (cb.checked) state.selected[+cb.dataset.id] = true;
        else delete state.selected[+cb.dataset.id];
        cb.closest(".mail-item").classList.toggle("sel", cb.checked);
        renderBulkBar();
      });
    });
    list.querySelectorAll(".mi-star").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleStar(+b.dataset.star, b);
      });
    });
    renderBulkBar();
  }

  var starSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" stroke-linejoin="round"/></svg>';
  var clipSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 11.5 12.3 19a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.2l7.2-7.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function selectedIds() { return Object.keys(state.selected).map(Number); }

  function renderBulkBar() {
    var ids = selectedIds();
    var bar = $("bulkBar");
    bar.hidden = ids.length === 0;
    if (!ids.length) return;
    $("bulkN").textContent = ids.length + T(" selected", " 封已选");
    var isTrash = state.folder === "trash";
    var isDrafts = state.folder === "drafts";
    var btns;
    if (isTrash) btns = [["restore", T("Restore", "恢复"), ""], ["delete", T("Delete forever", "永久删除"), "danger"]];
    else if (isDrafts) btns = [["delete", T("Discard", "丢弃"), "danger"]];
    else btns = [
      ["read", T("Read", "标记已读"), ""],
      ["unread", T("Unread", "标记未读"), ""],
      ["star", T("Star", "加星标"), ""],
      ["trash", T("Trash", "删除"), ""],
      ["delete", T("Delete forever", "永久删除"), "danger"]
    ];
    bar.querySelector(".bulk-actions").innerHTML = btns.map(function (b) {
      return '<button type="button" data-act="' + b[0] + '" class="' + b[2] + '">' + esc(b[1]) + "</button>";
    }).join("");
    bar.querySelector(".bulk-actions").querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () { bulkAction(btn.dataset.act); });
    });
    var allOn = state.mails.length > 0 && state.mails.every(function (m) { return state.selected[m.id]; });
    $("selectAll").checked = allOn;
  }

  $("selectAll").addEventListener("change", function () {
    var on = $("selectAll").checked;
    state.selected = {};
    if (on) state.mails.forEach(function (m) { state.selected[m.id] = true; });
    renderList(); renderBulkBar();
  });

  function bulkAction(action) {
    var ids = selectedIds();
    if (!ids.length) return;
    var run = function () {
      api("/api/mail/action", { method: "POST", body: { ids: ids, action: action } }).then(function (d) {
        state.counts = d.counts || state.counts;
        renderCounts();
        state.selected = {};
        toast({
          read: T("Marked as read", "已标记为已读"),
          unread: T("Marked as unread", "已标记为未读"),
          star: T("Starred", "已加星标"),
          unstar: T("Unstarred", "已取消星标"),
          trash: T("Moved to trash", "已移入垃圾箱"),
          restore: T("Restored", "已恢复"),
          delete: T("Deleted", "已删除")
        }[action] || T("Done", "完成"));
        fetchPage(null, false);
      }).catch(function (e) { toast(e.message); });
    };
    if (action === "delete") {
      confirmBox(T("Delete " + ids.length + " message(s) forever?", "永久删除 " + ids.length + " 封邮件？"),
        { danger: true, okText: T("Delete forever", "永久删除") })
        .then(function (ok) { if (ok) run(); });
    } else run();
  }

  $("markAllBtn").addEventListener("click", function () {
    var ids = state.mails.filter(function (m) { return m.folder === "in" && !m.read; }).map(function (m) { return m.id; });
    if (!ids.length) return toast(T("Nothing unread here", "这里没有未读邮件"));
    api("/api/mail/action", { method: "POST", body: { ids: ids, action: "read" } }).then(function (d) {
      state.counts = d.counts || state.counts; renderCounts(); fetchPage(null, false);
    }).catch(function (e) { toast(e.message); });
  });

  function toggleStar(id, btn) {
    var rec = state.mails.filter(function (x) { return x.id === id; })[0];
    var next = rec && rec.starred ? "unstar" : "star";
    api("/api/mail/action", { method: "POST", body: { ids: [id], action: next } }).then(function (d) {
      if (rec) rec.starred = next === "star" ? 1 : 0;
      if (btn) btn.classList.toggle("on", next === "star");
      state.counts = d.counts || state.counts;
      renderCounts();
      if (state.folder === "starred") fetchPage(null, false);
    }).catch(function (e) { toast(e.message); });
  }

  // ============================================================
  // open message
  // ============================================================
  function openById(id) {
    var rec = state.mails.filter(function (x) { return x.id === id; })[0];
    if (rec && rec.folder === "draft") return openDraft(id);
    openMail(id);
  }

  function openMail(id) {
    state.openId = id;
    api("/api/mail/detail?id=" + id).then(function (d) {
      var m = d.mail;
      state.openMailData = m;
      state.thread = d.thread || [];
      if (d.counts) { state.counts = d.counts; renderCounts(); }
      var rec = state.mails.filter(function (x) { return x.id === id; })[0];
      if (rec && !rec.read && m.folder === "in") { rec.read = 1; renderList(); }

      showPane("read");
      renderMessage(m, d.attachments || []);
      openMobilePane();
      document.querySelectorAll(".mail-item").forEach(function (el) {
        el.classList.toggle("active", +el.dataset.id === id);
      });
    }).catch(function (e) { toast(e.message); });
  }

  function renderMessage(m, attachments) {
    var outbound = m.folder === "out" || m.folder === "draft";
    var pane = $("readPane");
    var who = outbound ? m.to_addr : m.from_addr;
    var whoLabel = outbound ? (m.to_name || m.to_addr) : (m.from_name || m.from_addr);
    var addrLine = outbound ? m.to_addr : m.from_addr;

    var attHtml = "";
    if (attachments && attachments.length) {
      attHtml = '<div class="rm-atts"><div class="rm-atts-head">' + attachments.length + T(" attachment(s)", " 个附件") + "</div>" +
        attachments.map(function (a) {
          var inner = clipSvg + '<span class="att-name">' + esc(a.filename) + '</span><span class="att-size">' + fmtSize(a.size) + "</span>";
          if (a.url) return '<a class="att-chip" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>";
          if (a.stored) return '<button type="button" class="att-chip att-dl" data-id="' + a.id + '" data-name="' + esc(a.filename) + '">' + inner + "</button>";
          return '<span class="att-chip dim" title="' + esc(T("Content not kept", "内容没有保存下来")) + '">' + inner + "</span>";
        }).join("") + "</div>";
    }

    var threadHtml = "";
    if (state.thread.length) {
      threadHtml = '<div class="rm-thread"><div class="rm-thread-head">' + T("Earlier in this conversation", "本会话中的其他邮件") + "</div>" +
        state.thread.map(function (t) {
          return '<button class="th-item" type="button" data-id="' + t.id + '">' +
            '<span class="th-from">' + esc(t.from_name || t.from_addr) + "</span>" +
            '<span class="th-sub">' + esc(t.subject || T("(no subject)", "（无主题）")) + "</span>" +
            '<span class="th-date">' + esc(fmtShort(t.created_at)) + "</span></button>";
        }).join("") + "</div>";
    }

    pane.innerHTML =
      '<article class="read-msg">' +
        '<div class="rm-head">' +
          '<span class="rm-ava" style="background:' + avaColor(who) + '">' + esc(initial(who)) + "</span>" +
          '<div class="rm-headmain">' +
            '<h2 class="rm-sub">' + esc(m.subject || T("(no subject)", "（无主题）")) + "</h2>" +
            '<div class="rm-meta">' +
              '<span class="rm-from">' + esc(whoLabel) + "</span>" +
              (addrLine && addrLine !== whoLabel ? '<span class="rm-addr">&lt;' + esc(addrLine) + "&gt;</span>" : "") +
              '<span class="rm-date">' + esc(fmtFull(m.created_at)) + "</span>" +
            "</div>" +
            (m.cc_addr ? '<div class="rm-cc">Cc: ' + esc(m.cc_addr) + "</div>" : "") +
            (m.folder === "in" && m.to_addr && m.to_addr.indexOf(state.user.address) === -1
              ? '<div class="rm-cc">' + T("Delivered to", "投递至") + ": " + esc(m.to_addr) + "</div>" : "") +
          "</div>" +
          '<button class="mi-star rm-star' + (m.starred ? " on" : "") + '" type="button" data-star="' + m.id + '" title="' + esc(T("Star", "星标")) + '">' + starSvg + "</button>" +
        "</div>" +

        '<div class="rm-toolbar">' +
          (m.folder !== "draft"
            ? '<button class="rm-btn rm-reply" type="button">' + T("Reply", "回复") + "</button>" +
              '<button class="rm-btn rm-replyall" type="button">' + T("Reply all", "全部回复") + "</button>" +
              '<button class="rm-btn rm-forward" type="button">' + T("Forward", "转发") + "</button>"
            : '<button class="rm-btn rm-edit" type="button">' + T("Continue writing", "继续编辑") + "</button>") +
          '<span class="rm-spacer"></span>' +
          '<button class="rm-btn rm-del" type="button">' + (m.trashed_at ? T("Delete forever", "永久删除") : T("Trash", "删除")) + "</button>" +
        "</div>" +

        '<div class="rm-body ' + (m.html_body ? "html" : "text") + '">' +
          (m.html_body ? sanitize(m.html_body) : esc(m.text_body || "")) +
        "</div>" +
        attHtml +
        threadHtml +
      "</article>";

    var st = pane.querySelector(".rm-star");
    if (st) st.addEventListener("click", function () { toggleStar(m.id, st); });

    var reply = pane.querySelector(".rm-reply");
    if (reply) reply.addEventListener("click", function () { replyTo(m, false); });
    var replyAll = pane.querySelector(".rm-replyall");
    if (replyAll) replyAll.addEventListener("click", function () { replyTo(m, true); });
    var fwd = pane.querySelector(".rm-forward");
    if (fwd) fwd.addEventListener("click", function () { forward(m); });
    var editBtn = pane.querySelector(".rm-edit");
    if (editBtn) editBtn.addEventListener("click", function () { openDraft(m.id); });

    pane.querySelector(".rm-del").addEventListener("click", function () {
      var hard = !!m.trashed_at;
      var run = function () {
        api("/api/mail/detail?id=" + m.id + (hard ? "&hard=1" : ""), { method: "DELETE" }).then(function (d) {
          if (d.counts) { state.counts = d.counts; renderCounts(); }
          resetReadPane();
          closeMobilePane();
          fetchPage(null, false);
          toast(hard ? T("Deleted", "已删除") : T("Moved to trash", "已移入垃圾箱"));
        }).catch(function (e) { toast(e.message); });
      };
      if (hard) {
        confirmBox(T("Delete this message forever?", "永久删除这封邮件？"), { danger: true, okText: T("Delete forever", "永久删除") })
          .then(function (ok) { if (ok) run(); });
      } else run();
    });

    pane.querySelectorAll(".th-item").forEach(function (b) {
      b.addEventListener("click", function () { openMail(+b.dataset.id); });
    });

    pane.querySelectorAll(".att-dl").forEach(function (b) {
      b.addEventListener("click", function () { downloadAttachment(+b.dataset.id, b.dataset.name); });
    });
    // 占位块 → 真图（用户点了「显示图片」才加载远程图片）
    pane.querySelectorAll(".img-holder").forEach(function (h) {
      h.querySelector(".ih-load").addEventListener("click", function () {
        var img = document.createElement("img");
        img.src = h.dataset.src;
        img.alt = h.querySelector(".ih-label").textContent;
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        h.replaceWith(img);
      });
    });
  }

  // 从本站接口下载存过内容的附件（外链附件直接走 <a href>）
  function downloadAttachment(id, name) {
    fetch("/api/mail/attachment?id=" + id, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(r.status === 404
        ? T("The attachment content was not kept", "附件内容没有保存下来")
        : "HTTP " + r.status);
      return r.blob();
    }).then(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }).catch(function (e) { toast(e.message); });
  }

  // 回信时用哪个身份？收件（to_addr）里出现的自己的地址优先——
  // 用别名注册的服务，回信就该从那个别名发，而不是主地址。
  function pickFrom(m) {
    var me = state.user.address;
    if (m.folder !== "in") return me;
    var targets = String(m.to_addr || "").toLowerCase();
    if (!targets) return me;
    if (targets.indexOf(me.toLowerCase()) !== -1) return me;
    for (var i = 0; i < state.aliases.length; i++) {
      if (targets.indexOf(String(state.aliases[i].address).toLowerCase()) !== -1) return state.aliases[i].address;
    }
    return me;
  }

  function replyTo(m, all) {
    var me = state.user.address;
    var to = m.folder === "out" ? m.to_addr : m.from_addr;
    var cc = "";
    if (all) {
      var pool = []
        .concat((m.to_addr || "").split(","), (m.cc_addr || "").split(","))
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s && s !== me && s !== to && s.indexOf("@") !== -1; });
      cc = pool.join(", ");
    }
    var quoted = (m.text_body || "").split("\n").map(function (l) { return "> " + l; }).join("\n");
    var head = T("On " + fmtFull(m.created_at) + ", " + (m.from_name || m.from_addr) + " wrote:", "在 " + fmtFull(m.created_at) + "，" + (m.from_name || m.from_addr) + " 写道：");
    var subject = /^re:/i.test(m.subject || "") ? m.subject : "Re: " + (m.subject || "");
    openCompose({
      to: to, cc: cc, subject: subject, from: pickFrom(m),
      text: "\n\n" + head + "\n" + quoted + "\n",
      inReplyTo: m.id, focus: "text"
    });
  }

  function forward(m) {
    var subject = /^fwd:/i.test(m.subject || "") ? m.subject : "Fwd: " + (m.subject || "");
    var block = [
      "",
      "",
      "---------- " + T("Forwarded message", "转发的邮件") + " ----------",
      T("From: ", "发件人：") + (m.from_name || m.from_addr),
      T("Date: ", "日期：") + fmtFull(m.created_at),
      T("Subject: ", "主题：") + (m.subject || ""),
      T("To: ", "收件人：") + (m.to_addr || ""),
      "",
      m.text_body || ""
    ].join("\n");
    openCompose({ to: "", cc: "", subject: subject, from: pickFrom(m), text: block, focus: "to" });
  }

  function resetReadPane() {
    state.openId = null;
    state.openMailData = null;
    state.thread = [];
    $("readPane").innerHTML =
      '<div class="read-empty"><img src="img/dino-nap.webp" alt="" class="read-empty-mark">' +
      '<p class="re-greet">' + T("Your desk is quiet. Pick a letter to read,<br>or write something new.",
        "桌面很安静。挑一封信读读，<br>或者写点什么吧。") + "</p>" +
      '<div class="kbd-hints"><span><kbd>C</kbd> <em>' + T("write", "写信") + "</em></span>" +
      "<span><kbd>J</kbd><kbd>K</kbd> <em>" + T("next / previous", "下一封 / 上一封") + "</em></span>" +
      "<span><kbd>R</kbd> <em>" + T("reply", "回复") + "</em></span></div></div>";
  }

  // sanitizer for inbound HTML
  function sanitize(html) {
    var t = document.createElement("template");
    t.innerHTML = html;
    t.content.querySelectorAll("script,style,iframe,object,embed,form,link,meta,base,noscript,svg").forEach(function (n) { n.remove(); });
    t.content.querySelectorAll("*").forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var an = a.name.toLowerCase(), av = String(a.value || "");
        if (an.indexOf("on") === 0) return n.removeAttribute(a.name);
        if ((an === "href" || an === "src") && /^\s*(javascript|data:text\/html|vbscript):/i.test(av)) return n.removeAttribute(a.name);
        if (an === "srcset") return n.removeAttribute(a.name);
        // 内联样式里的 url() 一律去掉：background:url(https://…) 同样是跟踪像素的入口
        if (an === "style" && /expression|url\s*\(|javascript/i.test(av)) return n.removeAttribute(a.name);
        if (an === "class" || an === "id") return n.removeAttribute(a.name);
      });
      if (n.tagName === "A") {
        n.setAttribute("target", "_blank");
        n.setAttribute("rel", "noopener noreferrer nofollow");
      }
      if (n.tagName === "IMG") {
        var src = n.getAttribute("src") || "";
        if (/^https?:/i.test(src)) {
          // 远程图片默认不加载：一打开邮件就向发件方暴露 IP 和阅读时间，太亏了。
          // 换成占位块，想看的人点一下再加载。
          var hold = document.createElement("span");
          hold.className = "img-holder";
          hold.dataset.src = src;
          var label = (n.getAttribute("alt") || T("remote image", "远程图片")).slice(0, 60);
          hold.innerHTML = '<span class="ih-dot"></span><span class="ih-label"></span>' +
            '<button type="button" class="ih-load">' + T("Show image", "显示图片") + "</button>";
          hold.querySelector(".ih-label").textContent = label;
          n.replaceWith(hold);
          return;
        }
        n.setAttribute("loading", "lazy");
        n.setAttribute("referrerpolicy", "no-referrer");
      }
    });
    return t.innerHTML;
  }

  // ============================================================
  // compose
  // ============================================================
  var composePane = $("composePane");
  var cpTo = $("cpTo"), cpCc = $("cpCc"), cpBcc = $("cpBcc"), cpSubject = $("cpSubject"), cpText = $("cpText");

  $("composeBtn").addEventListener("click", function () { openCompose({}); });
  $("composeClose").addEventListener("click", function () { closeCompose(true); });
  $("composeCancel").addEventListener("click", function () { discardCompose(); });
  $("cpCcToggle").addEventListener("click", function () {
    var hidden = $("cpCcRow").hidden;
    $("cpCcRow").hidden = !hidden;
    $("cpBccRow").hidden = !hidden;
    if (hidden) cpCc.focus();
  });

  function openCompose(opts) {
    opts = opts || {};
    state.view = "compose";
    state.compose = { id: opts.draftId || 0, inReplyTo: opts.inReplyTo || 0, attachments: [], timer: null, dirty: false, sending: false };
    $("cpTitle").textContent = opts.draftId ? T("Draft", "草稿") : (opts.inReplyTo ? T("Reply", "回复") : T("New message", "新邮件"));
    $("composeErr").hidden = true;
    $("cpSaveState").textContent = "";
    cpTo.value = opts.to || "";
    cpCc.value = opts.cc || "";
    cpBcc.value = opts.bcc || "";
    cpSubject.value = opts.subject || "";
    cpText.value = opts.text || "";
    $("cpCcRow").hidden = !opts.cc;
    $("cpBccRow").hidden = !opts.bcc;

    if (!opts.text && !opts.inReplyTo && state.user.signature) {
      cpText.value = "\n\n" + state.user.signature;
    }

    fillFromSelect(opts.from);
    renderAttachList();
    showPane("compose");
    openMobilePane();
    var target = opts.focus === "text" ? cpText : (opts.focus === "to" ? cpTo : (opts.to ? cpSubject : cpTo));
    setTimeout(function () { target.focus(); }, 60);
  }

  function composeHasContent() {
    return !!(cpTo.value.trim() || cpCc.value.trim() || cpBcc.value.trim() || cpSubject.value.trim() || cpText.value.trim() || state.compose.attachments.length);
  }

  // quietly persist an in-progress message before navigating away
  function flushDraft() {
    if ($("composePane").classList.contains("hidden")) return;
    if (!state.compose.sending && composeHasContent()) saveDraftNow();
  }

  function closeCompose(saveDraft) {
    if (state.compose.sending) return;
    if (saveDraft && composeHasContent()) {
      saveDraftNow().then(function () {
        toast(T("Draft saved", "草稿已保存"));
        state.view = "mail";
        showPane("read");
        closeMobilePane();
        resetReadPane();
        refreshCounts();
      });
      return;
    }
    state.view = "mail";
    showPane("read");
    closeMobilePane();
    resetReadPane();
  }

  function discardCompose() {
    var id = state.compose.id;
    var done = function () {
      state.compose = { id: 0, inReplyTo: 0, attachments: [], timer: null, dirty: false, sending: false };
      state.view = "mail";
      showPane("read");
      closeMobilePane();
      resetReadPane();
      refreshCounts();
      toast(T("Discarded", "已放弃"));
    };
    var proceed = function () {
      if (id) api("/api/mail/draft?id=" + id, { method: "DELETE" }).then(done).catch(done);
      else done();
    };
    if (composeHasContent()) {
      confirmBox(T("Discard this message?", "放弃这封邮件？"), { danger: true, okText: T("Discard", "放弃") })
        .then(function (ok) { if (ok) proceed(); });
    } else proceed();
  }

  function markDirty() {
    state.compose.dirty = true;
    $("cpSaveState").textContent = T("Saving…", "保存中…");
    clearTimeout(state.compose.timer);
    state.compose.timer = setTimeout(function () { saveDraftNow(); }, 1600);
  }
  [cpTo, cpCc, cpBcc, cpSubject, cpText].forEach(function (el) {
    el.addEventListener("input", markDirty);
  });

  function draftPayload() {
    return {
      id: state.compose.id || 0,
      to: cpTo.value, cc: cpCc.value, bcc: cpBcc.value,
      subject: cpSubject.value, text: cpText.value,
      from: $("composeFrom").value,
      inReplyTo: state.compose.inReplyTo || 0,
      attachments: state.compose.attachments.map(function (a) {
        return { filename: a.filename, contentType: a.contentType, content: a.content };
      })
    };
  }

  function saveDraftNow() {
    if (state.compose.sending) return Promise.resolve();
    if (!composeHasContent()) {
      $("cpSaveState").textContent = "";
      return Promise.resolve();
    }
    return api("/api/mail/draft", { method: "POST", body: draftPayload() }).then(function (d) {
      if (d.id) state.compose.id = d.id;
      state.compose.dirty = false;
      $("cpSaveState").textContent = T("Saved", "已保存");
      if (d.id) refreshCounts();
    }).catch(function (e) {
      $("cpSaveState").textContent = T("Not saved", "未保存");
    });
  }

  $("composeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.compose.sending) return;
    var errEl = $("composeErr");
    errEl.hidden = true;
    if (!cpTo.value.trim()) { errEl.textContent = T("Add at least one recipient", "请填写收件人"); errEl.hidden = false; cpTo.focus(); return; }
    if (!cpText.value.trim()) { errEl.textContent = T("Message body is empty", "正文不能为空"); errEl.hidden = false; cpText.focus(); return; }

    state.compose.sending = true;
    var btn = $("cpSendBtn");
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = T("Sending…", "发送中…");
    clearTimeout(state.compose.timer);

    api("/api/mail/send", {
      method: "POST",
      body: {
        to: cpTo.value, cc: cpCc.value, bcc: cpBcc.value,
        subject: cpSubject.value, text: cpText.value,
        from: $("composeFrom").value,
        inReplyTo: state.compose.inReplyTo || 0,
        draftId: state.compose.id || 0,
        attachments: state.compose.attachments.map(function (a) {
          return { filename: a.filename, contentType: a.contentType, content: a.content };
        })
      }
    }).then(function () {
      toast(T("Sent", "已发送") + " ✓");
      state.compose = { id: 0, inReplyTo: 0, attachments: [], timer: null, dirty: false, sending: false };
      state.view = "mail";
      showPane("read");
      closeMobilePane();
      resetReadPane();
      navItems.forEach(function (b) { b.classList.toggle("active", b.dataset.folder === "out"); });
      loadFolder("out");
    }).catch(function (e2) {
      state.compose.sending = false;
      btn.disabled = false;
      btn.textContent = label;
      errEl.textContent = e2.message;
      errEl.hidden = false;
    });
  });

  // attachments
  $("cpAttachBtn").addEventListener("click", function () { $("cpFile").click(); });
  $("cpFile").addEventListener("change", function () {
    var files = Array.prototype.slice.call($("cpFile").files || []);
    $("cpFile").value = "";
    if (!files.length) return;
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        var current = state.compose.attachments.reduce(function (s, a) { return s + a.size; }, 0);
        if (f.size > 700000) return toast(T('"' + f.name + '" is over 700 KB', '"' + f.name + '" 超过 700 KB'));
        if (current + f.size > 2000000) return toast(T("Attachments exceed 2 MB in total", "附件总大小超过 2 MB"));
        return new Promise(function (resolve) {
          var fr = new FileReader();
          fr.onload = function () {
            state.compose.attachments.push({
              filename: f.name, contentType: f.type || "application/octet-stream", size: f.size,
              content: String(fr.result || "").replace(/^data:[^,]*,/, "")
            });
            renderAttachList();
            markDirty();
            resolve();
          };
          fr.onerror = function () { resolve(); };
          fr.readAsDataURL(f);
        });
      });
    });
    chain.then(function () { renderAttachList(); });
  });

  function renderAttachList() {
    var el = $("cpAttachList");
    var list = state.compose.attachments;
    el.hidden = !list.length;
    el.innerHTML = list.map(function (a, i) {
      return '<span class="att-chip small">' + clipSvg + '<span class="att-name">' + esc(a.filename) +
        '</span><span class="att-size">' + fmtSize(a.size) + '</span>' +
        '<button type="button" class="att-x" data-i="' + i + '" aria-label="Remove">&times;</button></span>';
    }).join("");
    el.querySelectorAll(".att-x").forEach(function (b) {
      b.addEventListener("click", function () {
        state.compose.attachments.splice(+b.dataset.i, 1);
        renderAttachList();
        markDirty();
      });
    });
  }

  // ============================================================
  // drafts
  // ============================================================
  function openDraft(id) {
    api("/api/mail/draft?id=" + id).then(function (d) {
      var dr = d.draft;
      openCompose({
        draftId: dr.id, to: dr.to, cc: dr.cc, bcc: dr.bcc, subject: dr.subject,
        text: dr.text, inReplyTo: dr.inReplyTo, from: dr.from
      });
      state.compose.attachments = (dr.attachments || []).map(function (a) {
        return { filename: a.filename, contentType: a.contentType, size: a.size, content: a.content };
      });
      renderAttachList();
    }).catch(function (e) { toast(e.message); });
  }

  // ============================================================
  // contacts
  // ============================================================
  function showContacts() {
    $("listTitle").textContent = titleFor();
    showPane("contacts");
    closeMobilePane();
    resetReadPane();
    $("ctForm").hidden = true;
    loadContacts("");
  }
  function loadContacts(q) {
    return api("/api/contacts" + (q ? "?q=" + encodeURIComponent(q) : "")).then(function (d) {
      state.contacts = d.contacts || [];
      renderContacts();
      fillDatalist();
      return state.contacts;
    }).catch(function (e) { toast(e.message); });
  }
  // 联系人喂给写信页的 datalist：输入收件人时自动补全
  function fillDatalist() {
    var dl = $("ctDatalist");
    if (!dl) return;
    dl.innerHTML = state.contacts.map(function (c) {
      return '<option value="' + esc(c.address) + '">' + esc(c.name || "") + "</option>";
    }).join("");
  }
  function renderContacts() {
    var el = $("contactList");
    if (!state.contacts.length) {
      el.innerHTML = '<p class="list-empty">' + T("No contacts yet. They appear automatically as mail arrives.",
        "还没有联系人。收到的邮件会自动收录。") + "</p>";
      return;
    }
    el.innerHTML = state.contacts.map(function (c) {
      return '<div class="contact-row">' +
        '<span class="ct-ava" style="background:' + avaColor(c.address) + ';color:#fff">' + esc(initial(c.name || c.address)) + "</span>" +
        '<span class="ct-main"><span class="ct-addr">' + esc(c.name || c.address) + "</span>" +
          (c.name ? '<span class="ct-mail">' + esc(c.address) + "</span>" : "") +
          (c.note ? '<span class="ct-note">' + esc(c.note) + "</span>" : "") + "</span>" +
        '<span class="ct-acts">' +
          '<button class="ct-icon ct-star' + (c.starred ? " on" : "") + '" data-id="' + c.id + '" type="button" title="' + esc(T("Star", "星标")) + '">' + starSvg + "</button>" +
          '<button class="ct-write" data-addr="' + esc(c.address) + '" type="button">' + T("Write", "写信") + "</button>" +
          '<button class="ct-icon ct-edit" data-id="' + c.id + '" type="button" title="' + esc(T("Edit", "编辑")) + '">' + pencilSvg + "</button>" +
          '<button class="ct-icon ct-del" data-id="' + c.id + '" type="button" title="' + esc(T("Delete", "删除")) + '">&times;</button>' +
        "</span></div>";
    }).join("");

    el.querySelectorAll(".ct-write").forEach(function (b) {
      b.addEventListener("click", function () { openCompose({ to: b.dataset.addr }); });
    });
    el.querySelectorAll(".ct-star").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = state.contacts.filter(function (x) { return x.id === +b.dataset.id; })[0];
        api("/api/contacts", { method: "PATCH", body: { id: c.id, starred: c.starred ? 0 : 1 } })
          .then(function () { loadContacts($("ctSearch").value.trim()); })
          .catch(function (e) { toast(e.message); });
      });
    });
    el.querySelectorAll(".ct-edit").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = state.contacts.filter(function (x) { return x.id === +b.dataset.id; })[0];
        state.editingContact = c.id;
        $("ctAddr").value = c.address;
        $("ctName").value = c.name || "";
        $("ctForm").hidden = false;
        $("ctName").focus();
      });
    });
    el.querySelectorAll(".ct-del").forEach(function (b) {
      b.addEventListener("click", function () {
        confirmBox(T("Remove this contact?", "删除这个联系人？"), { danger: true, okText: T("Remove", "删除") })
          .then(function (ok) {
            if (!ok) return;
            api("/api/contacts?id=" + b.dataset.id, { method: "DELETE" })
              .then(function () { loadContacts($("ctSearch").value.trim()); })
              .catch(function (e) { toast(e.message); });
          });
      });
    });
  }
  var pencilSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L20 8l-4-4L4 16v4Z" stroke-linejoin="round"/></svg>';

  $("ctSearch").addEventListener("input", debounce(function () {
    loadContacts($("ctSearch").value.trim());
  }, 300));
  $("ctAddBtn").addEventListener("click", function () {
    state.editingContact = 0;
    $("ctForm").hidden = !$("ctForm").hidden;
    if (!$("ctForm").hidden) { $("ctAddr").value = ""; $("ctName").value = ""; $("ctAddr").focus(); }
  });
  $("ctCancel").addEventListener("click", function () { $("ctForm").hidden = true; state.editingContact = 0; });
  $("ctForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var addr = $("ctAddr").value.trim();
    if (state.editingContact) {
      api("/api/contacts", { method: "PATCH", body: { id: state.editingContact, name: $("ctName").value } })
        .then(function () { $("ctForm").hidden = true; state.editingContact = 0; loadContacts($("ctSearch").value.trim()); })
        .catch(function (e2) { toast(e2.message); });
    } else {
      api("/api/contacts", { method: "POST", body: { address: addr, name: $("ctName").value } })
        .then(function () { $("ctForm").hidden = true; loadContacts($("ctSearch").value.trim()); toast(T("Contact added", "联系人已添加")); })
        .catch(function (e2) { toast(e2.message); });
    }
  });

  // ============================================================
  // aliases
  // ============================================================
  function loadAliases() {
    return api("/api/aliases").then(function (d) {
      state.aliases = d.aliases || [];
      return state.aliases;
    }).catch(function () { return []; });
  }
  function fillFromSelect(selected) {
    var sel = $("composeFrom");
    var opts = ['<option value="' + esc(state.user.address) + '">' + esc(state.user.address) + "</option>"];
    state.aliases.forEach(function (a) {
      opts.push('<option value="' + esc(a.address) + '">' + esc(a.address) + (a.label ? " · " + esc(a.label) : "") + "</option>");
    });
    sel.innerHTML = opts.join("");
    if (selected) sel.value = selected;
  }
  function showAliases() {
    $("listTitle").textContent = titleFor();
    showPane("aliases");
    closeMobilePane();
    resetReadPane();
    $("aliasErr").hidden = true;
    $("aliasNote").textContent = state.user.is_admin
      ? T("Admin: unlimited aliases, no character limit.", "管理员别名不限数量和字符。")
      : T("Free accounts: up to 5 aliases, 6-20 characters each.", "普通账号最多 5 个别名，每个 6-20 个字符。");
    loadAliases().then(function (list) { renderAliases(list); fillFromSelect(); });
  }
  function renderAliases(list) {
    var el = $("aliasList");
    var quota = $("aliasQuota");
    quota.textContent = state.user.is_admin ? T("Admin · unlimited", "管理员 · 不限量") : list.length + " / 5";
    if (!list.length) {
      el.innerHTML = '<div class="alias-empty"><img src="img/dino-nap.webp" alt="" class="le-mark">' +
        "<p>" + T("No aliases yet. Add one to send and receive mail.", "还没有别名。添加一个，用它收发邮件。") + "</p></div>";
      return;
    }
    el.innerHTML = list.map(function (a) {
      return '<div class="contact-row">' +
        '<span class="ct-main"><span class="iv-code">' + esc(a.address) + "</span>" +
        (a.label ? '<span class="ct-note">' + esc(a.label) + "</span>" : "") +
        '<span class="ct-mail">' + new Date(a.created_at * 1000).toLocaleDateString(LOC(), { year: "numeric", month: "short", day: "numeric" }) + "</span></span>" +
        '<span class="ct-acts">' +
          '<button class="ct-write al-write" data-addr="' + esc(a.address) + '" type="button">' + T("Write", "写信") + "</button>" +
          '<button class="ct-icon iv-del" data-id="' + a.id + '" type="button" title="' + esc(T("Remove", "删除")) + '">&times;</button>' +
        "</span></div>";
    }).join("");
    el.querySelectorAll(".al-write").forEach(function (b) {
      b.addEventListener("click", function () { openCompose({ to: "", from: b.dataset.addr }); });
    });
    el.querySelectorAll(".iv-del").forEach(function (b) {
      b.addEventListener("click", function () {
        api("/api/aliases?id=" + b.dataset.id, { method: "DELETE" })
          .then(function () { showAliases(); toast(T("Alias removed", "别名已删除")); })
          .catch(function (e2) { toast(e2.message); });
      });
    });
  }
  $("aliasAddBtn").addEventListener("click", function () {
    var errEl = $("aliasErr"); errEl.hidden = true;
    api("/api/aliases", { method: "POST", body: { local: $("aliasLocal").value, domain: $("aliasDomain").value } })
      .then(function () {
        $("aliasLocal").value = "";
        showAliases();
        toast(T("Alias added ✓", "别名已添加 ✓"));
      }).catch(function (e) { errEl.textContent = e.message; errEl.hidden = false; });
  });

  // ============================================================
  // settings
  // ============================================================
  function showSettings() {
    $("listTitle").textContent = titleFor();
    showPane("settings");
    closeMobilePane();
    resetReadPane();
    $("setName").value = state.user.display_name || "";
    $("setSig").value = state.user.signature || "";
    $("setAddr").textContent = state.user.address;
    $("profileErr").hidden = true; $("profileOk").hidden = true;
    $("pwErr").hidden = true; $("pwOk").hidden = true;
    $("pwCurrent").value = ""; $("pwNext").value = ""; $("pwConfirm").value = "";
    loadRules();
  }

  /* ---------- 通知与转发 ---------- */
  function fillRules(d) {
    $("fwdOn").checked = !!d.forward_on;
    $("fwdTo").value = d.forward_to || "";
    $("tgOn").checked = !!d.tg_on;
    $("tgChat").value = d.tg_chat || "";
    // 没有 bot token 时 Telegram 这块是死的，直接说清楚，别让用户对着开关猜
    $("tgWarn").hidden = !!d.telegram_ready;
    $("tgOn").disabled = !d.telegram_ready;
    if (!d.telegram_ready) $("tgOn").checked = false;
    state.rules = d;
  }

  function loadRules() {
    var err = $("rulesErr"), ok = $("rulesOk");
    if (err) err.hidden = true;
    if (ok) ok.hidden = true;
    return api("/api/account/rules").then(fillRules)
      .catch(function () { /* 迁移未执行时静默，不打断设置页其它功能 */ });
  }

  $("saveRulesBtn").addEventListener("click", function () {
    var err = $("rulesErr"), ok = $("rulesOk");
    err.hidden = true; ok.hidden = true;
    var btn = $("saveRulesBtn"); btn.disabled = true;
    api("/api/account/rules", {
      method: "POST",
      body: {
        forward_to: $("fwdTo").value.trim(),
        forward_on: $("fwdOn").checked,
        tg_chat: $("tgChat").value.trim(),
        tg_on: $("tgOn").checked,
      },
    }).then(function (d) {
      fillRules(d);           // 用返回的数据回填，不再多请求一次（也就不会把提示抹掉）
      ok.textContent = T("Saved.", "已保存");
      ok.hidden = false;
    }).catch(function (e) {
      err.textContent = e.message || T("Could not save", "保存失败");
      err.hidden = false;
    }).then(function () { btn.disabled = false; });
  });

  $("testRulesBtn").addEventListener("click", function () {
    var err = $("rulesErr"), ok = $("rulesOk");
    err.hidden = true; ok.hidden = true;
    var fwd = $("fwdTo").value.trim(), chat = $("tgChat").value.trim();
    if (!fwd && !chat) { err.textContent = T("Fill in an address or a chat ID first.", "先填一个转发地址或 Chat ID，再点测试。"); err.hidden = false; return; }

    var btn = $("testRulesBtn"); btn.disabled = true;
    var old = btn.textContent; btn.textContent = T("Sending…", "正在发送…");
    api("/api/account/rules/test", { method: "POST", body: { forward_to: fwd, tg_chat: chat } })
      .then(function (d) {
        var parts = [];
        if (d.forward) parts.push(T("Forward: ", "转发：") + (d.forward.ok ? T("ok", "成功") : (d.forward.error || "failed")));
        if (d.telegram) parts.push("Telegram: " + (d.telegram.ok ? T("ok", "成功") : (d.telegram.error || "failed")));
        var allOk = (!d.forward || d.forward.ok) && (!d.telegram || d.telegram.ok);
        (allOk ? ok : err).textContent = parts.join(" · ");
        (allOk ? ok : err).hidden = false;
      })
      .catch(function (e) {
        err.textContent = e.message || T("Test failed", "测试失败");
        err.hidden = false;
      })
      .then(function () { btn.disabled = false; btn.textContent = old; });
  });
  $("saveProfileBtn").addEventListener("click", function () {
    var err = $("profileErr"), ok = $("profileOk");
    err.hidden = true; ok.hidden = true;
    api("/api/account/profile", { method: "POST", body: { display_name: $("setName").value, signature: $("setSig").value } })
      .then(function (d) {
        state.user.display_name = d.display_name;
        state.user.signature = d.signature;
        ok.textContent = T("Saved ✓", "已保存 ✓");
        ok.hidden = false;
        setTimeout(function () { ok.hidden = true; }, 2600);
      })
      .catch(function (e) { err.textContent = e.message; err.hidden = false; });
  });
  $("savePwBtn").addEventListener("click", function () {
    var err = $("pwErr"), ok = $("pwOk");
    err.hidden = true; ok.hidden = true;
    if ($("pwNext").value !== $("pwConfirm").value) {
      err.textContent = T("The two new passwords don't match", "两次输入的新密码不一致");
      err.hidden = false;
      return;
    }
    api("/api/account/password", { method: "POST", body: { current: $("pwCurrent").value, next: $("pwNext").value } })
      .then(function () {
        ok.textContent = T("Password updated ✓", "密码已更新 ✓");
        ok.hidden = false;
        $("pwCurrent").value = ""; $("pwNext").value = ""; $("pwConfirm").value = "";
        setTimeout(function () { ok.hidden = true; }, 3200);
      })
      .catch(function (e) { err.textContent = e.message; err.hidden = false; });
  });

  /* ---------- 数据导出 / 注销账号 ---------- */
  function downloadBlob(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  $("exportBtn").addEventListener("click", function () {
    var btn = $("exportBtn");
    btn.disabled = true;
    fetch("/api/account/export", { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.blob();
    }).then(function (blob) {
      downloadBlob(blob, "dino-mail-export-" + new Date().toISOString().slice(0, 10) + ".json");
      toast(T("Export ready ✓", "导出完成 ✓"));
    }).catch(function (e) {
      toast(T("Export failed: ", "导出失败：") + e.message);
    }).then(function () { btn.disabled = false; });
  });
  $("deleteAccBtn").addEventListener("click", function () {
    var err = $("delErr");
    err.hidden = true;
    var pw = $("delPw").value;
    if (!pw) {
      err.textContent = T("Enter your current password first.", "请先输入当前密码。");
      err.hidden = false;
      return;
    }
    confirmBox(
      T("Delete this account forever? Every mail, contact and alias will be gone. There is no way back.",
        "确定永久注销账号？所有邮件、联系人、别名都会被删除，无法恢复。"),
      { danger: true, okText: T("Delete forever", "永久删除") }
    ).then(function (ok) {
      if (!ok) return;
      api("/api/account", { method: "DELETE", body: { password: pw } })
        .then(function () {
          toast(T("Account deleted. Goodbye 👋", "账号已注销。再见 👋"));
          setTimeout(function () { location.reload(); }, 800);
        })
        .catch(function (e) { err.textContent = e.message; err.hidden = false; });
    });
  });

  // ============================================================
  // admin
  // ============================================================
  function showAdmin() {
    $("listTitle").textContent = titleFor();
    showPane("admin");
    closeMobilePane();
    resetReadPane();
    api("/api/admin/invites").then(function (d) {
      var el = $("inviteList");
      var invites = d.invites || [];
      if (!invites.length) {
        el.innerHTML = '<p class="list-empty">' + T("No codes yet. Generate one to invite someone.",
          "还没有邀请码。生成一个来邀请朋友。") + "</p>";
        return;
      }
      el.innerHTML = invites.map(function (c) {
        var status = c.used_by
          ? '<span class="iv-badge used">' + T("used", "已用") + ": " + esc(c.used_by) + "</span>"
          : '<span class="iv-badge free">' + T("available", "可用") + "</span>";
        return '<div class="contact-row invite-row"><span class="iv-code">' + esc(c.code) + "</span>" + status +
          (c.used_by ? "" : '<button class="ct-write iv-del" data-code="' + esc(c.code) + '" type="button">' + T("Revoke", "撤销") + "</button>") +
          "</div>";
      }).join("");
      el.querySelectorAll(".iv-del").forEach(function (b) {
        b.addEventListener("click", function () {
          api("/api/admin/invites?code=" + encodeURIComponent(b.dataset.code), { method: "DELETE" })
            .then(showAdmin).catch(function (e2) { toast(e2.message); });
        });
      });
    }).catch(function (e) { toast(e.message); });
    loadUsers();
  }

  function loadUsers() {
    api("/api/admin/users").then(function (d) {
      var el = $("userList");
      var users = d.users || [];
      if (!users.length) {
        el.innerHTML = '<p class="list-empty">' + T("No users yet.", "还没有用户。") + "</p>";
        return;
      }
      el.innerHTML = users.map(function (u) {
        return '<div class="contact-row">' +
          '<span class="ct-main"><span class="iv-code">' + esc(u.address) + "</span>" +
          (u.display_name ? '<span class="ct-note">' + esc(u.display_name) + "</span>" : "") +
          '<span class="ct-mail">' + (u.mails || 0) + T(" mails", " 封邮件") + " · " +
            new Date(u.created_at * 1000).toLocaleDateString(LOC(), { year: "numeric", month: "short", day: "numeric" }) + "</span></span>" +
          '<span class="ct-acts"><button class="ct-write u-reset" data-addr="' + esc(u.address) + '" type="button">' +
            T("Reset password", "重置密码") + "</button></span></div>";
      }).join("");
      el.querySelectorAll(".u-reset").forEach(function (b) {
        b.addEventListener("click", function () {
          var addr = b.dataset.addr;
          confirmBox(
            T("Reset the password for " + addr + "? All their sign-ins will be signed out.",
              "确定重置 " + addr + " 的密码？该用户的所有登录会立即失效。"),
            { okText: T("Reset", "重置") }
          ).then(function (ok) {
            if (!ok) return;
            api("/api/admin/users/reset", { method: "POST", body: { address: addr } })
              .then(function (d) {
                infoBox(
                  T("Temporary password for " + addr + ":\n\n" + d.temp + "\n\nIt is shown only this once — pass it on, and the user can change it after signing in.",
                    addr + " 的临时密码：\n\n" + d.temp + "\n\n只显示这一次。请转交给对方，登录后可自行修改。"),
                  T("Done", "完成")
                );
              })
              .catch(function (e2) { toast(e2.message); });
          });
        });
      });
    }).catch(function (e) { /* 没跑 0005 之前也许列表也拿不到，静默 */ toast(e.message); });
  }
  $("genInviteBtn").addEventListener("click", function () {
    api("/api/admin/invites", { method: "POST" })
      .then(function () { showAdmin(); toast(T("Code generated", "已生成邀请码") + " ✓"); })
      .catch(function (e) { toast(e.message); });
  });

  // ============================================================
  // keyboard
  // ============================================================
  function isTyping(e) {
    var tag = (e.target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
  }

  document.addEventListener("keydown", function (e) {
    if (mailView.classList.contains("hidden")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "Escape") {
      if (!$("composePane").classList.contains("hidden")) { closeCompose(true); return; }
      if (readCol.classList.contains("open")) { closeMobilePane(); return; }
      if (state.q) { $("searchInput").value = ""; state.q = ""; $("searchClear").hidden = true; fetchPage(null, false); return; }
      return;
    }

    if (isTyping(e)) return;
    if (!$("composePane").classList.contains("hidden")) return;

    var k = e.key.toLowerCase();
    if (k === "c") { e.preventDefault(); openCompose({}); return; }
    if (k === "/") { e.preventDefault(); $("searchInput").focus(); return; }
    if (k === "j" || k === "k") {
      e.preventDefault();
      if (state.view !== "mail") return;
      var items = Array.prototype.slice.call(document.querySelectorAll("#mailList .mail-item"));
      if (!items.length) return;
      var idx = items.findIndex(function (el) { return +el.dataset.id === state.openId; });
      idx = Math.min(items.length - 1, Math.max(0, idx + (k === "j" ? 1 : -1)));
      var target = items[idx];
      openById(+target.dataset.id);
      target.scrollIntoView({ block: "nearest" });
      return;
    }
    if (k === "enter" && state.openId) { e.preventDefault(); openById(state.openId); return; }

    var m = state.openMailData;
    if (!m || state.view !== "mail") return;
    if (k === "r") { e.preventDefault(); replyTo(m, false); }
    else if (k === "a") { e.preventDefault(); replyTo(m, true); }
    else if (k === "f") { e.preventDefault(); forward(m); }
    else if (k === "s") { e.preventDefault(); toggleStar(m.id, document.querySelector(".rm-star")); }
    else if (k === "e" || k === "#") {
      e.preventDefault();
      api("/api/mail/action", { method: "POST", body: { ids: [m.id], action: "trash" } }).then(function (d) {
        if (d.counts) { state.counts = d.counts; renderCounts(); }
        resetReadPane(); fetchPage(null, false);
        toast(T("Moved to trash", "已移入垃圾箱"));
      }).catch(function (err) { toast(err.message); });
    }
  });

  // ============================================================
  // polling
  // ============================================================
  setInterval(function () {
    if (!state.user || document.hidden) return;
    if (state.view === "compose") { refreshCounts(); return; }
    refreshCounts();
    if (state.view === "mail" && state.folder === "in" && !selectedIds().length) {
      fetchPage(null, false);
    }
  }, 45000);

  // 关标签/跳走之前的最后兜底：用 sendBeacon 把没保存的草稿发走。
  // 页面正在卸载，不会再有防抖定时器跟着跑，所以不会存出重复草稿。
  window.addEventListener("pagehide", function () {
    if (!state.user) return;
    if ($("composePane").classList.contains("hidden")) return;
    if (state.compose.sending || !composeHasContent()) return;
    try {
      navigator.sendBeacon("/api/mail/draft", new Blob([JSON.stringify(draftPayload())], { type: "application/json" }));
    } catch (e) { /* 尽力而为 */ }
  });
})();
