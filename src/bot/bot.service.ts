import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './model/bot.model';
import { BOT_NAME, CHANNEL_USERNAME } from '../app.constants';
import { InjectBot, Ctx } from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
  ) {}

  async start(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id) return ctx.reply('User ID aniqlanmadi.');

    await this.botModel.findOrCreate({
      where: { user_id },
      defaults: {
        user_id,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        username: ctx.from?.username,
        last_state: 'first_start',
      },
    });

    await ctx.reply(
      '<b>Assalomu alaykum!</b>\n\nBotdan kim sifatida foydalanishni tanlang:',
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [[{ text: 'Sabrli' }, { text: 'Sahiy' }]],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      },
    );
  }

  async onRoleSelected(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id) return ctx.reply('User ID aniqlanmadi.');

    try {
      const member = await ctx.telegram.getChatMember(
        CHANNEL_USERNAME,
        user_id,
      );

      if (['member', 'creator', 'administrator'].includes(member.status)) {
        return this.createSahiy(ctx);
      } else {
        await this.askToJoinChannel(ctx);
      }
    } catch {
      await this.askToJoinChannel(ctx);
    }
  }

  async askToJoinChannel(ctx: Context) {
    await ctx.reply(
      `⚠️ Botdan foydalanish uchun quyidagi kanalga a'zo bo'ling:\n\n${CHANNEL_USERNAME}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Kanalga o'tish",
                url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`,
              },
            ],
            [{ text: '🔄 Tekshirish', callback_data: 'check_subscription' }],
          ],
        },
      },
    );
  }

  async onCheckSubscription(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id) {
      await ctx.answerCbQuery('User ID aniqlanmadi.', { show_alert: true });
      return;
    }

    try {
      const member = await ctx.telegram.getChatMember(
        CHANNEL_USERNAME,
        user_id,
      );

      if (['member', 'creator', 'administrator'].includes(member.status)) {
        await ctx.answerCbQuery("✅ A'zo bo'ldingiz!", { show_alert: false });
        await ctx.deleteMessage();
        return this.createSahiy(ctx);
      } else {
        await ctx.answerCbQuery("❌ Siz hali kanalga a'zo emassiz.", {
          show_alert: true,
        });
      }
    } catch {
      await ctx.answerCbQuery("⚠️ Xatolik, qayta urinib ko'ring.", {
        show_alert: true,
      });
    }
  }

  async createSahiy(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) {
        return ctx.replyWithHTML('User ID aniqlanmadi.');
      }

      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        return ctx.replyWithHTML(
          'Iltimos, botni ishga tushirish uchun <b>/start</b> tugmasini bosing.',
          { parse_mode: 'HTML' },
        );
      }

      if (user.last_state === 'sahiy_finish') {
        return this.sahiyPage(ctx);
      }

      user.last_state = 'sahiy_fullname';
      await user.save();

      await ctx.replyWithHTML(
        "🙌 Sahiy sifatida ro'yxatdan o'tish uchun to'liq ismingizni yuboring:",
      );
    } catch (error) {
      console.error('Error in createSahiy:', error);
    }
  }

  async sahiyPage(ctx: Context) {
    try {
      await ctx.replyWithHTML(
        "<b>🙌 Sahiy sahifasiga xush kelibsiz!</b>\n\nKerakli bo'limni tanlang:",
        {
          reply_markup: {
            keyboard: [
              [
                { text: '🤝 Muruvvat qilish' },
                { text: "👀 Sabrlilarni ko'rish" },
              ],
              [
                { text: "📞 Admin bilan bog'lanish" },
                { text: '⚙️ Sozlamalar' },
              ],
              [{ text: 'Asosiy menu' }],
            ],
            resize_keyboard: true,
          },
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      console.error('Error in sahiyPage:', error);
    }
  }

  async onText(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) return;

      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        return ctx.replyWithHTML('Iltimos, <b>/start</b> tugmasini bosing.', {
          parse_mode: 'HTML',
        });
      }

      if (!(ctx.message && 'text' in ctx.message)) return;
      const messageText = ctx.message.text;

      if (messageText === 'Asosiy menu') {
        return this.sendMainMenu(ctx);
      }

      switch (user.last_state) {
        case 'sahiy_fullname':
          user.first_name = messageText;
          user.last_state = 'sahiy_phone';
          await user.save();
          await ctx.replyWithHTML(
            '📱 Telefon raqamingizni yuboring (masalan: +998901234567):',
          );
          break;

        case 'sahiy_phone':
          user.phone_number = messageText;
          user.last_state = 'sahiy_location';
          await user.save();
          await ctx.replyWithHTML(
            "📍 Ixtiyoriy: Joylashuvingizni yuborishingiz mumkin yoki o'tkazib yuboring:",
            {
              reply_markup: {
                keyboard: [
                  [{ text: '📍 Joylashuvni yuborish', request_location: true }],
                  [{ text: "⏭ O'tkazib yuborish" }],
                ],
                resize_keyboard: true,
              },
            },
          );
          break;

        case 'sahiy_location':
          if (messageText === "⏭ O'tkazib yuborish") {
            user.last_state = 'sahiy_finish';
            await user.save();
            await ctx.replyWithHTML("✅ Sahiy sifatida ro'yxatdan o'tdingiz!", {
              reply_markup: { remove_keyboard: true },
            });
            await this.sahiyPage(ctx);
          }
          break;

        case 'sabrli_fullname':
          user.first_name = messageText;
          user.last_state = 'sabrli_phone';
          await user.save();
          await ctx.replyWithHTML(
            '📱 Telefon raqamingizni yuboring (masalan: +998901234567):',
          );
          break;

        case 'sabrli_phone':
          user.phone_number = messageText;
          user.last_state = 'sabrli_region';
          await user.save();
          await ctx.replyWithHTML(
            '🏙 Viloyatni yuboring (masalan: Toshkent viloyati):',
          );
          break;

        case 'sabrli_region':
          user.region = messageText;
          user.last_state = 'sabrli_district';
          await user.save();
          await ctx.replyWithHTML(
            '🏘 Tumaningizni yuboring (masalan: Chirchiq tumani):',
          );
          break;

        case 'sabrli_district':
          user.district = messageText;
          user.last_state = 'sabrli_finish';
          await user.save();
          await ctx.replyWithHTML(
            "✅ Sabrli sifatida ro'yxatdan o'tdingiz va endi Sabrli sahifasiga o'tdingiz!",
            { reply_markup: { remove_keyboard: true } },
          );
          await this.sabrliPage(ctx);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error in onText:', error);
    }
  }

  async onLocation(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id || !('location' in ctx.message!)) return;

      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        return ctx.replyWithHTML('Iltimos, <b>/start</b> tugmasini bosing.', {
          parse_mode: 'HTML',
        });
      }

      if (user.last_state === 'sahiy_location') {
        const { latitude, longitude } = ctx.message.location!;
        user.location = `${latitude}|${longitude}`;
        user.last_state = 'sahiy_finish';
        await user.save();

        await ctx.replyWithHTML(
          "✅ Joylashuvingiz saqlandi va Sahiy sifatida ro'yxatdan o'tdingiz!",
          { reply_markup: { remove_keyboard: true } },
        );

        await this.sahiyPage(ctx);
      }
    } catch (error) {
      console.error('Error in onLocation:', error);
    }
  }

  async createSabrli(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) {
        return ctx.replyWithHTML('User ID aniqlanmadi.');
      }

      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        return ctx.replyWithHTML(
          'Iltimos, botni ishga tushirish uchun <b>/start</b> tugmasini bosing.',
          { parse_mode: 'HTML' },
        );
      }

      if (user.last_state === 'sabrli_finish') {
        return this.sabrliPage(ctx);
      }

      user.last_state = 'sabrli_fullname';
      user.role = 'patient';
      await user.save();

      await ctx.replyWithHTML(
        "🙌 Sabrli sifatida ro'yxatdan o'tish uchun to'liq ismingizni yuboring:",
      );
    } catch (error) {
      console.error('Error in createSabrli:', error);
    }
  }

  async sabrliPage(ctx: Context) {
    try {
      await ctx.replyWithHTML(
        "<b>🙌 Sabrli sahifasiga xush kelibsiz!</b>\n\nKerakli bo'limni tanlang:",
        {
          reply_markup: {
            keyboard: [
              [{ text: '📨 Murojaat yuborish' }],
              [{ text: "📞 Admin bilan bog'lanish" },
              { text: '⚙️ Sozlamalar' }],
              [{ text: 'Asosiy menu' }],
            ],
            resize_keyboard: true,
          },
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      console.error('Error in sabrliPage:', error);
    }
  }
  async sendMainMenu(ctx: Context) {
    await ctx.replyWithHTML(
      '<b>Asosiy menu</b>\n\nBotdan kim sifatida foydalanishni tanlang:',
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [[{ text: 'Sabrli' }, { text: 'Sahiy' }]],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      },
    );
  }
}
