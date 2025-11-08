import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Controllers from '.';
import Services from 'src/services';
import Repositories from 'src/repositories';
import { User } from 'src/entities/user.entity';
import { AuthService } from 'src/services/auth.service';
import { AuthGuard } from 'src/utils/auth/auth.guard';
import { MailModule } from 'src/mail/mail.module'; 
@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [...Controllers],
  providers: [...Services, ...Repositories, AuthService, AuthGuard],
})
export class ClientModule {}
