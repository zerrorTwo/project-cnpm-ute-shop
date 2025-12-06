import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CartRepository } from 'src/repositories/cart.repository';
import { ProductRepository } from 'src/repositories/product.repository';
import { CartResponseDto, CartItemResponseDto } from 'src/dtos/cart.dto';
import { Cart } from 'src/entities/cart.entity';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * Lấy giỏ hàng của user
   */
  async getCart(userId: number): Promise<CartResponseDto> {
    this.logger.log(`Get cart: userId=${userId}`);

    const cart = await this.cartRepository.findOrCreateCart(userId);

    // Reload cart với relations đầy đủ
    const fullCart = await this.cartRepository.findByUserId(userId);

    return this.formatCartResponse(fullCart);
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartResponseDto> {
    this.logger.log(
      `Add to cart: userId=${userId}, productId=${productId}, quantity=${quantity}`,
    );

    // Kiểm tra input
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    // Kiểm tra product tồn tại
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Kiểm tra tồn kho
    if (product.quantityStock < quantity) {
      throw new BadRequestException(
        `Không đủ hàng. Chỉ còn ${product.quantityStock} sản phẩm`,
      );
    }

    // Tìm hoặc tạo cart
    const cart = await this.cartRepository.findOrCreateCart(userId);

    // Thêm hoặc cập nhật cart item
    await this.cartRepository.addOrUpdateCartItem(cart.id, productId, quantity);

    // Lấy lại cart với relations đầy đủ
    const updatedCart = await this.cartRepository.findByUserId(userId);

    this.logger.log(`Added to cart successfully: userId=${userId}`);

    return this.formatCartResponse(updatedCart);
  }

  /**
   * Cập nhật số lượng cart item
   */
  async updateCartItemQuantity(
    userId: number,
    cartItemId: number,
    quantity: number,
  ): Promise<CartResponseDto> {
    this.logger.log(
      `Update cart item: userId=${userId}, cartItemId=${cartItemId}, quantity=${quantity}`,
    );

    // Tìm cart item và kiểm tra ownership
    const cartItem =
      await this.cartRepository.findCartItemById(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item không tồn tại');
    }

    if (cartItem.cart.customer.id !== userId) {
      throw new BadRequestException('Bạn không có quyền cập nhật item này');
    }

    // Kiểm tra tồn kho
    const product = await this.productRepository.findById(
      cartItem.product.id,
    );
    if (product && product.quantityStock < quantity) {
      throw new BadRequestException(
        `Không đủ hàng. Chỉ còn ${product.quantityStock} sản phẩm`,
      );
    }

    // Cập nhật quantity
    await this.cartRepository.updateCartItemQuantity(cartItemId, quantity);

    // Lấy lại cart với relations đầy đủ
    const updatedCart = await this.cartRepository.findByUserId(userId);

    this.logger.log(`Updated cart item successfully: userId=${userId}`);

    return this.formatCartResponse(updatedCart);
  }

  /**
   * Xóa cart item
   */
  async removeCartItem(
    userId: number,
    cartItemId: number,
  ): Promise<CartResponseDto> {
    this.logger.log(
      `Remove cart item: userId=${userId}, cartItemId=${cartItemId}`,
    );

    // Tìm cart item và kiểm tra ownership
    const cartItem =
      await this.cartRepository.findCartItemById(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item không tồn tại');
    }

    if (cartItem.cart.customer.id !== userId) {
      throw new BadRequestException('Bạn không có quyền xóa item này');
    }

    // Xóa cart item
    await this.cartRepository.removeCartItem(cartItemId);

    // Lấy lại cart với relations đầy đủ
    const updatedCart = await this.cartRepository.findByUserId(userId);

    this.logger.log(`Removed cart item successfully: userId=${userId}`);

    return this.formatCartResponse(updatedCart); 
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(userId: number): Promise<CartResponseDto> {
    this.logger.log(`Clear cart: userId=${userId}`);

    const cart = await this.cartRepository.findByUserId(userId);
    if (cart) {
      await this.cartRepository.clearCart(cart.id);
    }

    // Lấy lại cart (sẽ trống)
    const emptyCart = await this.cartRepository.findOrCreateCart(userId);
    const fullCart = await this.cartRepository.findByUserId(userId);

    this.logger.log(`Cleared cart successfully: userId=${userId}`);

    return this.formatCartResponse(fullCart);
  }

  /**
   * Format cart response với tính toán totals
   */
  private formatCartResponse(cart: Cart | null): CartResponseDto {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return {
        id: cart?.id || 0,
        items: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
    }

    // Format cart items
    const items: CartItemResponseDto[] = cart.cartItems.map((item) => {
      const basePrice = item.product.unitPrice;
      const discount = item.product.discountDetail?.percentage || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const itemTotal = finalPrice * item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          productName: item.product.productName,
          slug: item.product.slug,
          unitPrice: item.product.unitPrice,
          quantityStock: item.product.quantityStock,
          images: item.product.images || [],
          discountDetail: item.product.discountDetail
            ? {
                percentage: item.product.discountDetail.percentage,
              }
            : undefined,
        },
        itemTotal,
      };
    });

    // Tính toán totals
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const shipping = subtotal > 500000 ? 0 : 30000; // Free ship trên 500k
    const tax = subtotal * 0.1; // VAT 10%
    const total = subtotal + shipping + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items,
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
    };
  }
}
