import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeederService } from './seeder.service';
import { User } from '../modules/auth/entities/user.entity';
import { PetModule } from '../modules/pet/pet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    forwardRef(() => PetModule),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
