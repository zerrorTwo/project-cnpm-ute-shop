import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Services from 'src/services';
import Controllers from '.';
import Repositories from 'src/repositories';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [...Controllers],
  providers: [...Services, ...Repositories],
})
export class AdminModule {}
