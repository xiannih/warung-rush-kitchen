/* Warung Kilat v5 — staff system: loyalty, retention, raises, poaching.
   Loyalty is a real number that moves for real reasons and changes how
   fast and how well an employee works. Low loyalty slows them down,
   causes mistakes, and can end in a resignation. */
'use strict';

function staffDef(id) {
  for (var i = 0; i < STAFF_DEFS.length; i++) if (STAFF_DEFS[i].id === id) return STAFF_DEFS[i];
  return null;
}

function newStaffState(id) {
  var d = staffDef(id);
  return {
    id: id, hired: false, level: 1, loyalty: 70, wage: d.baseWage,
    daysWorked: 0, daysSinceRaise: 0, praiseToday: 0, offTomorrow: false,
    resting: false, storyStage: 0, quitCount: 0, lastReason: 'Baru bergabung'
  };
}

function StaffSystem() {
  this.members = {};
  for (var i = 0; i < STAFF_DEFS.length; i++) this.members[STAFF_DEFS[i].id] = newStaffState(STAFF_DEFS[i].id);
  this.log = [];
}

StaffSystem.prototype.fairWage = function (st) {
  var d = staffDef(st.id);
  return Math.round(d.baseWage * (1 + 0.3 * (st.level - 1)) / 1000) * 1000;
};

StaffSystem.prototype.hireCost = function (st) {
  var d = staffDef(st.id);
  return Math.round(d.hireCost * (1 + 0.5 * st.quitCount));
};

StaffSystem.prototype.moodOf = function (st) {
  if (!st.hired) return { face: '💤', word: 'Belum direkrut' };
  if (st.resting) return { face: '😴', word: 'Libur' };
  if (st.loyalty >= 75) return { face: '😍', word: 'Semangat!' };
  if (st.loyalty >= 55) return { face: '😊', word: 'Senang' };
  if (st.loyalty >= 40) return { face: '😐', word: 'Biasa saja' };
  if (st.loyalty >= 20) return { face: '😟', word: 'Tidak puas' };
  return { face: '😠', word: 'Mau berhenti!' };
};

/* Effect strength 0..1: resting or unhired = 0, low loyalty = half. */
StaffSystem.prototype.effectPower = function (st) {
  if (!st.hired || st.resting) return 0;
  if (st.loyalty < 40) return 0.5;
  return 1;
};

StaffSystem.prototype.cookSpeed = function () {
  var st = this.members.joko;
  return 1 + 0.20 * st.level * this.effectPower(st);
};
StaffSystem.prototype.patienceBoost = function () {
  var st = this.members.sari;
  return 1 + 0.25 * st.level * this.effectPower(st);
};
StaffSystem.prototype.tipBoost = function () {
  var st = this.members.dewi;
  return 1 + 0.20 * st.level * this.effectPower(st);
};

/* Chance a step runs slow because a tired, unhappy cook fumbles it. */
StaffSystem.prototype.mistakeChance = function () {
  var st = this.members.joko;
  if (!st.hired || st.resting) return 0;
  if (st.loyalty < 40) return 0.25;
  if (st.loyalty < 55) return 0.08;
  return 0;
};

StaffSystem.prototype.hiredList = function () {
  var out = [];
  for (var i = 0; i < STAFF_DEFS.length; i++) {
    var st = this.members[STAFF_DEFS[i].id];
    if (st.hired) out.push(st);
  }
  return out;
};

StaffSystem.prototype.totalWages = function () {
  var sum = 0, list = this.hiredList();
  for (var i = 0; i < list.length; i++) sum += list[i].wage;
  return sum;
};

StaffSystem.prototype.bump = function (st, delta, reason) {
  st.loyalty = Math.max(0, Math.min(100, st.loyalty + delta));
  st.lastReason = reason;
  this.log.push(staffDef(st.id).name + ': ' + (delta >= 0 ? '+' : '') + delta + ' — ' + reason);
  if (this.log.length > 12) this.log.shift();
};

/* --- Management actions (all cost something or are limited) --- */
StaffSystem.prototype.praise = function (id) {
  var st = this.members[id];
  if (!st.hired || st.resting) return 'Tidak bisa dipuji sekarang.';
  if (st.praiseToday >= 2) return 'Pujian hari ini sudah habis (2/hari).';
  st.praiseToday++;
  this.bump(st, 5, 'dipuji bos');
  return '👍 ' + staffDef(id).name + ' tersenyum. Loyalitas +5.';
};
StaffSystem.prototype.bonus = function (id, money) {
  var st = this.members[id];
  if (!st.hired) return 'Belum direkrut.';
  if (money < 20000) return 'Uang tidak cukup untuk bonus Rp20.000.';
  this.bump(st, 12, 'dapat bonus Rp20.000');
  return '🎁 Bonus Rp20.000 untuk ' + staffDef(id).name + '. Loyalitas +12.';
};
StaffSystem.prototype.giveDayOff = function (id) {
  var st = this.members[id];
  if (!st.hired) return 'Belum direkrut.';
  if (st.offTomorrow) return 'Sudah dijadwalkan libur besok.';
  st.offTomorrow = true;
  this.bump(st, 10, 'dijadwalkan libur besok');
  return '🌴 ' + staffDef(id).name + ' libur besok. Loyalitas +10.';
};
StaffSystem.prototype.raiseWage = function (id, money) {
  var st = this.members[id];
  if (!st.hired) return 'Belum direkrut.';
  if (money < 10000) return 'Uang tidak cukup untuk naik gaji.';
  st.wage += 10000;
  st.daysSinceRaise = 0;
  this.bump(st, 8, 'gaji naik Rp10.000');
  return '💰 Gaji ' + staffDef(id).name + ' naik jadi ' + rupiah(st.wage) + '. Loyalitas +8.';
};
StaffSystem.prototype.train = function (id, money) {
  var st = this.members[id];
  if (!st.hired) return 'Belum direkrut.';
  if (st.level >= 3) return staffDef(id).name + ' sudah level maksimal.';
  if (money < 80000) return 'Uang tidak cukup untuk latihan Rp80.000.';
  st.level++;
  this.bump(st, 5, 'naik ke level ' + st.level);
  return '📈 ' + staffDef(id).name + ' naik ke level ' + st.level + '. Loyalitas +5.';
};
StaffSystem.prototype.hire = function (id, money) {
  var st = this.members[id];
  if (st.hired) return 'Sudah bekerja di warung.';
  var cost = this.hireCost(st);
  if (money < cost) return 'Uang tidak cukup: butuh ' + rupiah(cost) + '.';
  st.hired = true;
  st.loyalty = 70;
  st.wage = staffDef(id).baseWage;
  st.daysSinceRaise = 0;
  st.lastReason = 'Baru bergabung — semangat!';
  return '🎉 ' + staffDef(id).name + ' bergabung! Loyalitas 70.';
};
StaffSystem.prototype.fire = function (id) {
  var st = this.members[id];
  if (!st.hired) return 'Belum direkrut.';
  st.hired = false;
  st.resting = false;
  st.lastReason = 'Dipeccat — pergi dengan kecewa';
  return '😔 ' + staffDef(id).name + ' dipecat dan pergi.';
};

/* --- End of day: loyalty moves for real reasons --- */
StaffSystem.prototype.applyDayEnd = function (stats) {
  var list = this.hiredList();
  for (var i = 0; i < list.length; i++) {
    var st = list[i];
    st.daysWorked++;
    st.daysSinceRaise++;
    st.praiseToday = 0;
    if (st.resting) { st.resting = false; this.bump(st, 4, 'kembali dari libur, segar'); continue; }
    if (stats.served >= 9) this.bump(st, -6, 'lelah setelah rush hour');
    else if (stats.served >= 6) this.bump(st, -3, 'hari yang sibuk');
    if (stats.walkouts >= 3) this.bump(st, -4, 'pelanggan pergi marah-marah');
    if (st.wage < this.fairWage(st)) this.bump(st, -8, 'gaji di bawah standar');
    if (stats.served >= 6 && st.loyalty >= 55) this.bump(st, 3, 'hari sukses, bangga');
    /* Story advances when treated well, stalls when neglected. */
    if (st.loyalty >= 70 && st.storyStage < 3 && st.daysWorked >= (st.storyStage + 1) * 2) st.storyStage++;
  }
};

/* --- Raise requests and poaching: events the player must answer --- */
StaffSystem.prototype.pendingRaise = function () {
  var list = this.hiredList();
  for (var i = 0; i < list.length; i++) {
    var st = list[i];
    if (st.loyalty <= 60 || st.daysSinceRaise >= 3) return st;
  }
  return null;
};
StaffSystem.prototype.raiseReason = function (st) {
  if (st.wage < this.fairWage(st)) return 'Gaji saya di bawah standar level ' + st.level + ', padahal kerja makin berat.';
  if (st.daysSinceRaise >= 3) return 'Gaji saya sudah ' + st.daysSinceRaise + ' hari tidak naik, sementara pesanan makin banyak.';
  return 'Saya kerja keras tiap hari. Saya pantas dapat lebih.';
};
StaffSystem.prototype.answerRaise = function (id, choice) {
  var st = this.members[id];
  var d = staffDef(id);
  if (choice === 'accept') {
    st.wage += 15000;
    st.daysSinceRaise = 0;
    this.bump(st, 15, 'permintaan gaji diterima');
    return '🤝 ' + d.name + ' tersenyum lebar. Gaji naik Rp15.000. Loyalitas +15.';
  }
  if (choice === 'negotiate') {
    st.wage += 7000;
    st.daysSinceRaise = 0;
    if (st.loyalty >= 45) {
      this.bump(st, 5, 'nego gaji diterima');
      return '🤝 ' + d.name + ' menerima nego Rp7.000. Loyalitas +5.';
    }
    this.bump(st, -5, 'nego gaji mengecewakan');
    return '😕 ' + d.name + ' kecewa dengan nego Rp7.000. Loyalitas -5.';
  }
  this.bump(st, -15, 'permintaan gaji ditolak');
  var msg = '😠 ' + d.name + ' kecewa berat. Loyalitas -15.';
  if (st.loyalty <= 0) msg += ' ' + this.quit(id, 'gaji ditolak');
  return msg;
};
StaffSystem.prototype.poachTarget = function (day) {
  if (day < 5) return null;
  var list = this.hiredList();
  for (var i = 0; i < list.length; i++) if (list[i].level >= 2) return list[i];
  return null;
};
StaffSystem.prototype.answerPoach = function (id, counter) {
  var st = this.members[id];
  var d = staffDef(id);
  if (counter) {
    this.bump(st, 10, 'tawaran Bang Jono ditandingi');
    return '🛡️ ' + d.name + ' memilih tetap di warung. Loyalitas +10.';
  }
  return this.quit(id, 'dibajak Bang Jono');
};
StaffSystem.prototype.quit = function (id, why) {
  var st = this.members[id];
  var d = staffDef(id);
  st.hired = false;
  st.resting = false;
  st.loyalty = 0;
  st.quitCount++;
  st.lastReason = 'Berhenti — ' + why;
  return '🚪 ' + d.name + ' BERHENTI! ' + why + '. Rekrut pengganti kini lebih mahal.';
};
StaffSystem.prototype.checkQuits = function () {
  var out = [];
  var list = this.hiredList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].loyalty <= 0) out.push(this.quit(list[i].id, 'loyalitas habis'));
  }
  return out;
};
