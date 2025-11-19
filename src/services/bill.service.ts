import { Injectable, Logger } from '@nestjs/common';
import { BillRepository } from '../repositories/bill.repository';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  constructor(private readonly billRepository: BillRepository) {}

  async getOrdersByUserId(userId: number) {
    this.logger.log(`Get orders for user: ${userId}`, 'BillService');
    const bills = await this.billRepository.findByUserId(userId);
    this.logger.log(
      `Found ${bills.length} orders for user: ${userId}`,
      'BillService',
    );
    return bills;
  }
}
