window.onload = function () {
  loadData();
};

function loadData() {
  try {
    var name = localStorage.getItem("mosque_name");
    var address = localStorage.getItem("mosque_address");
    var running = localStorage.getItem("running_text");
    var lat = localStorage.getItem("latitude");
    var lng = localStorage.getItem("longitude");

    if (name) document.getElementById("mosque_name").value = name;
    if (address) document.getElementById("mosque_address").value = address;
    if (running) document.getElementById("running_text").value = running;
    if (lat) document.getElementById("latitude").value = lat;
    if (lng) document.getElementById("longitude").value = lng;

    // Helper function biar kodenya pendek
    function setVal(id, key) {
      var val = localStorage.getItem(key);
      // Default ke "0" jika null
      document.getElementById(id).value = val ? val : 0;
    }

    setVal("tune_subuh", "tune_subuh");
    setVal("tune_shuruq", "tune_shuruq");
    setVal("tune_dzuhur", "tune_dzuhur");
    setVal("tune_ashar", "tune_ashar");
    setVal("tune_maghrib", "tune_maghrib");
    setVal("tune_isya", "tune_isya");

    document.getElementById("countdown_duration").value =
      localStorage.getItem("countdown_duration") || 10;
  } catch (e) {
    alert("Warning: Akses LocalStorage bermasalah.");
  }
}

function saveAll() {
  var name = document.getElementById("mosque_name").value;
  var address = document.getElementById("mosque_address").value;
  var running = document.getElementById("running_text").value;
  var lat = document.getElementById("latitude").value;
  var lng = document.getElementById("longitude").value;
  var cd_duration = document.getElementById("countdown_duration").value || 10;

  if (lat === "" || lng === "") {
    alert("⚠️ Koordinat Latitude & Longitude WAJIB diisi!");
    return;
  }

  // Ambil value tune, default ke "0" jika kosong
  function getVal(id) {
    var val = document.getElementById(id).value;
    return val === "" ? "0" : val;
  }

  try {
    localStorage.setItem("mosque_name", name);
    localStorage.setItem("mosque_address", address);
    localStorage.setItem("running_text", running);
    localStorage.setItem("latitude", lat);
    localStorage.setItem("longitude", lng);

    localStorage.setItem("tune_subuh", getVal("tune_subuh"));
    localStorage.setItem("tune_shuruq", getVal("tune_shuruq"));
    localStorage.setItem("tune_dzuhur", getVal("tune_dzuhur"));
    localStorage.setItem("tune_ashar", getVal("tune_ashar"));
    localStorage.setItem("tune_maghrib", getVal("tune_maghrib"));
    localStorage.setItem("tune_isya", getVal("tune_isya"));

    localStorage.setItem("countdown_duration", cd_duration);

    alert("✅ Data Berhasil Disimpan!");
  } catch (e) {
    alert("❌ Gagal simpan! Error: " + e.message);
  }
}

function autoDetect() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        // Pembulatan 5 digit desimal agar rapi
        document.getElementById("latitude").value =
          position.coords.latitude.toFixed(5);
        document.getElementById("longitude").value =
          position.coords.longitude.toFixed(5);
        alert("Lokasi ditemukan!");
      },
      function (error) {
        alert("Gagal mendeteksi lokasi. Pastikan GPS aktif / Izin diberikan.");
      }
    );
  } else {
    alert("Browser ini tidak mendukung Geolocation.");
  }
}

function timeCalibration() {
  var inputTime = document.getElementById("manual_time").value;
  if (!inputTime) {
    alert("Isi format jam HH:MM");
    return;
  }

  // Support input manual tanpa time-picker (untuk browser lama)
  // User mungkin ngetik '14.30' atau '14:30'
  inputTime = inputTime.replace(".", ":");

  if (inputTime.indexOf(":") === -1) {
    alert("Format salah. Gunakan titik dua (:). Contoh 14:30");
    return;
  }

  var parts = inputTime.split(":");
  var hours = parseInt(parts[0]);
  var minutes = parseInt(parts[1]);

  var now = new Date();
  var currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  var inputTotalMinutes = hours * 60 + minutes;

  var diffMinutes = inputTotalMinutes - currentTotalMinutes;

  // Handle midnight crossing (beda hari)
  if (diffMinutes > 720) diffMinutes -= 1440;
  else if (diffMinutes < -720) diffMinutes += 1440;

  localStorage.setItem("time_offset", diffMinutes * 60 * 1000);
  alert("Sinkronisasi Berhasil! Offset: " + diffMinutes + " menit.");
}
