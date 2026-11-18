const STORAGE_KEY = 'habitday.dashboard.v1';
const habitList = document.querySelector('#habitList');
const habitCount = document.querySelector('#habitCount');
const modal = document.querySelector('#habitDialog');
const habitForm = document.querySelector('#habitForm');
const nameInput = document.querySelector('#newHabitName');
const appStatus = document.querySelector('#appStatus');
const saveIndicator = document.querySelector('.save-indicator');
const dateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = new Date();
const todayKey = dateKey(today);
const fullDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const weekDayShort = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
const weekDayLong = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });
const selectedFilter = { value: 'all' };
const selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function createDefaultState() {
  return {
    habits: [
      { id: 'meditation', name: 'Meditasi pagi', category: 'Mindfulness', time: '07:00' },
      { id: 'water', name: 'Minum air putih', category: 'Kesehatan', time: '' },
      { id: 'reading', name: 'Membaca 20 halaman', category: 'Belajar', time: '18:00' },
      { id: 'walk', name: 'Jalan kaki sore', category: 'Kebugaran', time: '19:30' },
      { id: 'phone-free', name: 'Jauhkan ponsel sebelum tidur', category: 'Mindfulness', time: '22:00' }
    ],
    history: { [todayKey]: ['meditation', 'water'] }
  };
}

function loadState() {
  let stored;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Data Habitday tidak dapat dibaca dari penyimpanan lokal.', error);
    saveIndicator.textContent = 'Belum tersimpan';
    appStatus.textContent = 'Penyimpanan lokal tidak tersedia. Perubahan mungkin tidak tersimpan.';
    return createDefaultState();
  }
  if (!stored) return createDefaultState();

  try {
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.habits) || !parsed.history || typeof parsed.history !== 'object') {
      throw new TypeError('Struktur data tidak sesuai.');
    }
    return {
      habits: parsed.habits.filter(habit => habit && typeof habit.id === 'string' && typeof habit.name === 'string'),
      history: parsed.history
    };
  } catch (error) {
    console.error('Data Habitday tidak dapat dibaca; data awal digunakan.', error);
    saveIndicator.textContent = 'Belum tersimpan';
    appStatus.textContent = 'Data tersimpan tidak dapat dibaca. Daftar awal ditampilkan.';
    return createDefaultState();
  }
}

let state = loadState();

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function completedFor(key) {
  const ids = state.history[key];
  return new Set(Array.isArray(ids) ? ids : []);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveIndicator.innerHTML = '<i aria-hidden="true"></i> Tersimpan';
    return true;
  } catch (error) {
    console.error('Perubahan Habitday tidak dapat disimpan di perangkat ini.', error);
    saveIndicator.textContent = 'Belum tersimpan';
    appStatus.textContent = 'Perubahan tidak dapat disimpan di perangkat ini.';
    return false;
  }
}

function announce(message) {
  appStatus.textContent = '';
  window.requestAnimationFrame(() => { appStatus.textContent = message; });
}

function formatTime(value) {
  if (!value) return 'Fleksibel';
  return value.replace(':', '.');
}

function iconFor(category) {
  const icons = {
    Mindfulness: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    Kesehatan: '<path d="M12 3.5c2.6 3.4 5.5 6.1 5.5 10a5.5 5.5 0 1 1-11 0c0-3.9 2.9-6.6 5.5-10Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
    Belajar: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8"/>',
    Kebugaran: '<path d="M3.5 10v4M7 7.5v9M17 7.5v9M20.5 10v4M7 12h10"/>',
    Lainnya: '<path d="M12 3.5v17M3.5 12h17"/>'
  };
  const icon = icons[category] || icons.Lainnya;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
}

function getStreak() {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;
  while (completedFor(dateKey(cursor)).size > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function datesForWeek() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - 6 + index);
    return date;
  });
}

function renderStats() {
  const done = completedFor(todayKey);
  const habitIds = new Set(state.habits.map(habit => habit.id));
  const completedCount = [...done].filter(id => habitIds.has(id)).length;
  const total = state.habits.length;
  const percent = total ? Math.round(completedCount / total * 100) : 0;
  document.querySelector('#progressNumber').textContent = `${completedCount}/${total}`;
  document.querySelector('#progressPercent').textContent = `${percent}%`;
  document.querySelector('#progressTrack').setAttribute('aria-valuenow', String(percent));
  document.querySelector('#progressBar').style.width = `${percent}%`;
  document.querySelector('#progressCaption').textContent = total
    ? completedCount === total ? 'Semua kebiasaan hari ini selesai' : `${total - completedCount} kebiasaan menunggu diselesaikan`
    : 'Tambahkan kebiasaan untuk memulai';

  const streak = getStreak();
  document.querySelector('#streakNumber').textContent = String(streak);
  document.querySelector('#sidebarStreak').textContent = `${streak} ${streak === 1 ? 'hari' : 'hari'}`;

  const weekCount = datesForWeek().reduce((sum, date) => sum + completedFor(dateKey(date)).size, 0);
  document.querySelector('#weekNumber').textContent = String(weekCount);
  document.querySelector('#weekCaption').textContent = `Catatan ${weekCount ? 'aktivitas' : 'belum tersedia'} tujuh hari terakhir`;
  habitCount.textContent = String(total);
  document.querySelector('#habitSummary').textContent = total
    ? `${completedCount} dari ${total} kebiasaan selesai`
    : 'Daftar rutinitas untuk hari ini.';
}

function renderHabits() {
  const done = completedFor(todayKey);
  const visibleHabits = state.habits.filter(habit => {
    if (selectedFilter.value === 'pending') return !done.has(habit.id);
    if (selectedFilter.value === 'completed') return done.has(habit.id);
    return true;
  });
  habitList.innerHTML = visibleHabits.map(habit => {
    const isComplete = done.has(habit.id);
    const name = escapeHTML(habit.name);
    const category = escapeHTML(habit.category || 'Lainnya');
    const id = escapeHTML(habit.id);
    return `<article class="habit-row${isComplete ? ' is-complete' : ''}" data-habit-id="${id}">
      <button class="habit-check" type="button" data-action="toggle" aria-label="${isComplete ? 'Tandai kebiasaan ' + name + ' belum selesai' : 'Tandai kebiasaan ' + name + ' selesai'}" aria-pressed="${isComplete}">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 3 3 6-6"/></svg>
      </button>
      <span class="habit-icon">${iconFor(habit.category)}</span>
      <span class="habit-copy"><strong>${name}</strong><span>${category}</span></span>
      <time class="habit-time">${escapeHTML(formatTime(habit.time))}</time>
      <button class="delete-habit" type="button" data-action="delete" aria-label="Hapus kebiasaan ${name}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>
      </button>
    </article>`;
  }).join('');

  const emptyState = document.querySelector('#emptyState');
  emptyState.hidden = visibleHabits.length > 0;
  if (!state.habits.length) {
    document.querySelector('#emptyTitle').textContent = 'Belum ada kebiasaan';
    document.querySelector('#emptyDescription').textContent = 'Tambahkan rutinitas pertama untuk mengisi daftar ini.';
  } else {
    document.querySelector('#emptyTitle').textContent = 'Tidak ada kebiasaan di sini';
    document.querySelector('#emptyDescription').textContent = 'Coba filter lain untuk melihat daftar kebiasaan.';
  }
  document.querySelector('#emptyAddBtn').hidden = state.habits.length > 0;
  document.querySelector('#listFooter').textContent = state.habits.length
    ? 'Perubahan tersimpan di perangkat ini'
    : 'Daftar kebiasaanmu masih kosong';
}

function renderCalendar() {
  document.querySelector('#calendarMonth').textContent = monthFormat.format(calendarMonth);
  const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + daysInMonth) / 7) * 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const dates = Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  document.querySelector('#calendarDays').innerHTML = dates.map(date => {
    const key = dateKey(date);
    const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
    const isSelected = key === dateKey(selectedDate);
    const isToday = key === todayKey;
    const completions = completedFor(key).size;
    const dayLabel = `${weekDayLong.format(date)}, ${date.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)}`;
    const status = completions ? `, ${completions} kebiasaan selesai` : ', belum ada kebiasaan selesai';
    return `<button type="button" class="${isCurrentMonth ? '' : 'outside '}${isSelected ? 'selected ' : ''}${isToday ? 'today' : ''}" data-date="${key}" aria-label="${escapeHTML(dayLabel + status)}" aria-pressed="${isSelected}">
      ${date.getDate()}${completions ? '<span class="calendar-dot" aria-hidden="true"></span>' : ''}
    </button>`;
  }).join('');
  const selectedCount = completedFor(dateKey(selectedDate)).size;
  document.querySelector('#calendarSelected').innerHTML = `<strong>${escapeHTML(shortDate.format(selectedDate))}</strong> · ${selectedCount} kebiasaan selesai`;
}

function renderInsight() {
  const week = datesForWeek();
  const counts = week.map(date => completedFor(dateKey(date)).size);
  const peak = Math.max(...counts);
  const dayNames = week.map(date => weekDayShort.format(date).replace('.', ''));
  const activeIndex = counts.findIndex(count => count === peak && count > 0);
  document.querySelector('#insightCopy').textContent = peak
    ? `Aktivitas terbanyak tercatat pada ${weekDayLong.format(week[activeIndex])}.`
    : 'Selesaikan kebiasaan untuk mulai melihat ritmemu.';
  document.querySelector('#barChart').innerHTML = counts.map((count, index) => {
    const height = peak ? Math.max(8, Math.round(count / peak * 100)) : 5;
    return `<span class="bar-column${count === peak && count > 0 ? ' active' : ''}" aria-hidden="true"><span style="height:${height}%"></span></span>`;
  }).join('');
  document.querySelector('#chartLabels').innerHTML = dayNames.map(day => `<span>${escapeHTML(day)}</span>`).join('');
  document.querySelector('#barChart').setAttribute('aria-label', `Aktivitas tujuh hari terakhir: ${counts.join(', ')} kebiasaan selesai per hari`);
}

function renderHeader() {
  const hour = today.getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';
  document.querySelector('#pageTitle').textContent = greeting;
  document.querySelector('#welcomeDate').textContent = fullDate.format(today);
  document.querySelector('#topDate').textContent = fullDate.format(today);
  document.querySelector('#welcomeSubtitle').textContent = state.habits.length
    ? `${state.habits.length} kebiasaan terjadwal hari ini.`
    : 'Tambahkan rutinitas yang ingin kamu bangun.';
}

function render() {
  renderHeader();
  renderStats();
  renderHabits();
  renderCalendar();
  renderInsight();
}

function openDialog() {
  modal.showModal();
  window.setTimeout(() => nameInput.focus(), 0);
}

function changeMonth(offset) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  renderCalendar();
}

function setActiveNavigation() {
  const currentHash = window.location.hash || '#dashboard';
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(link => {
    const active = link.getAttribute('href') === currentHash;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

habitList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const row = button.closest('[data-habit-id]');
  const habit = state.habits.find(item => item.id === row?.dataset.habitId);
  if (!habit) return;

  if (button.dataset.action === 'toggle') {
    const done = completedFor(todayKey);
    if (done.has(habit.id)) done.delete(habit.id);
    else done.add(habit.id);
    state.history[todayKey] = [...done];
    saveState();
    render();
    announce(`${habit.name} ${done.has(habit.id) ? 'ditandai selesai' : 'ditandai belum selesai'}.`);
    return;
  }

  if (button.dataset.action === 'delete' && window.confirm(`Hapus kebiasaan "${habit.name}"?`)) {
    state.habits = state.habits.filter(item => item.id !== habit.id);
    Object.keys(state.history).forEach(key => {
      const entries = Array.isArray(state.history[key]) ? state.history[key] : [];
      state.history[key] = entries.filter(id => id !== habit.id);
    });
    saveState();
    render();
    announce(`${habit.name} dihapus.`);
  }
});

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    selectedFilter.value = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    renderHabits();
  });
});

document.querySelector('#addHabitBtn').addEventListener('click', openDialog);
document.querySelector('#emptyAddBtn').addEventListener('click', openDialog);
document.querySelector('#closeDialog').addEventListener('click', () => modal.close());
document.querySelector('#cancelDialog').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});

habitForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.setCustomValidity('Tulis nama kebiasaan terlebih dahulu.');
    nameInput.reportValidity();
    nameInput.addEventListener('input', () => nameInput.setCustomValidity(''), { once: true });
    return;
  }
  const id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `habit-${Date.now()}`;
  const habit = {
    id,
    name,
    category: document.querySelector('#newHabitCategory').value,
    time: document.querySelector('#newHabitTime').value
  };
  state.habits.push(habit);
  saveState();
  selectedFilter.value = 'all';
  document.querySelectorAll('.filter').forEach(button => {
    const active = button.dataset.filter === 'all';
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  habitForm.reset();
  modal.close();
  render();
  announce(`${habit.name} ditambahkan ke kebiasaan hari ini.`);
});

document.querySelector('#prevMonth').addEventListener('click', () => changeMonth(-1));
document.querySelector('#nextMonth').addEventListener('click', () => changeMonth(1));
document.querySelector('#calendarDays').addEventListener('click', event => {
  const button = event.target.closest('button[data-date]');
  if (!button) return;
  const [year, month, day] = button.dataset.date.split('-').map(Number);
  selectedDate.setFullYear(year, month - 1, day);
  if (selectedDate.getMonth() !== calendarMonth.getMonth() || selectedDate.getFullYear() !== calendarMonth.getFullYear()) {
    calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }
  renderCalendar();
});

window.addEventListener('hashchange', setActiveNavigation);
render();
setActiveNavigation();
