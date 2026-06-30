import { Module } from '@nestjs/common';
import { CoachesController } from './coaches.controller';
import { ConsultController } from './consult.controller';

@Module({ controllers: [CoachesController, ConsultController] })
export class ConsultModule {}
