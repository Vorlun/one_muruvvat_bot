import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './model/bot.model';
import { BOT_NAME, CHANNEL_USERNAME } from '../app.constants';
import { InjectBot, On, Ctx } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

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
          keyboard: [[{ text: 'Sabrlilar' }, { text: 'Sahiylar' }]],
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
        // Kanalga obuna bo'lgan bo'lsa keyingi bosqichga o'tish (tugma chiqarmasdan)
        return this.nextStep(ctx);
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

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx: Context) {
    if ('data' in ctx.callbackQuery!) {
      const callbackData = ctx.callbackQuery?.data;

      if (callbackData === 'check_subscription') {
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
            await ctx.answerCbQuery("✅ A'zo bo'ldingiz!", {
              show_alert: false,
            });
            await ctx.deleteMessage(); // Inline tugmani o'chirib yuborish
            return this.nextStep(ctx);
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
      } else {
        await ctx.answerCbQuery("❌ Noma'lum tugma.", { show_alert: true });
      }
    }
  }

  // Keyingi bosqichga o'tishda ishlatiladi (placeholder)
  async nextStep(ctx: Context) {
    await ctx.reply(
      '✅ Kanalga obuna bo‘lish tasdiqlandi. Keyingi bosqichga o‘tdingiz.',
    );
    // Shu yerga keyingi qatorlarni davom ettirasiz
  }
}
