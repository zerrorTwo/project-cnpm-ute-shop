import { IsEnum, IsNotEmpty } from 'class-validator';
import { EBillStatus } from '../../entities/bill.entity';

export class UpdateBillStatusDto {
  @IsNotEmpty()
  @IsEnum(EBillStatus)
  status: EBillStatus;
}
