import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from 'src/entities/cart.entity';
import { CartItem } from 'src/entities/cart-item.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  /**
   * Tìm giỏ hàng của user với tất cả items và relations
   */
  async findByUserId(userId: number): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { customer: { id: userId } },
      relations: [
        'cartItems',
        'cartItems.product',
        'cartItems.product.images',
        'cartItems.product.discountDetail',
      ],
    });
  }

  /**
   * Tìm hoặc tạo giỏ hàng mới cho user
   */
  async findOrCreateCart(userId: number): Promise<Cart> {
    console.log('Finding cart for user:', userId);
    let cart = await this.findByUserId(userId);

    if (!cart) {
      console.log('Cart not found, creating new cart for user:', userId);
      // Tạo cart mới
      cart = this.cartRepository.create({
        customer: { id: userId },
        cartItems: [],
      });
      console.log('Saving new cart...');
      try {
        cart = await this.cartRepository.save(cart);
        console.log('Cart saved successfully:', cart.id);
      } catch (error) {
        console.error('Error saving cart:', error);
        throw error;
      }
    } else {
      console.log('Cart found:', cart.id);
    }

    return cart;
  }

  /**
   * Thêm hoặc cập nhật cart item
   */
  async addOrUpdateCartItem(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    // Tìm xem sản phẩm đã có trong giỏ chưa
    const existingItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
      },
      relations: ['product'],
    });

    if (existingItem) {
      // Cập nhật số lượng
      existingItem.quantity += quantity;
      return this.cartItemRepository.save(existingItem);
    } else {
      // Tạo cart item mới
      const newItem = this.cartItemRepository.create({
        cart: { id: cartId },
        product: { id: productId },
        quantity,
      });
      return this.cartItemRepository.save(newItem);
    }
  }

  /**
   * Cập nhật số lượng của cart item
   */
  async updateCartItemQuantity(
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem | null> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['product'],
    });

    if (!cartItem) {
      return null;
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }

  /**
   * Xóa cart item
   */
  async removeCartItem(cartItemId: number): Promise<boolean> {
    const result = await this.cartItemRepository.delete(cartItemId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Xóa tất cả items trong giỏ hàng
   */
  async clearCart(cartId: number): Promise<boolean> {
    const result = await this.cartItemRepository.delete({
      cart: { id: cartId },
    });
    return true;
  }

  /**
   * Tìm cart item theo id
   */
  async findCartItemById(cartItemId: number): Promise<CartItem | null> {
    return this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart', 'cart.customer', 'product'],
    });
  }
}
