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
      dzuhur: document.getElementById("row-dzuhur"),
      ashar: document.getElementById("row-ashar"),
      maghrib: document.getElementById("row-maghrib"),
      isya: document.getElementById("row-isya"),
    },
    times: {
      subuh: document.getElementById("jam-subuh"),
      dzuhur: document.getElementById("jam-dzuhur"),
      ashar: document.getElementById("jam-ashar"),
      maghrib: document.getElementById("jam-maghrib"),
      isya: document.getElementById("jam-isya"),
    },
  };

  var currentPrayerData = null;
  var lastActivePrayer = "";
  var lastDay = -1;

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

  function calculatePrayerTimes(dateObj) {
    var lat = parseFloat(localStorage.getItem("latitude")) || -6.1754;
    var lng = parseFloat(localStorage.getItem("longitude")) || 106.8272;

    var coordinates = new adhan.Coordinates(lat, lng);
    var params = adhan.CalculationMethod.Singapore();
    params.madhab = adhan.Madhab.Shafi;

    var prayerTimes = new adhan.PrayerTimes(coordinates, dateObj, params);
    var timeOpt = { hour: "2-digit", minute: "2-digit" };

    els.times.subuh.innerHTML = prayerTimes.fajr.toLocaleTimeString(
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

  function tick() {
    var now = new Date();

    var offset = localStorage.getItem("time_offset");
    if (offset) {
      now = new Date(now.getTime() + parseInt(offset));
    }

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

    var currentDay = now.getDate();

    if (currentDay !== lastDay) {
      currentPrayerData = calculatePrayerTimes(now);
      lastDay = currentDay;
      if (hours === 3 && minutes === 0 && seconds < 5) {
        window.location.reload();
      }
    }

    if (currentPrayerData) {
      var next = currentPrayerData.nextPrayer(now);

      if (next !== lastActivePrayer) {
        for (var key in els.rows) {
          if (els.rows.hasOwnProperty(key)) {
            els.rows[key].className = "schedule-item";
          }
        }

        var map = {
          fajr: els.rows.subuh,
          dhuhr: els.rows.dzuhur,
          asr: els.rows.ashar,
          maghrib: els.rows.maghrib,
          isha: els.rows.isya,
          none: els.rows.subuh,
        };

        if (map[next]) {
          map[next].className = "schedule-item active";
        } else if (next === "none") {
          els.rows.subuh.className = "schedule-item active";
        }

        lastActivePrayer = next;
      }
    }
  }

  function updateRunningText() {
    var el = document.getElementById("marquee-text");

    var textData =
      localStorage.getItem("running_text") ||
      "Selamat Datang di Masjid An-Nur. Mohon luruskan dan rapatkan shaf.";

    if (el.innerHTML != textData) {
      el.innerHTML = textData;
    }
  }

  createNumbers();
  updateDataMasjid();
  updateRunningText();

  setInterval(tick, 1000);
  tick();
})();
