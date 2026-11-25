// Bot Telegram chính – GĐ5 tối thiểu: long polling (bot tự hỏi Telegram, không nhận webhook),
// /start trả Telegram ID, chỉ trả lời quản trị, người lạ im lặng, 1 nút để thử "thông báo nhỏ" (B1).
// Lệnh thật (/tatbot, /batbot, /trangthai, /baocao, /huongdan) làm ở GĐ6.
import { Bot, InlineKeyboard } from 'grammy';
import type { Logger } from 'pino';

export interface TelegramBotOptions {
  token: string;
  /** Chưa đặt → chế độ cài đặt: /start trả ID cho bất kỳ ai để chủ dự án lấy ID của mình. */
  adminId?: number;
  log: Logger;
}

const CALLBACK_TEST_BUTTON = 'thu:nut';

export function createTelegramBot(opts: TelegramBotOptions): Bot {
  const bot = new Bot(opts.token);
  const isAdmin = (id: number | undefined): boolean =>
    opts.adminId !== undefined && id === opts.adminId;

  bot.command('start', async (ctx) => {
    const id = ctx.from?.id;
    if (opts.adminId === undefined) {
      await ctx.reply(
        `Telegram ID của bạn: ${id}\n\nĐiền số này vào TELEGRAM_ADMIN_ID trong file .env rồi khởi động lại bot. Sau đó bot chỉ trả lời ID này.`,
      );
      return;
    }
    if (!isAdmin(id)) {
      opts.log.info({ telegramId: id }, 'Người lạ gửi /start – không trả lời');
      return;
    }
    await ctx.reply(
      '🟢 Bot MagentX (GĐ5 – bộ khung) đang chạy.\nLệnh thử: /thunut – gửi một nút để thử thông báo nhỏ.',
    );
  });

  bot.command('thunut', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    await ctx.reply('Bấm nút bên dưới trên điện thoại, một thông báo nhỏ sẽ hiện ở đầu màn hình:', {
      reply_markup: new InlineKeyboard().text('✅ Thử nút', CALLBACK_TEST_BUTTON),
    });
  });

  bot.on('callback_query:data', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: 'Bạn không có quyền.' });
      return;
    }
    if (ctx.callbackQuery.data === CALLBACK_TEST_BUTTON) {
      await ctx.answerCallbackQuery({ text: 'Đã nhận ✅ Thông báo nhỏ hoạt động.' });
      return;
    }
    await ctx.answerCallbackQuery();
  });

  // Mọi tin khác từ người lạ: im lặng, chỉ ghi nhật ký
  bot.on('message', (ctx) => {
    if (!isAdmin(ctx.from.id))
      opts.log.debug({ telegramId: ctx.from.id }, 'Tin từ người lạ – bỏ qua');
  });

  bot.catch((err) => opts.log.error({ err: err.error }, 'Bot Telegram gặp lỗi'));
  return bot;
}
