import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [CommunityController],
  providers: [AiService],
})
export class CommunityModule {}
