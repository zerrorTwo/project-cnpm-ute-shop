import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Lấy tất cả users với pagination
   */
  async getAllUsers(page: number = 1, limit: number = 10) {
    return this.userRepository.findAll(page, limit);
  }

  /**
   * Lấy user theo ID
   */
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Tìm kiếm users theo keyword
   */
  async searchUsers(keyword: string): Promise<User[]> {
    return this.userRepository.search(keyword);
  }

  /**
   * Cập nhật thông tin user
   */
  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  /**
   * Xóa user
   */
  async deleteUser(id: number): Promise<boolean> {
    return this.userRepository.delete(id);
  }

  /**
   * Đếm tổng số users
   */
  async countUsers(): Promise<number> {
    return this.userRepository.count();
  }

  /**
   * Lấy thống kê users theo tháng
   */
  async getUserStatsByMonth(): Promise<any[]> {
    return this.userRepository.getUserStatsByMonth();
  }

  /**
   * Lấy users đăng ký trong khoảng thời gian
   */
  async getUsersRegisteredBetween(
    startDate: Date,
    endDate: Date,
  ): Promise<User[]> {
    return this.userRepository.findUsersRegisteredBetween(startDate, endDate);
  }
}
