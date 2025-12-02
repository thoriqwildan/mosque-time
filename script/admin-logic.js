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

    alert("✅ Data Berhasil Disimpan!");
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      alert("❌ Gagal simpan! Memori browser penuh. Hapus cache.");
    } else {
      alert("❌ Gagal simpan! Error: " + e.message);
    }
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
        alert(
          "Gagal mendeteksi lokasi. Pastikan GPS aktif atau input manual saja."
        );
      }
    );
  } else {
    alert("Browser ini tidak mendukung Geolocation.");
  }
}

function timeCalibration() {
  var inputTime = document.getElementById("manual_time").value;

  if (!inputTime) {
    alert("Isi format jam HH:MM (contoh: 14:30)");
    return;
  }

  if (inputTime.indexOf(":") === -1) {
    alert("Format salah! Gunakan titik dua (:), contoh 12:00");
    return;
  }

  var parts = inputTime.split(":");
  var hours = parseInt(parts[0]);
  var minutes = parseInt(parts[1]);

  var now = new Date();
  var currentHours = now.getHours();
  var currentMinutes = now.getMinutes();

  var inputTotalMinutes = hours * 60 + minutes;
  var systemTotalMinutes = currentHours * 60 + currentMinutes;

  var diffMinutes = inputTotalMinutes - systemTotalMinutes;

  if (diffMinutes > 720) {
    // User input pagi, sistem masih malam
    diffMinutes -= 1440;
  } else if (diffMinutes < -720) {
    // User input malam, sistem sudah pagi
    diffMinutes += 1440;
  }

  var offsetMillis = diffMinutes * 60 * 1000;

  localStorage.setItem("time_offset", offsetMillis);

  alert(
    "Sinkronisasi (Offset: " +
      diffMinutes +
      " menit). Refresh halaman utama jam."
  );
}
