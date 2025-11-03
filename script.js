// ======= FUNGSI BANTUAN (UTILITY) =======
const qs = sel => document.querySelector(sel); // Mempermudah pemanggilan elemen
const formatRupiah = n => "Rp " + n.toLocaleString("id-ID"); // Format angka ke Rupiah


// Toast = popup kecil untuk notifikasi user
const toastEl = qs("#toast");
function toast(msg, ms = 1500) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), ms);
}


// ======= VARIABEL GLOBAL UNTUK TANGGAL AKTIF =======
let activeDate = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD


// ======= PENYIMPANAN DATA =======
// localStorage = menyimpan data agar tidak hilang saat halaman direfresh
const HABIT_KEY = "habits";
const FIN_KEY = "finances";

// Ambil data yang sudah tersimpan (kalau belum ada, pakai array kosong)
let habits = JSON.parse(localStorage.getItem(HABIT_KEY) || "[]");
let finances = JSON.parse(localStorage.getItem(FIN_KEY) || "[]");


// ======= ELEMENT HTML =======
const habitForm = qs("#habitForm");
const habitInput = qs("#habitInput");
const habitList = qs("#habitList");

const financeForm = qs("#financeForm");
const descInput = qs("#descInput");
const amountInput = qs("#amountInput");
const typeSelect = qs("#typeSelect");
const financeList = qs("#financeList");
const totalDisplay = qs("#totalDisplay");

// ======= AUTO SAVE / LOAD PER TANGGAL =======
function saveState() {
  localStorage.setItem(`habit_${activeDate}`, JSON.stringify(habits));
  localStorage.setItem(`finance_${activeDate}`, JSON.stringify(finances));
}

function loadState() {
  const savedHabits = localStorage.getItem(`habit_${activeDate}`);
  const savedFinances = localStorage.getItem(`finance_${activeDate}`);

  if (savedHabits || savedFinances) {
    habits = savedHabits ? JSON.parse(savedHabits) : [];
    finances = savedFinances ? JSON.parse(savedFinances) : [];
    toast(`📅 Data tanggal ${activeDate} dimuat.`);
  } else {
    habits = [];
    finances = [];
    toast(`🆕 Data baru untuk tanggal ${activeDate}.`);
  }

  renderHabits();
  renderFinances();
}

function checkDateChange() {
  const today = new Date().toISOString().split('T')[0];
  if (today !== activeDate) {
    activeDate = today;
    habits = [];
    finances = [];
    saveState();
    toast(`🔄 Tanggal baru ${activeDate}, data direset otomatis.`);
    renderHabits();
    renderFinances();
  }
}

// Cek perubahan tanggal setiap 1 menit
setInterval(checkDateChange, 60000);


function updateClock() {
  const now = new Date() ;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[now.getDay()];

  const date = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const time = now.toLocaleTimeString("id-ID", { hour12: false});

  document.getElementById("realtime-clock").innerText = `${dayName}, ${date} — ${time}`;
}

setInterval(updateClock, 1000);

updateClock();

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("update-popup");
  const closeBtn = document.getElementById("close-popup");

  // tampilkan popup
  popup.classList.add("show");

  // tombol tutup
  closeBtn.addEventListener("click", () => {
    popup.classList.remove("show");
  });

  // optional: tutup popup setelah 5 detik otomatis
  setTimeout(() => {
    popup.classList.remove("show");
  }, 10000);
});

// ======= RENDER HABIT LIST =======
function renderHabits() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    habitList.innerHTML = "<li>Belum ada habit. Tambahin dulu!</li>";
    return;
  }

  habits.forEach(h => {
    const li = document.createElement("li");
    li.classList.add("habit-item");

    // Kolom kiri — nama habit
    const title = document.createElement("span");
    title.className = "habit-title";
    title.textContent = h.title;

    // Kolom tengah — status (☐ / ✅)
    const status = document.createElement("span");
    status.className = "habit-status";
    status.textContent = h.done ? "✅" : "☐";
    status.onclick = () => {
      h.done = !h.done;
      saveState();
      renderHabits();
      toast(h.done ? "Habit selesai 🎉" : "Habit dibuka kembali");
    };

    // Kolom kanan — tombol hapus
    const delBtn = document.createElement("button");
    delBtn.textContent = "Hapus";
    delBtn.className = "small-btn";
    delBtn.onclick = () => {
      habits = habits.filter(x => x.id !== h.id);
      saveState();
      renderHabits();
      toast("Habit dihapus");
    };

    li.append(title, status, delBtn);
    habitList.appendChild(li);
  });
}


// ======= RENDER FINANCE LIST =======
function renderFinances() {
  financeList.innerHTML = "";

  if (finances.length === 0) {
    financeList.innerHTML = "<li>Belum ada transaksi.</li>";
    totalDisplay.textContent = "Rp 0";
    renderChart();
    return;
  }

  finances.slice().reverse().forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${t.desc}</span>
      <span style="color:${t.type === "expense" ? "salmon" : "lightgreen"}">
        ${t.type === "expense" ? "-" : "+"}${formatRupiah(t.amount)}
      </span>
    `;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Hapus";
    delBtn.className = "small-btn";
    delBtn.onclick = () => {
      finances = finances.filter(x => x.id !== t.id);
      saveState();
      renderFinances();
      toast("Transaksi dihapus");
    };

    li.appendChild(delBtn);
    financeList.appendChild(li);
  });

  updateTotal();
  renderChart();
}


// ======= HITUNG TOTAL SALDO =======
function updateTotal() {
  let total = 0;
  finances.forEach(t => {
    total += t.type === "expense" ? -t.amount : t.amount;
  });
  totalDisplay.textContent = formatRupiah(total);
}


// ======= EVENT FORM HABIT =======
habitForm.onsubmit = e => {
  e.preventDefault();
  const title = habitInput.value.trim();
  if (!title) return;
  habits.push({ id: Date.now(), title, done: false });
  habitInput.value = "";
  saveState();
  renderHabits();
  toast("Habit ditambahkan!");
};


// ======= EVENT FORM FINANCE =======
financeForm.onsubmit = e => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseInt(amountInput.value);
  const type = typeSelect.value;
  if (!desc || !amount) return toast("Isi semua kolom!");
  finances.push({ id: Date.now(), desc, amount, type });
  descInput.value = "";
  amountInput.value = "";
  saveState();
  renderFinances();
  toast("Transaksi dicatat!");
};



// ======= CHART.JS: PIE CHART KEUANGAN =======

// Variabel global untuk menyimpan instance chart (supaya bisa diupdate)
let financeChart;

// Fungsi untuk hitung total pemasukan & pengeluaran
function calculateTotals() {
  let totalIncome = 0;
  let totalExpense = 0;

  finances.forEach(t => {
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  return { totalIncome, totalExpense };
}

// Fungsi untuk menampilkan pie chart
function renderChart() {
  const ctx = document.getElementById("financeChart").getContext("2d");
  const { totalIncome, totalExpense } = calculateTotals();

  let data, colors, labelText;

  // === Kondisi jika belum ada data ===
  if (totalIncome === 0 && totalExpense === 0) {
    data = [1]; // isi 1 supaya pie tetap tampil
    colors = ["#3b82f6"]; // biru netral
    labelText = "Belum ada data";
  }
  // === Kondisi jika income dan expense sama ===
  else if (totalIncome === totalExpense) {
    data = [1]; // pie penuh
    colors = ["#3b82f6"]; // biru netral
    labelText = "Seimbang";
  }
  // === Income lebih besar ===
  else if (totalIncome > totalExpense) {
    const sisa = totalIncome - totalExpense;
    data = [totalExpense, sisa];
    colors = ["#ef4444", "#22c55e"]; // merah dan hijau
    labelText = "Uang Tersisa";
  }
  // === Expense lebih besar ===
  else {
    const minus = totalExpense - totalIncome;
    data = [totalIncome, minus];
    colors = ["#22c55e", "#ef4444"]; // hijau kecil (income), merah dominan
    labelText = "Pengeluaran Lebih Besar";
  }

  // Jika chart sudah ada, hapus dulu agar tidak tumpuk
  if (financeChart) financeChart.destroy();

  // Buat chart baru
  financeChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [labelText],
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff", // Biar tiap bagian ada pemisah putih tipis
          hoverOffset: 10, // Saat diarahkan kursor, sedikit membesar
        },
      ],
    },
    options: {
      responsive: true,
      animation: {
        duration: 800, // Durasi animasi saat update
        easing: "easeInOutCubic", // Gerakan halus lembut
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#ddd", // Warna teks legend
            font: {
              size: 14,
              family: "Poppins, sans-serif",
            },
          },
        },
      },
    },
  });
}



// ====== POPUP BANTUAN EXPORT/IMPORT ======
const helpBtn = document.getElementById("helpBtn"); // Tombol ❓
const helpModal = document.getElementById("helpModal"); // Modal
const closeBtn = helpModal.querySelector(".close-btn"); // Tombol X

// Saat tombol bantuan diklik
helpBtn.onclick = () => {
  helpModal.classList.remove("hidden"); // tampilkan modal
};

// Saat tombol X diklik
closeBtn.onclick = () => {
  helpModal.classList.add("hidden"); // sembunyikan modal
};

// Klik di luar modal untuk menutup
window.onclick = e => {
  if (e.target === helpModal) {
    helpModal.classList.add("hidden");
  }
};


// ======= FITUR EXPORT & IMPORT DATA =======

// Ambil elemen tombol dan input file
const exportBtn = qs("#exportBtn");
const importFile = qs("#importFile");

// ---- EXPORT DATA ----
exportBtn.onclick = () => {
  // Gabungkan semua data menjadi satu objek
  const data = {
    habits,
    finances,
  };

  // Ubah ke format JSON (teks)
  const json = JSON.stringify(data, null, 2); // null,2 = rapih dengan indentasi
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Buat elemen link untuk unduh otomatis
  const a = document.createElement("a");
  a.href = url;
  a.download = "(waktu yg kamu tentukan).json";
  a.click();
  toast("Data berhasil diexport 💾");
};

// ---- IMPORT DATA ----
importFile.onchange = event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);

      // Pastikan struktur data valid
      if (!imported.habits || !imported.finances) {
        toast("❌ File tidak valid!");
        return;
      }

      // Ganti data lama dengan data baru
      habits = imported.habits;
      finances = imported.finances;

      toast("Data berhasil diimport ✅");
    } catch {
      toast("⚠️ Terjadi kesalahan saat membaca file!");
    }
  };
  reader.readAsText(file);
};



// ======= FOOTER: TANGGAL UPDATE =======
const lastUpdateEl = document.getElementById("lastUpdate");
if (lastUpdateEl) {
  const now = new Date();
  const options = { day: "2-digit", month: "short", year: "numeric" };
  lastUpdateEl.textContent = now.toLocaleDateString("en-GB", options);
}


// ======= AUTO SAVE HABIT & FINANCE BERDASARKAN TANGGAL =======

// variabel tanggal aktif
let currentDate = new Date().toISOString().split("T")[0];

// fungsi untuk menyimpan data sesuai tanggal
function saveDataForDate(date, habits, finances) {
  const allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  allData[date] = { habits, finances };
  localStorage.setItem("dailyData", JSON.stringify(allData));
}

// fungsi untuk memuat data berdasarkan tanggal
function loadDataForDate(date) {
  const allData = JSON.parse(localStorage.getItem("dailyData")) || {};
  const data = allData[date] || { habits: [], finances: [] };

  habits = data.habits || [];
  finances = data.finances || [];

  renderHabits();
  renderFinances();
}

// fungsi auto-save setiap ada perubahan
function autoSave() {
  saveDataForDate(currentDate, habits, finances);
}

// pas input, klik tombol, atau ubah select — langsung auto save
document.addEventListener("input", autoSave);
document.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("small-btn") || // tombol hapus/done
    e.target.classList.contains("btn") ||        // tombol tambah data
    e.target.tagName === "SELECT"
  ) {
    setTimeout(autoSave, 200);
  }
});


// ======= KALENDER INTERAKTIF =======
const calendarBtn = document.getElementById("calendar-btn");
const calendarModal = document.getElementById("calendar-modal");
const closeCalendar = document.getElementById("close-calendar");
const monthYear = document.getElementById("month-year");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonth = document.getElementById("prev-month");
const nextMonth = document.getElementById("next-month");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// fungsi render kalender
function renderCalendar() {
  calendarGrid.innerHTML = "";
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  monthYear.textContent = new Date(currentYear, currentMonth).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // buat hari kosong sebelum tanggal 1
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendarGrid.appendChild(empty);
  }

  // buat hari kalender
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement("div");
    const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    dayEl.textContent = d;
    dayEl.classList.add("day");
    dayEl.dataset.date = fullDate;

    // highlight tanggal aktif
    if (fullDate === currentDate) {
      dayEl.style.background = "#1e90ff";
      dayEl.style.color = "#fff";
      dayEl.style.fontWeight = "bold";
    }

    // event klik tanggal
    dayEl.addEventListener("click", () => {
      if (fullDate === currentDate) return; // kalau klik tanggal yg sama, abaikan

      // Simpan dulu data tanggal lama
      autoSave();

      // ganti tanggal aktif
      currentDate = fullDate;

      // load data baru
      loadDataForDate(currentDate);

      // render ulang kalender biar highlight berpindah
      renderCalendar();

      // tampilkan notifikasi kecil (opsional)
      toast(`Data untuk ${d} ${monthYear.textContent} dimuat`);
    });

    calendarGrid.appendChild(dayEl);
  }
}

prevMonth.onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
};

nextMonth.onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
};

// tombol buka dan tutup kalender
calendarBtn.onclick = () => calendarModal.classList.remove("hidden");
closeCalendar.onclick = () => calendarModal.classList.add("hidden");

// pertama kali halaman dibuka
renderCalendar();
loadDataForDate(currentDate);
activeDate = selectedDate; // misalnya hasil klik kalender
loadState();



// ======= TOAST / NOTIFIKASI =======
function toast(message) {
  let toastBox = document.querySelector(".toast");
  if (!toastBox) {
    toastBox = document.createElement("div");
    toastBox.className = "toast";
    document.body.appendChild(toastBox);
  }

  toastBox.textContent = message;
  toastBox.classList.remove("hidden");

  // animasi fade-in
  toastBox.style.opacity = "1";
  toastBox.style.transform = "translateY(0)";

  // sembunyikan setelah 2.5 detik
  setTimeout(() => {
    toastBox.style.opacity = "0";
    toastBox.style.transform = "translateY(-20px)";
    setTimeout(() => toastBox.classList.add("hidden"), 300);
  }, 2500);
}


// ======= AUTO SAVE & LOAD BERDASARKAN TANGGAL =======

// Simpan data habit & finance ke localStorage sesuai tanggal aktif
function saveDataByDate() {
  localStorage.setItem(`habit_${activeDate}`, JSON.stringify(habits));
  localStorage.setItem(`finance_${activeDate}`, JSON.stringify(finances));
}

// Muat data habit & finance dari tanggal aktif
function loadDataByDate() {
  const savedHabits = localStorage.getItem(`habit_${activeDate}`);
  const savedFinances = localStorage.getItem(`finance_${activeDate}`);

  if (savedHabits || savedFinances) {
    habits = savedHabits ? JSON.parse(savedHabits) : [];
    finances = savedFinances ? JSON.parse(savedFinances) : [];
    toast(`📅 Data tanggal ${activeDate} dimuat.`);
  } else {
    // Jika belum ada data untuk tanggal ini
    habits = [];
    finances = [];
    toast(`🆕 Data baru untuk tanggal ${activeDate}.`);
  }

  renderHabits();
  renderFinances();
}

// Reset data saat tanggal baru belum ada
function resetDataByDate() {
  habits = [];
  finances = [];
  renderHabits();
  renderFinances();
}



let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // cegah dialog otomatis
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  installBtn.style.display = 'block'; // tampilkan tombol
});

document.getElementById('installBtn').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // munculkan dialog instalasi
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User choice:', outcome); // accepted / dismissed
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none'; // sembunyikan tombol
  }
});


// ======= MULAI (RENDER SAAT HALAMAN DIBUKA) =======
saveState();
renderHabits();
renderFinances();
renderChart();
loadState();
checkDateChange();
