(function () {
  var config = {
    mosque_name: "Loading...",
    mosque_address: "...",
    running_text: "",
    latitude: -6.1754,
    longitude: 106.8272,
    tune_subuh: 0,
    tune_shuruq: 0,
    tune_dzuhur: 0,
    tune_ashar: 0,
    tune_maghrib: 0,
    tune_isya: 0,
    countdown_duration: 10,
    time_offset: 0,
  };

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
    digital: {
      clock: document.getElementById("digital-clock"),
      gregorian: document.getElementById("date-gregorian"),
      hijri: document.getElementById("date-hijri"),
    },
  };

  var daysIndo = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var monthsIndo = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  var monthsHijri = [
    "Muharram",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jumadil Awal",
    "Jumadil Akhir",
    "Rajab",
    "Sya'ban",
    "Ramadhan",
    "Syawal",
    "Dzulqa'dah",
    "Dzulhijjah",
  ];

  var currentPrayerData = null;
  var lastActivePrayer = "";
  var lastDay = -1;
  var lastRunningText = "";
  var lastCountdownState = false;

  function ajax(url, successCallback, errorCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 400) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (successCallback) successCallback(data);
          } catch (e) {
            console.error("JSON Parse error", e);
            if (errorCallback) errorCallback(e);
          }
        } else {
          if (errorCallback) errorCallback(xhr);
        }
      }
    };
    xhr.send();
  }

  function formatTime(d) {
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  function getHijriDate(dateObj, adjustment) {
    var adjust = adjustment || 0;

    var d = dateObj.getDate();
    var m = dateObj.getMonth();
    var y = dateObj.getFullYear();

    var mPart = m - 2.0;
    if (mPart < 1.0) {
      mPart = mPart + 12.0;
      y = y - 1.0;
    }

    var jd =
      Math.floor(365.25 * (y + 4716.0)) +
      Math.floor(30.6001 * (mPart + 1.0)) +
      d +
      adjust -
      1524.5;

    if (jd > 2299160.0) {
      var a = Math.floor((jd - 1867216.25) / 36524.25);
      jd = jd + 1 + a - Math.floor(a / 4.0);
    }

    var iyear = 10631.0 / 30.0;
    var epochastro = 1948084;

    var shift1 = 8.01 / 60.0;

    var z = jd - epochastro;
    var cyc = Math.floor(z / 10631.0);
    z = z - 10631.0 * cyc;
    var j = Math.floor((z - shift1) / iyear);
    var iy = 30 * cyc + j;
    z = z - Math.floor(j * iyear + shift1);
    var im = Math.floor((z + 28.5001) / 29.5);

    if (im === 13) im = 12;

    var id = z - Math.floor(29.5 * im - 29.0001);

    return {
      day: id,
      month: im - 1,
      year: iy,
    };
  }

  function fetchSettings() {
    ajax(
      "api.php?t=" + new Date().getTime(),
      function (data) {
        config = data;
        config.latitude = parseFloat(data.latitude);
        config.longitude = parseFloat(data.longitude);
        config.countdown_duration = parseInt(data.countdown_duration);
        config.time_offset = parseInt(data.time_offset) || 0;

        updateDataMasjid();
        updateRunningText();

        currentPrayerData = calculatePrayerTimes(new Date());
      },
      function (err) {
        console.error("Gagal koneksi ke server lokal:", err);
      }
    );
  }

  function createNumbers() {
    for (var i = 1; i <= 12; i++) {
      var numContainer = document.createElement("div");
      numContainer.className = "clock-number";
      var numText = document.createElement("span");
      numText.innerHTML = i;
      var rotation = i * 30;
      numContainer.style.transform = "rotate(" + rotation + "deg)";
      numText.style.transform = "rotate(" + -rotation + "deg)";
      numContainer.appendChild(numText);
      els.face.insertBefore(numContainer, els.hour);
    }
  }

  function updateDataMasjid() {
    els.masjid.innerHTML = config.mosque_name;
    els.alamat.innerHTML = config.mosque_address;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function calculatePrayerTimes(dateObj) {
    var coordinates = new adhan.Coordinates(config.latitude, config.longitude);
    var params = adhan.CalculationMethod.Singapore();
    params.madhab = adhan.Madhab.Shafi;

    var prayerTimes = new adhan.PrayerTimes(coordinates, dateObj, params);

    prayerTimes.fajr = addMinutes(
      prayerTimes.fajr,
      parseInt(config.tune_subuh) || 0
    );
    prayerTimes.sunrise = addMinutes(
      prayerTimes.sunrise,
      parseInt(config.tune_shuruq) || 0
    );
    prayerTimes.dhuhr = addMinutes(
      prayerTimes.dhuhr,
      parseInt(config.tune_dzuhur) || 0
    );
    prayerTimes.asr = addMinutes(
      prayerTimes.asr,
      parseInt(config.tune_ashar) || 0
    );
    prayerTimes.maghrib = addMinutes(
      prayerTimes.maghrib,
      parseInt(config.tune_maghrib) || 0
    );
    prayerTimes.isha = addMinutes(
      prayerTimes.isha,
      parseInt(config.tune_isya) || 0
    );

    els.times.subuh.innerHTML = formatTime(prayerTimes.fajr);
    els.times.shuruq.innerHTML = formatTime(prayerTimes.sunrise);
    els.times.dzuhur.innerHTML = formatTime(prayerTimes.dhuhr);
    els.times.ashar.innerHTML = formatTime(prayerTimes.asr);
    els.times.maghrib.innerHTML = formatTime(prayerTimes.maghrib);
    els.times.isya.innerHTML = formatTime(prayerTimes.isha);

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
    if (config.time_offset) now = new Date(now.getTime() + config.time_offset);

    var seconds = now.getSeconds();
    var minutes = now.getMinutes();
    var hours = now.getHours();

    els.sec.style.transform = "rotate(" + seconds * 6 + "deg)";
    els.min.style.transform =
      "rotate(" + (minutes * 6 + seconds * 0.1) + "deg)";
    els.hour.style.transform =
      "rotate(" + (hours * 30 + minutes * 0.5) + "deg)";

    var sStr = seconds < 10 ? "0" + seconds : seconds;
    var mStr = minutes < 10 ? "0" + minutes : minutes;
    var hStr = hours < 10 ? "0" + hours : hours;

    if (els.digital.clock) {
      els.digital.clock.innerHTML = hStr + ":" + mStr + ":" + sStr;
    }

    if (seconds % 10 === 0) updateRunningText();

    var currentDay = now.getDate();
    if (currentDay !== lastDay) {
      currentPrayerData = calculatePrayerTimes(now);
      lastDay = currentDay;

      if (els.digital.gregorian) {
        var dayName = daysIndo[now.getDay()];
        var monthName = monthsIndo[now.getMonth()];
        els.digital.gregorian.innerHTML =
          dayName +
          ", " +
          currentDay +
          " " +
          monthName +
          " " +
          now.getFullYear();
      }

      if (els.digital.hijri) {
        var hData = getHijriDate(now, -1);
        els.digital.hijri.innerHTML =
          hData.day + " " + monthsHijri[hData.month] + " " + hData.year + " H";
      }

      if (hours === 2 && minutes === 0 && seconds < 5) window.location.reload();
    }

    if (currentPrayerData) {
      var next = currentPrayerData.nextPrayer(now);
      var isCountdownMode = false;
      var targetTime = null;

      if (next === "fajr") targetTime = currentPrayerData.fajr;
      else if (next === "sunrise") targetTime = currentPrayerData.sunrise;
      else if (next === "dhuhr") targetTime = currentPrayerData.dhuhr;
      else if (next === "asr") targetTime = currentPrayerData.asr;
      else if (next === "maghrib") targetTime = currentPrayerData.maghrib;
      else if (next === "isha") targetTime = currentPrayerData.isha;

      if (targetTime) {
        var diff = targetTime - now;
        var diffMinutes = diff / 1000 / 60;

        if (diffMinutes <= config.countdown_duration && diffMinutes > 0) {
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
          els.countdown.nextName.innerHTML = mapName[next];
        }
      }

      if (isCountdownMode !== lastCountdownState) {
        els.countdown.overlay.style.display = isCountdownMode ? "flex" : "none";
        lastCountdownState = isCountdownMode;
      }

      if (!isCountdownMode && next !== lastActivePrayer) {
        for (var key in els.rows) els.rows[key].className = "schedule-item";

        var mapRow = {
          fajr: els.rows.subuh,
          sunrise: els.rows.shuruq,
          dhuhr: els.rows.dzuhur,
          asr: els.rows.ashar,
          maghrib: els.rows.maghrib,
          isha: els.rows.isya,
          none: els.rows.subuh,
        };

        if (mapRow[next]) mapRow[next].className = "schedule-item active";
        else if (next === "none")
          els.rows.subuh.className = "schedule-item active";

        lastActivePrayer = next;
      }
    }
  }

  function updateRunningText() {
    if (config.running_text && config.running_text !== lastRunningText) {
      var el = document.getElementById("marquee-text");
      if (el) {
        el.innerHTML = config.running_text;
        lastRunningText = config.running_text;
      }
    }
  }

  createNumbers();
  fetchSettings();

  setInterval(fetchSettings, 30000);
  setInterval(tick, 1000);
  tick();
})();
