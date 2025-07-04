import { Update, Start, Ctx, On, Action, Hears } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const text = ctx.message!["text"];

    if (text === 'Sahiy') {
      await this.botService.onRoleSelected(ctx);
    } else if (text === 'Sabrli') {
      await ctx.reply("📌 Sabrli bo'limi hali tayyor emas.");
    } else {
      await this.botService.onText(ctx);
    }
  }

  @Action('check_subscription')
  async onCheckSubscription(@Ctx() ctx: Context) {
    await this.botService.onCheckSubscription(ctx);
  }
}
