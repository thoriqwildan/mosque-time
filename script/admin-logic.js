window.onload = function () {
  loadDataFromServer();
};

function ajax(url, options, successCallback, errorCallback) {
  if (typeof options === "function") {
    errorCallback = successCallback;
    successCallback = options;
    options = null;
  }

  var xhr = new XMLHttpRequest();
  var method = (options && options.method) || "GET";
  xhr.open(method, url, true);

  if (options && options.headers) {
    for (var k in options.headers) {
      xhr.setRequestHeader(k, options.headers[k]);
    }
  }

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 400) {
        var response = xhr.responseText;
        try {
          response = JSON.parse(response);
        } catch (e) {}
        if (successCallback) successCallback(response);
      } else {
        if (errorCallback) errorCallback(xhr);
      }
    }
  };
  xhr.send(options && options.body ? options.body : null);
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

function loadDataFromServer() {
  ajax(
    "api.php?t=" + new Date().getTime(),
    function (data) {
      setValue("mosque_name", data.mosque_name);
      setValue("mosque_address", data.mosque_address);
      setValue("running_text", data.running_text);
      setValue("latitude", data.latitude);
      setValue("longitude", data.longitude);

      setValue("tune_subuh", data.tune_subuh);
      setValue("tune_shuruq", data.tune_shuruq);
      setValue("tune_dzuhur", data.tune_dzuhur);
      setValue("tune_ashar", data.tune_ashar);
      setValue("tune_maghrib", data.tune_maghrib);
      setValue("tune_isya", data.tune_isya);

      setValue("countdown_duration", data.countdown_duration);

      setValue("logo_index", data.logo_index || 0);
      setValue("hijri_offset", data.hijri_offset || 0);

      window.currentServerOffset = data.time_offset || 0;
      updateHijriPreview();
    },
    function (error) {
      console.error("Error:", error);
      alert("Gagal mengambil data dari board.");
    },
  );
}

function setValue(id, val) {
  if (document.getElementById(id)) {
    document.getElementById(id).value = val !== undefined ? val : "";
  }
}

function saveAll() {
  function cleanFloat(val) {
    if (!val) return 0;
    return val.toString().replace(",", ".");
  }

  var data = {
    mosque_name: document.getElementById("mosque_name").value,
    mosque_address: document.getElementById("mosque_address").value,
    running_text: document.getElementById("running_text").value,
    latitude: cleanFloat(document.getElementById("latitude").value),
    longitude: cleanFloat(document.getElementById("longitude").value),

    tune_subuh: document.getElementById("tune_subuh").value,
    tune_shuruq: document.getElementById("tune_shuruq").value,
    tune_dzuhur: document.getElementById("tune_dzuhur").value,
    tune_ashar: document.getElementById("tune_ashar").value,
    tune_maghrib: document.getElementById("tune_maghrib").value,
    tune_isya: document.getElementById("tune_isya").value,

    countdown_duration: document.getElementById("countdown_duration").value,

    time_offset: window.currentServerOffset || 0,

    logo_index: document.getElementById("logo_index").value,

    hijri_offset: document.getElementById("hijri_offset").value,
  };

  ajax(
    "api.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    function (result) {
      if (result.status === "success") {
        alert("✅ Data Berhasil Disimpan ke Board!");
      } else {
        alert("❌ Gagal: " + result.message);
      }
    },
    function (error) {
      alert("❌ Error koneksi ke server.");
    },
  );
}

function autoDetect() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        document.getElementById("latitude").value =
          position.coords.latitude.toFixed(5);
        document.getElementById("longitude").value =
          position.coords.longitude.toFixed(5);
        alert("Lokasi ditemukan! Jangan lupa klik Simpan.");
      },
      function (error) {
        alert("Gagal mendeteksi lokasi. Pastikan GPS aktif.");
      },
    );
  } else {
    alert("Browser tidak mendukung Geolocation.");
  }
}

function timeCalibration() {
  var inputTime = document.getElementById("manual_time").value;
  if (!inputTime) {
    alert("Isi jam dulu.");
    return;
  }

  inputTime = inputTime.replace(".", ":");
  var parts = inputTime.split(":");
  if (parts.length !== 2) return alert("Format salah");

  var now = new Date();
  var currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  var inputTotalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);

  var diffMinutes = inputTotalMinutes - currentTotalMinutes;

  if (diffMinutes > 720) diffMinutes -= 1440;
  else if (diffMinutes < -720) diffMinutes += 1440;

  var offsetMs = diffMinutes * 60 * 1000;
  window.currentServerOffset = offsetMs;

  alert(
    "Sinkronisasi dihitung! Offset: " +
      diffMinutes +
      " menit. \nKLIK 'SIMPAN SEMUA PENGATURAN' AGAR PERMANEN.",
  );
}

function updateHijriPreview() {
  var offset = parseInt(document.getElementById("hijri_offset").value) || 0;
  var hData = getHijriDate(new Date(), offset);

  var text =
    hData.day + " " + monthsHijri[hData.month] + " " + hData.year + " H";
  document.getElementById("hijri-preview").innerHTML = text;
}

function adjustHijri(amount) {
  var input = document.getElementById("hijri_offset");
  var current = parseInt(input.value) || 0;
  input.value = current + amount;
  updateHijriPreview();
}
