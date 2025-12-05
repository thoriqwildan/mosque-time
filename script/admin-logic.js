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

    document.getElementById("tune_subuh").value =
      localStorage.getItem("tune_subuh") || 0;
    document.getElementById("tune_shuruq").value =
      localStorage.getItem("tune_shuruq") || 0;
    document.getElementById("tune_dzuhur").value =
      localStorage.getItem("tune_dzuhur") || 0;
    document.getElementById("tune_ashar").value =
      localStorage.getItem("tune_ashar") || 0;
    document.getElementById("tune_maghrib").value =
      localStorage.getItem("tune_maghrib") || 0;
    document.getElementById("tune_isya").value =
      localStorage.getItem("tune_isya") || 0;
  } catch (e) {
    alert("Warning: LocalStorage tidak jalan di browser ini!");
  }
}

function saveAll() {
  var name = document.getElementById("mosque_name").value;
  var address = document.getElementById("mosque_address").value;
  var running = document.getElementById("running_text").value;
  var lat = document.getElementById("latitude").value;
  var lng = document.getElementById("longitude").value;

  var t_subuh = document.getElementById("tune_subuh").value || 0;
  var t_shuruq = document.getElementById("tune_shuruq").value || 0;
  var t_dzuhur = document.getElementById("tune_dzuhur").value || 0;
  var t_ashar = document.getElementById("tune_ashar").value || 0;
  var t_maghrib = document.getElementById("tune_maghrib").value || 0;
  var t_isya = document.getElementById("tune_isya").value || 0;

  if (lat === "" || lng === "") {
    alert("⚠️ Koordinat Latitude & Longitude WAJIB diisi agar jadwal muncul!");
    return;
  }

  try {
    localStorage.setItem("mosque_name", name);
    localStorage.setItem("mosque_address", address);
    localStorage.setItem("running_text", running);
    localStorage.setItem("latitude", lat);
    localStorage.setItem("longitude", lng);

    localStorage.setItem("tune_subuh", t_subuh);
    localStorage.setItem("tune_shuruq", t_shuruq);
    localStorage.setItem("tune_dzuhur", t_dzuhur);
    localStorage.setItem("tune_ashar", t_ashar);
    localStorage.setItem("tune_maghrib", t_maghrib);
    localStorage.setItem("tune_isya", t_isya);

    alert("✅ Data Berhasil Disimpan!");
  } catch (e) {
    alert("❌ Gagal simpan! Error: " + e.message);
  }
}

function autoDetect() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        document.getElementById("latitude").value = position.coords.latitude;
        document.getElementById("longitude").value = position.coords.longitude;
        alert("Lokasi ditemukan!");
      },
      function (error) {
        alert("Gagal mendeteksi lokasi via GPS.");
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

  var parts = inputTime.split(":");
  var hours = parseInt(parts[0]);
  var minutes = parseInt(parts[1]);

  var now = new Date();
  var diffMinutes =
    hours * 60 + minutes - (now.getHours() * 60 + now.getMinutes());

  if (diffMinutes > 720) diffMinutes -= 1440;
  else if (diffMinutes < -720) diffMinutes += 1440;

  localStorage.setItem("time_offset", diffMinutes * 60 * 1000);
  alert("Sinkronisasi Berhasil! Offset: " + diffMinutes + " menit.");
}
