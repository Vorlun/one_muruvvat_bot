import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { Bot } from './model/bot.model';

@Module({
  imports: [SequelizeModule.forFeature([Bot])],
  controllers: [],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
