import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Tìm user theo email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  /**
   * Tìm user theo ID
   */
  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Tạo user mới
   */
  async create(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  /**
   * Cập nhật user
   */
  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Xóa user
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Tìm tất cả users với pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      select: ['id', 'email', 'fullName', 'role', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  /**
   * Tìm users theo điều kiện tùy chỉnh (raw query)
   */
  async findByCustomQuery(query: string, params: any[]): Promise<User[]> {
    return this.repository.query(query, params);
  }

  /**
   * Đếm tổng số users
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Query builder example - Tìm users đăng ký trong khoảng thời gian
   */
  async findUsersRegisteredBetween(
    startDate: Date,
    endDate: Date,
  ): Promise<User[]> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select(['user.id', 'user.email', 'user.fullName', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Raw SQL query example - Lấy thống kê users theo tháng
   */
  async getUserStatsByMonth(): Promise<any[]> {
    return this.repository.query(`
      SELECT 
        YEAR(createdAt) as year,
        MONTH(createdAt) as month,
        COUNT(*) as total
      FROM users
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY year DESC, month DESC
    `);
  }

  /**
   * Tìm kiếm users theo tên hoặc email
   */
  async search(keyword: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.email LIKE :keyword OR user.fullName LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.createdAt',
      ])
      .limit(20)
      .getMany();
  }

  async updatePassword(email: string, newPassword: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('User not found');

    user.password = newPassword;
    return this.repository.save(user);
  }

  async getNewUserByTime(startDate: Date, endDate: Date): Promise<User[]> {
    const result = await this.repository
      .createQueryBuilder('u')
      .where('u.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('u.createdAt', 'ASC')
      .getMany();

    return result;
  }
}
