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

// ======= FUNGSI MENYIMPAN KE LOCALSTORAGE =======
function saveState() {
  localStorage.setItem(HABIT_KEY, JSON.stringify(habits));
  localStorage.setItem(FIN_KEY, JSON.stringify(finances));
}


// ======= RENDER HABIT LIST =======
function renderHabits() {
  habitList.innerHTML = ""; // Kosongkan daftar dulu

  if (habits.length === 0) {
    // Jika belum ada habit
    habitList.innerHTML = "<li>Belum ada habit. Tambahkan satu dulu!</li>";
    return;
  }

  // Tampilkan setiap habit
  habits.forEach(h => {
    const li = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = h.title;
    if (h.done) title.style.textDecoration = "line-through"; // Coret jika sudah selesai

    const doneBtn = document.createElement("button");
    doneBtn.textContent = h.done ? "Undo" : "Done";
    doneBtn.className = "small-btn";
    doneBtn.onclick = () => {
      h.done = !h.done;
      saveState();
      renderHabits();
      toast(h.done ? "Habit selesai 🎉" : "Habit dibuka kembali");
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Hapus";
    delBtn.className = "small-btn";
    delBtn.onclick = () => {
      habits = habits.filter(x => x.id !== h.id);
      saveState();
      renderHabits();
      toast("Habit dihapus");
    };

    li.append(title, doneBtn, delBtn);
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


// ======= MULAI (RENDER SAAT HALAMAN DIBUKA) =======
renderHabits();
renderFinances();
renderChart();


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
  a.download = "(waktu yg ditentukan).json";
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
      saveState();
      renderHabits();
      renderFinances();
      renderChart();

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

