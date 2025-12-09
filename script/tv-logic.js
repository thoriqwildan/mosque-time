(function () {
  var els = {
    hour: document.getElementById("hour-hand"),
    min: document.getElementById("min-hand"),
    sec: document.getElementById("sec-hand"),
    face: document.getElementById("clock-face"),
    masjid: document.getElementById("nama-masjid"),
    alamat: document.getElementById("alamat-masjid"),
    rows: {
      subuh: document.getElementById("row-subuh"),
      shuruq: document.getElementById("row-shuruq"),
      dzuhur: document.getElementById("row-dzuhur"),
      ashar: document.getElementById("row-ashar"),
      maghrib: document.getElementById("row-maghrib"),
      isya: document.getElementById("row-isya"),
    },
    times: {
      subuh: document.getElementById("jam-subuh"),
      shuruq: document.getElementById("jam-shuruq"),
      dzuhur: document.getElementById("jam-dzuhur"),
      ashar: document.getElementById("jam-ashar"),
      maghrib: document.getElementById("jam-maghrib"),
      isya: document.getElementById("jam-isya"),
    },
    countdown: {
      overlay: document.getElementById("countdown-overlay"),
      title: document.getElementById("cd-title"),
      timer: document.getElementById("cd-timer"),
      nextName: document.getElementById("cd-next-prayer"),
    },
  };

  var currentPrayerData = null;
  var lastActivePrayer = "";
  var lastDay = -1;
  var lastRunningText = "";
  var lastCountdownState = false;

  var COUNTDOWN_MINUTES =
    parseInt(localStorage.getItem("countdown_duration")) || 10;

  function createNumbers() {
    for (var i = 1; i <= 12; i++) {
      var numContainer = document.createElement("div");
      numContainer.className = "clock-number";
      var numText = document.createElement("span");
      numText.innerHTML = i;
      var rotation = i * 30;
      var rotStyle = "rotate(" + rotation + "deg)";
      numContainer.style.transform = rotStyle;
      numContainer.style.webkitTransform = rotStyle;
      numContainer.style.mozTransform = rotStyle;
      var counterRotStyle = "rotate(" + -rotation + "deg)";
      numText.style.transform = counterRotStyle;
      numText.style.webkitTransform = counterRotStyle;
      numText.style.mozTransform = counterRotStyle;
      numContainer.appendChild(numText);
      els.face.insertBefore(numContainer, els.hour);
    }
  }

  function updateDataMasjid() {
    var nama = localStorage.getItem("mosque_name") || "Masjid An-Nur";
    var alamat =
      localStorage.getItem("mosque_address") ||
      "Silakan setting data masjid di Admin Panel";
    els.masjid.innerHTML = nama;
    els.alamat.innerHTML = alamat;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function calculatePrayerTimes(dateObj) {
    var lat = parseFloat(localStorage.getItem("latitude")) || -6.1754;
    var lng = parseFloat(localStorage.getItem("longitude")) || 106.8272;
    var tune = {
      subuh: parseInt(localStorage.getItem("tune_subuh")) || 0,
      shuruq: parseInt(localStorage.getItem("tune_shuruq")) || 0,
      dzuhur: parseInt(localStorage.getItem("tune_dzuhur")) || 0,
      ashar: parseInt(localStorage.getItem("tune_ashar")) || 0,
      maghrib: parseInt(localStorage.getItem("tune_maghrib")) || 0,
      isya: parseInt(localStorage.getItem("tune_isya")) || 0,
    };

    var coordinates = new adhan.Coordinates(lat, lng);
    var params = adhan.CalculationMethod.Singapore();
    params.madhab = adhan.Madhab.Shafi;

    var prayerTimes = new adhan.PrayerTimes(coordinates, dateObj, params);

    prayerTimes.fajr = addMinutes(prayerTimes.fajr, tune.subuh);
    prayerTimes.sunrise = addMinutes(prayerTimes.sunrise, tune.shuruq);
    prayerTimes.dhuhr = addMinutes(prayerTimes.dhuhr, tune.dzuhur);
    prayerTimes.asr = addMinutes(prayerTimes.asr, tune.ashar);
    prayerTimes.maghrib = addMinutes(prayerTimes.maghrib, tune.maghrib);
    prayerTimes.isha = addMinutes(prayerTimes.isha, tune.isya);

    var timeOpt = { hour: "2-digit", minute: "2-digit" };
    els.times.subuh.innerHTML = prayerTimes.fajr.toLocaleTimeString(
      "id-ID",
      timeOpt
    );
    els.times.shuruq.innerHTML = prayerTimes.sunrise.toLocaleTimeString(
      "id-ID",
      timeOpt
    );
    els.times.dzuhur.innerHTML = prayerTimes.dhuhr.toLocaleTimeString(
      "id-ID",
      timeOpt
    );
    els.times.ashar.innerHTML = prayerTimes.asr.toLocaleTimeString(
      "id-ID",
      timeOpt
    );
    els.times.maghrib.innerHTML = prayerTimes.maghrib.toLocaleTimeString(
      "id-ID",
      timeOpt
    );
    els.times.isya.innerHTML = prayerTimes.isha.toLocaleTimeString(
      "id-ID",
      timeOpt
    );

    return prayerTimes;
  }

  function formatCountdown(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  function tick() {
    var now = new Date();
    var offset = localStorage.getItem("time_offset");
    if (offset) now = new Date(now.getTime() + parseInt(offset));

    // --- JAM ANALOG ---
    var seconds = now.getSeconds();
    var minutes = now.getMinutes();
    var hours = now.getHours();
    var secDeg = seconds * 6;
    var minDeg = minutes * 6 + seconds * 0.1;
    var hourDeg = hours * 30 + minutes * 0.5;

    function rotateHand(el, deg) {
      var val = "rotate(" + deg + "deg)";
      el.style.transform = val;
      el.style.webkitTransform = val;
      el.style.mozTransform = val;
    }
    rotateHand(els.sec, secDeg);
    rotateHand(els.min, minDeg);
    rotateHand(els.hour, hourDeg);

    if (seconds % 10 === 0) updateRunningText();

    // --- LOGIKA JADWAL & COUNTDOWN ---
    var currentDay = now.getDate();
    if (currentDay !== lastDay) {
      currentPrayerData = calculatePrayerTimes(now);
      lastDay = currentDay;
      if (hours === 2 && minutes === 0 && seconds < 5) window.location.reload();
    }

    if (currentPrayerData) {
      var next = currentPrayerData.nextPrayer(now);

      var isCountdownMode = false;
      var targetTime = null;
      var nextNameDisplay = "";

      if (next !== "none") {
        if (next === "fajr") targetTime = currentPrayerData.fajr;
        else if (next === "sunrise") targetTime = currentPrayerData.sunrise;
        else if (next === "dhuhr") targetTime = currentPrayerData.dhuhr;
        else if (next === "asr") targetTime = currentPrayerData.asr;
        else if (next === "maghrib") targetTime = currentPrayerData.maghrib;
        else if (next === "isha") targetTime = currentPrayerData.isha;

        if (targetTime) {
          var diff = targetTime - now;
          var diffMinutes = diff / 1000 / 60;

          if (diffMinutes <= COUNTDOWN_MINUTES && diffMinutes > 0) {
            isCountdownMode = true;

            els.countdown.timer.innerHTML = formatCountdown(diff);

            var mapName = {
              fajr: "SUBUH",
              sunrise: "SYURUQ",
              dhuhr: "DZUHUR",
              asr: "ASHAR",
              maghrib: "MAGHRIB",
              isha: "ISYA",
            };
            var nameNow = mapName[next];
            if (els.countdown.nextName.innerHTML !== nameNow) {
              els.countdown.nextName.innerHTML = nameNow;
            }
          }
        }
      }

      if (isCountdownMode !== lastCountdownState) {
        if (isCountdownMode) {
          els.countdown.overlay.style.display = "flex";
          els.countdown.overlay.style.display = "";
          els.countdown.overlay.classList.add("show-flex");

          els.countdown.overlay.style.display = "flex";
        } else {
          els.countdown.overlay.style.display = "none";
        }
        lastCountdownState = isCountdownMode;
      }

      if (!isCountdownMode) {
        if (next !== lastActivePrayer) {
          for (var key in els.rows) {
            if (els.rows.hasOwnProperty(key))
              els.rows[key].className = "schedule-item";
          }
          var map = {
            fajr: els.rows.subuh,
            shuruq: els.rows.shuruq,
            sunrise: els.rows.shuruq,
            dhuhr: els.rows.dzuhur,
            asr: els.rows.ashar,
            maghrib: els.rows.maghrib,
            isha: els.rows.isya,
            none: els.rows.subuh,
          };
          if (map[next]) map[next].className = "schedule-item active";
          else if (next === "none")
            els.rows.subuh.className = "schedule-item active";

          lastActivePrayer = next;
        }
      }
    }
  }

  function updateRunningText() {
    var textData =
      localStorage.getItem("running_text") ||
      "Selamat Datang di Masjid An-Nur...";
    if (textData !== lastRunningText) {
      var el = document.getElementById("marquee-text");
      if (el) {
        el.innerHTML = textData;
        lastRunningText = textData;
      }
    }
  }

  createNumbers();
  updateDataMasjid();
  updateRunningText();
  setInterval(tick, 1000);
  tick();
})();
