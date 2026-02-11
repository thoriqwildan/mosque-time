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
    logo_index: 0,
    hijri_offset: 0,
  };

  var els = {
    hour: document.getElementById("hour-hand"),
    min: document.getElementById("min-hand"),
    sec: document.getElementById("sec-hand"),
    face: document.getElementById("clock-face"),
    masjid: document.getElementById("nama-masjid"),
    alamat: document.getElementById("alamat-masjid"),
    marquee: document.getElementById("marquee-text"),
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

  function ajax(url, successCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (successCallback) successCallback(data);
        } catch (e) {
          console.error("JSON Error", e);
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

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function formatCountdown(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
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

  function fetchSettings() {
    ajax("api.php?t=" + new Date().getTime(), function (data) {
      var root = document.documentElement;

      config = data;
      config.latitude = parseFloat(data.latitude);
      config.longitude = parseFloat(data.longitude);
      config.countdown_duration = parseInt(data.countdown_duration);
      config.time_offset = parseInt(data.time_offset) || 0;
      config.hijri_offset = parseInt(data.hijri_offset) || 0;

      var logoIndex = parseInt(config.logo_index) || 0;
      var themeId = config.theme_id || "gold";
      var selectedTheme =
        themesList.find(function (t) {
          return t.id === themeId;
        }) || themesList[0];

      if (els.masjid.innerHTML !== config.mosque_name)
        els.masjid.innerHTML = config.mosque_name;
      if (els.alamat.innerHTML !== config.mosque_address)
        els.alamat.innerHTML = config.mosque_address;
      if (logoIndex >= logosList.length) logoIndex = 0;

      var logoSrc = "../img/logo/" + logosList[logoIndex];

      if (
        document.getElementById("masjid-logo").getAttribute("src") !== logoSrc
      ) {
        document.getElementById("masjid-logo").src = logoSrc;
        document.getElementById("masjid-logo-portrait").src = logoSrc;
      }

      updateRunningText();

      lastDay = -1;
      slowTick();
    });
  }

  function updateRunningText() {
    if (config.running_text && config.running_text !== lastRunningText) {
      if (els.marquee) {
        els.marquee.innerHTML = config.running_text;
        lastRunningText = config.running_text;
      }
    }
  }

  function getHijriDate(dateObj, adjustment) {
    const adjustedDate = new Date(dateObj);
    adjustedDate.setDate(adjustedDate.getDate() + (adjustment || 0));

    const formatter = new Intl.DateTimeFormat(
      "en-US-u-ca-islamic-umalqura-nu-latn",
      {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      },
    );

    const parts = formatter.formatToParts(adjustedDate);

    const getVal = (type) => {
      const part = parts.find((p) => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };

    return {
      day: getVal("day"),
      month: getVal("month") - 1,
      year: getVal("year"),
    };
  }

  function calculatePrayerTimes(dateObj) {
    if (!window.adhan) return null;

    var coordinates = new adhan.Coordinates(config.latitude, config.longitude);
    var params = adhan.CalculationMethod.Singapore();
    params.madhab = adhan.Madhab.Shafi;

    var prayerTimes = new adhan.PrayerTimes(coordinates, dateObj, params);

    prayerTimes.fajr = addMinutes(
      prayerTimes.fajr,
      parseInt(config.tune_subuh) || 0,
    );
    prayerTimes.sunrise = addMinutes(
      prayerTimes.sunrise,
      parseInt(config.tune_shuruq) || 0,
    );
    prayerTimes.dhuhr = addMinutes(
      prayerTimes.dhuhr,
      parseInt(config.tune_dzuhur) || 0,
    );
    prayerTimes.asr = addMinutes(
      prayerTimes.asr,
      parseInt(config.tune_ashar) || 0,
    );
    prayerTimes.maghrib = addMinutes(
      prayerTimes.maghrib,
      parseInt(config.tune_maghrib) || 0,
    );
    prayerTimes.isha = addMinutes(
      prayerTimes.isha,
      parseInt(config.tune_isya) || 0,
    );

    els.times.subuh.innerHTML = formatTime(prayerTimes.fajr);
    els.times.shuruq.innerHTML = formatTime(prayerTimes.sunrise);
    els.times.dzuhur.innerHTML = formatTime(prayerTimes.dhuhr);
    els.times.ashar.innerHTML = formatTime(prayerTimes.asr);
    els.times.maghrib.innerHTML = formatTime(prayerTimes.maghrib);
    els.times.isya.innerHTML = formatTime(prayerTimes.isha);

    return prayerTimes;
  }

  function fastTick() {
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

    if (els.digital.clock) {
      var sStr = seconds < 10 ? "0" + seconds : seconds;
      var mStr = minutes < 10 ? "0" + minutes : minutes;
      var hStr = hours < 10 ? "0" + hours : hours;
      els.digital.clock.innerHTML = hStr + ":" + mStr + ":" + sStr;
    }

    if (currentPrayerData) {
      var next = currentPrayerData.nextPrayer(now);
      var isCountdownMode = false;
      var targetTime = null;

      if (next !== "none") {
        targetTime = currentPrayerData[next];
      } else {
        // Jika sudah lewat isya, target subuh besok (simplified)
        // Logic detail handled by adhan.js next day usually
        // Untuk sekarang biarkan standar
      }

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
        };

        if (mapRow[next]) mapRow[next].className = "schedule-item active";
        else if (next === "none")
          els.rows.subuh.className = "schedule-item active";

        lastActivePrayer = next;
      }
    }

    if (hours === 2 && minutes === 0 && seconds === 0) {
      window.location.reload();
    }
  }

  function slowTick() {
    var now = new Date();
    if (config.time_offset) now = new Date(now.getTime() + config.time_offset);

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
        var hData = getHijriDate(now, config.hijri_offset);
        els.digital.hijri.innerHTML =
          hData.day + " " + monthsHijri[hData.month] + " " + hData.year + " H";
      }
    }
  }

  createNumbers();
  fetchSettings();

  setInterval(fastTick, 1000);
  setInterval(slowTick, 60000);
  setInterval(fetchSettings, 300000);

  fastTick();
  slowTick();
})();
