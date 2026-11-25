/**
 * NGƯỜI CANH BOT MAGENTX – chạy trên Google Apps Script (máy chủ Google), không phụ thuộc MacBook.
 *
 * Việc của người canh (thiết kế GĐ4 mục 6, Q1/Q6/Q8):
 *  1. Nhận "nhịp tim" bot gửi mỗi phút (doPost). Nhịp tim gồm: mã bí mật, giờ gửi, số việc đang chờ,
 *     tin chưa trả lời lâu nhất (phút). KHÔNG có dữ liệu khách.
 *  2. Cứ 5 phút kiểm tra một lần (kiemTraNhipTim). Hai lần liên tiếp không có nhịp tim mới trong 5 phút
 *     → gửi A4 cho quản trị (24/7, có chuông); trong giờ trực (8h–22h) gửi thêm S7 cho nhóm sale và
 *     từng người có "Nhận cảnh báo bot ngừng = Có". Mỗi lần ngừng chỉ gửi S7 một lần; ngừng từ đêm
 *     thì gửi S7 lúc 8h00. Nhắc lại A4 sau 30 phút, rồi mỗi 2 giờ.
 *  3. Bot có nhịp tim lại → gửi S8 cho nhóm sale (chỉ khi chính người canh đã gửi S7). A5 do bot gửi.
 *  4. Nhịp tim vẫn đến nhưng tin chưa trả lời lâu nhất > 10 phút hoặc hàng chờ tăng liên tục 3 lần
 *     → báo 🔴 "BOT CÒN CHẠY NHƯNG KHÔNG XỬ LÝ TIN" cho quản trị (tối đa 1 lần/giờ).
 *  5. Gửi tin bằng bot Telegram thứ hai "MagentX Canh". Token và mã bí mật nằm trong
 *     Script Properties (Cài đặt dự án → Thuộc tính tập lệnh), KHÔNG ghi vào Sheet hay code.
 *
 * Cài đặt: xem apps-script/README.md.
 */

// ---------- Cấu hình (đọc từ Script Properties) ----------
var PROPS = PropertiesService.getScriptProperties();
var TZ = 'Asia/Ho_Chi_Minh';

function cauHinh_() {
  var p = PROPS.getProperties();
  var thieu = ['HEARTBEAT_SECRET', 'CANH_BOT_TOKEN', 'ADMIN_CHAT_ID', 'SALE_GROUP_ID'].filter(function (k) {
    return !p[k];
  });
  if (thieu.length) throw new Error('Thiếu Script Properties: ' + thieu.join(', '));
  return {
    secret: p.HEARTBEAT_SECRET,
    token: p.CANH_BOT_TOKEN,
    adminChatId: p.ADMIN_CHAT_ID,
    saleGroupId: p.SALE_GROUP_ID,
    // Telegram ID của người có "Nhận cảnh báo bot ngừng = Có", cách nhau bằng dấu phẩy (tùy chọn)
    downtimeIds: (p.DOWNTIME_IDS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
    gioTrucBatDau: Number(p.STAFF_HOURS_START || 8),
    gioTrucKetThuc: Number(p.STAFF_HOURS_END || 22),
    nguongTreNhipTimPhut: 5,
    nguongTinChuaTraLoiPhut: Number(p.UNANSWERED_ALERT_MINUTES || 10),
  };
}

// ---------- 1. Nhận nhịp tim ----------
function doPost(e) {
  var cfg = cauHinh_();
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return traVe_('bad json', 400);
  }
  if (!body || body.secret !== cfg.secret) {
    // Sai mã → coi như không có gì, chỉ ghi nhật ký
    console.warn('Nhịp tim sai mã bí mật – bỏ qua');
    return traVe_('forbidden', 403);
  }
  var now = new Date();
  PROPS.setProperties({
    LAST_HEARTBEAT_AT: now.toISOString(),
    LAST_QUEUE_SIZE: String(body.queue_size == null ? '' : body.queue_size),
    LAST_UNANSWERED_MIN: String(body.oldest_unanswered_minutes == null ? '' : body.oldest_unanswered_minutes),
    HEARTBEAT_COUNT_TODAY: String(demNhipTimHomNay_(now) + 1),
  });
  return traVe_('ok', 200);
}

// Cho phép GET để kiểm tra nhanh địa chỉ đã triển khai (không lộ gì)
function doGet() {
  return traVe_('nguoi-canh ok', 200);
}

function traVe_(text, _status) {
  // Apps Script web app không đặt được mã HTTP; bot chỉ cần thấy 2xx và chữ "ok"
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

function demNhipTimHomNay_(now) {
  var key = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  if (PROPS.getProperty('HEARTBEAT_DAY') !== key) {
    PROPS.setProperties({ HEARTBEAT_DAY: key, HEARTBEAT_COUNT_TODAY: '0' });
    return 0;
  }
  return Number(PROPS.getProperty('HEARTBEAT_COUNT_TODAY') || 0);
}

// ---------- 2–4. Kiểm tra 5 phút/lần (trigger thời gian) ----------
function kiemTraNhipTim() {
  var cfg = cauHinh_();
  var now = new Date();
  var st = trangThai_();
  var last = PROPS.getProperty('LAST_HEARTBEAT_AT');
  var treMs = last ? now - new Date(last) : Infinity;
  var tre = treMs > cfg.nguongTreNhipTimPhut * 60 * 1000;

  if (tre) {
    st.missCount = (st.missCount || 0) + 1;
    if (st.missCount >= 2) {
      if (!st.downSince) st.downSince = last || now.toISOString();
      xuLyBotNgung_(cfg, st, now);
    }
  } else {
    st.missCount = 0;
    if (st.downSince) xuLyBotChayLai_(cfg, st, now);
    kiemTraKet_(cfg, st, now);
  }
  luuTrangThai_(st);
}

function xuLyBotNgung_(cfg, st, now) {
  var trongGioTruc = trongGioTruc_(cfg, now);
  var canNhacA4 = !st.lastA4At
    ? true
    : (!st.a4ReminderCount && now - new Date(st.lastA4At) >= 30 * 60 * 1000) ||
      (st.a4ReminderCount > 0 && now - new Date(st.lastA4At) >= 2 * 60 * 60 * 1000);

  // S7 cho nhóm sale: chỉ trong giờ trực, mỗi lần ngừng một lần. Gửi trước để biết điền dòng cuối A4.
  if (trongGioTruc && !st.sentS7) {
    var s7 = mauS7_(st.downSince);
    guiTelegram_(cfg.token, cfg.saleGroupId, s7, false);
    cfg.downtimeIds.forEach(function (id) { guiTelegram_(cfg.token, id, s7, false); });
    st.sentS7 = true;
    st.sentS7At = now.toISOString();
  }

  if (canNhacA4) {
    var dongCuoi = st.sentS7 ? 'Đã báo nhóm sale (trong giờ trực).' : 'Chưa báo nhóm sale (ngoài giờ trực).';
    guiTelegram_(cfg.token, cfg.adminChatId, mauA4_(st.downSince, dongCuoi), false);
    st.a4ReminderCount = st.lastA4At ? (st.a4ReminderCount || 0) + 1 : 0;
    st.lastA4At = now.toISOString();
  }
}

function xuLyBotChayLai_(cfg, st, now) {
  if (st.sentS7) {
    guiTelegram_(cfg.token, cfg.saleGroupId, mauS8_(now), !trongGioTruc_(cfg, now));
    cfg.downtimeIds.forEach(function (id) { guiTelegram_(cfg.token, id, mauS8_(now), false); });
  }
  // A5 (báo cáo khôi phục chi tiết) do bot chính gửi; người canh chỉ báo ngắn cho quản trị
  guiTelegram_(cfg.token, cfg.adminChatId, '🟢 Nhịp tim của bot đã trở lại lúc ' + gioVn_(now) + '.', true);
  st.downSince = null;
  st.sentS7 = false;
  st.sentS7At = null;
  st.lastA4At = null;
  st.a4ReminderCount = 0;
}

function kiemTraKet_(cfg, st, now) {
  var queue = Number(PROPS.getProperty('LAST_QUEUE_SIZE') || 0);
  var unanswered = PROPS.getProperty('LAST_UNANSWERED_MIN');
  var hist = (st.queueHistory || []).concat([queue]).slice(-3);
  st.queueHistory = hist;
  var tangLienTuc = hist.length === 3 && hist[0] < hist[1] && hist[1] < hist[2] && hist[2] >= 5;
  var choQuaLau = unanswered !== '' && unanswered != null && Number(unanswered) > cfg.nguongTinChuaTraLoiPhut;
  if (!(tangLienTuc || choQuaLau)) return;
  if (st.lastStuckAlertAt && now - new Date(st.lastStuckAlertAt) < 60 * 60 * 1000) return;
  var tin =
    '🔴 BOT CÒN CHẠY NHƯNG KHÔNG XỬ LÝ TIN\n' +
    'Việc đang chờ: ' + queue + (tangLienTuc ? ' (tăng liên tục)' : '') + '\n' +
    'Tin chưa trả lời lâu nhất: ' + (unanswered === '' ? 'không rõ' : unanswered + ' phút') + '\n' +
    'Kiểm tra: ứng dụng bot có báo lỗi? Database còn chạy?';
  guiTelegram_(cfg.token, cfg.adminChatId, tin, false);
  st.lastStuckAlertAt = now.toISOString();
}

// ---------- Mẫu tin (GĐ4 mục 3, 4) ----------
function mauA4_(downSinceIso, dongCuoi) {
  return (
    '🔴 BOT NGỪNG TRẢ LỜI từ khoảng ' + gioVn_(new Date(downSinceIso)) + '\n' +
    'Không nhận được nhịp tim của bot đã 5 phút.\n' +
    'Kiểm tra: MacBook còn bật? Còn mạng? Ứng dụng bot còn chạy?\n' +
    dongCuoi
  );
}

function mauS7_(downSinceIso) {
  return (
    '🔴 BOT ĐANG NGỪNG – sale trực inbox giúp\n' +
    'Ngừng từ: khoảng ' + gioVn_(new Date(downSinceIso)) + '\n' +
    'Khách vẫn nhắn được bình thường. Sale trả lời tay trên Pancake.\n' +
    'Bot chạy lại sẽ báo trong nhóm này.'
  );
}

function mauS8_(now) {
  return (
    '🟢 BOT ĐÃ CHẠY LẠI lúc ' + Utilities.formatDate(now, TZ, 'HH:mm') + ' – bot tiếp quản inbox\n' +
    'Hội thoại sale đã trả lời tay: bot không chen vào (dừng 24 giờ).\n' +
    'Muốn trả khách cho bot: gắn tag "Trả cho bot".'
  );
}

// ---------- Tiện ích ----------
function gioVn_(d) {
  return Utilities.formatDate(d, TZ, 'HH:mm dd/MM');
}

function trongGioTruc_(cfg, now) {
  var h = Number(Utilities.formatDate(now, TZ, 'H'));
  return h >= cfg.gioTrucBatDau && h < cfg.gioTrucKetThuc;
}

function trangThai_() {
  try {
    return JSON.parse(PROPS.getProperty('STATE') || '{}');
  } catch (e) {
    return {};
  }
}

function luuTrangThai_(st) {
  PROPS.setProperty('STATE', JSON.stringify(st));
}

/** Gửi tin Telegram (chữ thường, không định dạng → không cần làm sạch ký tự). */
function guiTelegram_(token, chatId, text, silent) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, disable_notification: !!silent }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    console.error('Telegram từ chối tin tới ' + chatId + ': ' + res.getContentText().slice(0, 200));
  }
}

// ---------- Hàm chạy tay một lần (từ trình soạn thảo Apps Script) ----------

/** Tạo lịch kiểm tra 5 phút/lần. Chạy MỘT lần sau khi dán code và điền Script Properties. */
function caiDatLichKiemTra() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'kiemTraNhipTim') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('kiemTraNhipTim').timeBased().everyMinutes(5).create();
  console.log('Đã đặt lịch kiemTraNhipTim mỗi 5 phút.');
}

/** In ra chat_id của những ai vừa nhắn cho bot "MagentX Canh" (nhóm sale, quản trị) để điền Script Properties. */
function layChatId() {
  var token = PROPS.getProperty('CANH_BOT_TOKEN');
  if (!token) throw new Error('Chưa có CANH_BOT_TOKEN trong Script Properties');
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true });
  var data = JSON.parse(res.getContentText());
  var seen = {};
  (data.result || []).forEach(function (u) {
    var m = u.message || u.my_chat_member && u.my_chat_member.chat && { chat: u.my_chat_member.chat };
    if (m && m.chat) seen[m.chat.id] = (m.chat.title || (m.chat.first_name || '') + ' ' + (m.chat.last_name || '')).trim() + ' (' + m.chat.type + ')';
  });
  Object.keys(seen).forEach(function (id) { console.log('chat_id ' + id + ' = ' + seen[id]); });
  if (!Object.keys(seen).length) console.log('Chưa thấy tin nào. Hãy nhắn "xin chào" cho bot MagentX Canh (và trong nhóm sale) rồi chạy lại.');
}

/** Gửi một tin thử tới quản trị để kiểm tra token và chat_id. */
function thuGuiTin() {
  var cfg = cauHinh_();
  guiTelegram_(cfg.token, cfg.adminChatId, '🟢 Người canh MagentX đã nối được Telegram (tin thử).', false);
  console.log('Đã gửi tin thử tới quản trị.');
}

/** Xem trạng thái hiện tại (chạy tay khi cần). */
function xemTrangThai() {
  console.log(JSON.stringify({
    lastHeartbeatAt: PROPS.getProperty('LAST_HEARTBEAT_AT'),
    heartbeatCountToday: PROPS.getProperty('HEARTBEAT_COUNT_TODAY'),
    lastQueueSize: PROPS.getProperty('LAST_QUEUE_SIZE'),
    state: trangThai_(),
  }, null, 2));
}
