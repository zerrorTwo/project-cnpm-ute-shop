import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VoucherRepository } from 'src/repositories/voucher.repository';
import { UserRepository } from 'src/repositories/user.repository';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  VoucherFilterDto,
} from 'src/dtos/voucher.dto';
import {
  Voucher,
  EVoucherStatus,
  EVoucherType,
} from 'src/entities/voucher.entity';
import { LessThan, MoreThan } from 'typeorm';

@Injectable()
export class VoucherService {
  constructor(
    private readonly voucherRepository: VoucherRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createVoucher(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Check if voucher code already exists
    const existingVoucher = await this.voucherRepository.findByCode(
      createVoucherDto.code,
    );
    if (existingVoucher) {
      throw new BadRequestException(
        `Voucher với mã ${createVoucherDto.code} đã tồn tại`,
      );
    }

    const voucher = new Voucher();
    voucher.code = createVoucherDto.code;
    voucher.type = createVoucherDto.type;
    voucher.value = createVoucherDto.value;
    voucher.maxDiscount = createVoucherDto.maxDiscount || null;
    voucher.minOrderValue = createVoucherDto.minOrderValue || 0;
    voucher.expiryDate = new Date(createVoucherDto.expiryDate);
    voucher.description = createVoucherDto.description || null;
    voucher.status = EVoucherStatus.ACTIVE;

    // If userId is provided, check if user exists and assign to voucher
    if (createVoucherDto.userId) {
      const user = await this.userRepository.findById(createVoucherDto.userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      voucher.user = user;
    }

    return await this.voucherRepository.save(voucher);
  }

  async getAllVouchers(filterDto: VoucherFilterDto): Promise<{
    vouchers: Voucher[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filterDto.status) {
      where.status = filterDto.status;
    }

    if (filterDto.type) {
      where.type = filterDto.type;
    }

    if (filterDto.userId) {
      where.user = { id: filterDto.userId };
    }

    const [vouchers, total] = await this.voucherRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      vouchers,
      total,
      page,
      limit,
    };
  }

  async getVoucherById(id: number): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    return voucher;
  }

  async updateVoucher(updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id: updateVoucherDto.id },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    // Check if updating code and new code already exists
    if (updateVoucherDto.code && updateVoucherDto.code !== voucher.code) {
      const existingVoucher = await this.voucherRepository.findByCode(
        updateVoucherDto.code,
      );
      if (existingVoucher) {
        throw new BadRequestException(
          `Voucher với mã ${updateVoucherDto.code} đã tồn tại`,
        );
      }
    }

    if (updateVoucherDto.code) voucher.code = updateVoucherDto.code;
    if (updateVoucherDto.type) voucher.type = updateVoucherDto.type;
    if (updateVoucherDto.value !== undefined)
      voucher.value = updateVoucherDto.value;
    if (updateVoucherDto.maxDiscount !== undefined)
      voucher.maxDiscount = updateVoucherDto.maxDiscount;
    if (updateVoucherDto.minOrderValue !== undefined)
      voucher.minOrderValue = updateVoucherDto.minOrderValue;
    if (updateVoucherDto.expiryDate)
      voucher.expiryDate = new Date(updateVoucherDto.expiryDate);
    if (updateVoucherDto.description !== undefined)
      voucher.description = updateVoucherDto.description;

    return await this.voucherRepository.save(voucher);
  }

  async deleteVoucher(id: number): Promise<void> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    await this.voucherRepository.remove(voucher);
  }

  async updateVoucherStatus(
    id: number,
    status: EVoucherStatus,
  ): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    voucher.status = status;
    return await this.voucherRepository.save(voucher);
  }

  async updateExpiredVouchers(): Promise<void> {
    const now = new Date();
    await this.voucherRepository.update(
      {
        expiryDate: LessThan(now),
        status: EVoucherStatus.ACTIVE,
      },
      {
        status: EVoucherStatus.EXPIRED,
      },
    );
  }

  async getVoucherStatistics(): Promise<{
    total: number;
    active: number;
    used: number;
    expired: number;
    byType: { percentage: number; fixed: number };
  }> {
    const total = await this.voucherRepository.count();
    const active = await this.voucherRepository.count({
      where: { status: EVoucherStatus.ACTIVE },
    });
    const used = await this.voucherRepository.count({
      where: { status: EVoucherStatus.USED },
    });
    const expired = await this.voucherRepository.count({
      where: { status: EVoucherStatus.EXPIRED },
    });

    const percentage = await this.voucherRepository.count({
      where: { type: EVoucherType.PERCENTAGE },
    });
    const fixed = await this.voucherRepository.count({
      where: { type: EVoucherType.FIXED },
    });

    return {
      total,
      active,
      used,
      expired,
      byType: { percentage, fixed },
    };
  }
  async getValidVouchersForClient(): Promise<Voucher[]> {
    const now = new Date();
    return await this.voucherRepository.find({
      where: {
        status: EVoucherStatus.ACTIVE,
        expiryDate: MoreThan(now),
      },
      order: {
        minOrderValue: 'ASC',
      },
    });
  }

  async applyVoucher(
    code: string,
    orderValue: number,
  ): Promise<{
    discountAmount: number;
    voucher: Voucher;
  }> {
    const voucher = await this.voucherRepository.findOne({
      where: { code },
    });

    if (!voucher) {
      throw new BadRequestException('Mã voucher không hợp lệ');
    }

    if (voucher.status !== EVoucherStatus.ACTIVE) {
      throw new BadRequestException('Voucher không khả dụng hoặc đã hết hạn');
    }

    if (voucher.expiryDate < new Date()) {
      throw new BadRequestException('Voucher đã hết hạn');
    }

    if (orderValue < voucher.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`,
      );
    }

    let discountAmount = 0;
    if (voucher.type === EVoucherType.FIXED) {
      discountAmount = voucher.value;
    } else {
      discountAmount = (orderValue * voucher.value) / 100;
      if (voucher.maxDiscount) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscount);
      }
    }

    return { discountAmount, voucher };
  }
}
