import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthPrescriptionDto } from './create-health-prescription.dto';

export class UpdateHealthPrescriptionDto extends PartialType(
  CreateHealthPrescriptionDto,
) {}
