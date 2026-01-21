import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetAccessory } from './entities/pet-accessory.entity';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';
import { ChildLevel } from '../progress/entities/child-level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, PetAccessory, ChildProfile, ChildLevel]),
  ],
  controllers: [PetController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
