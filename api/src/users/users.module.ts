import { Module } from '@nestjs/common';
import { AiService } from '../community/ai.service';
import { AccountDeletionController } from './account-deletion.controller';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController, AccountDeletionController],
  providers: [AiService],
})
export class UsersModule {}
