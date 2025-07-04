import { Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @Hears(['Sabrlilar', 'Sahiylar'])
  async onRole(@Ctx() ctx: Context) {
    await this.botService.onRoleSelected(ctx);
  }

}
