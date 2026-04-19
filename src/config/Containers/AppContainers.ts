import { Container } from "typedi";

// Repositories
import { DeviceTokenRepository } from '../../adapters/repositories/deviceToken/DeviceTokenRepository.js';
import { NotificationRepository } from '../../adapters/repositories/notification/NotificationRepository.js';
import { ReportRepository } from '../../adapters/repositories/report/ReportRepository.js';
import { UserRepository } from '../../adapters/repositories/user/UserRepository.js';
import { ProductRepository } from '../../adapters/repositories/product/ProductRepository.js';
import { CartRepository } from '../../adapters/repositories/cart/CartRepository.js';
import { OrderRepository } from '../../adapters/repositories/order/OrderRepository.js';
import { OrderStatusHistoryRepository } from '../../adapters/repositories/order/OrderStatusHistoryRepository.js';
import { CategoryRepository } from '../../adapters/repositories/category/CategoryRepository.js';
import { ProductVariantRepository } from '../../adapters/repositories/product/ProductVariantRepository.js';
import { ReviewRepository } from '../../adapters/repositories/review/ReviewRepository.js';
import { WishlistRepository } from '../../adapters/repositories/wishlist/WishlistRepository.js';
import { AddressRepository } from '../../adapters/repositories/address/AddressRepository.js';
import { TransactionManager } from '../../adapters/repositories/TransactionManager.js';

// Services
import { BcryptPasswordHasher } from '../../adapters/security/BcryptPasswordHasher.js';
import { LocalizationService } from '../../adapters/services/LocalizationService.js';
import { LoggerFactory } from '../../adapters/services/LoggerFactory.js';
import { BullMqEventEmitter } from '../../infrastructure/queue/BullMqEventEmitter.js';
import { FirebaseMessagingService } from '../../infrastructure/services/FirebaseMessagingService.js';
import { FirebaseStorageService } from '../../infrastructure/storage/FirebaseStorageService.js';
import { StripeService } from '../../infrastructure/services/StripeService.js';
import { EventRegistry } from '../../infrastructure/events/EventRegistry.js';
import { EventProcessor } from '../../infrastructure/events/EventProcessor.js';

// Product UseCases
import { GetProductUseCase } from '../../core/usecases/product/GetProductUseCase.js';
import { CreateProductUseCase } from '../../core/usecases/product/CreateProductUseCase.js';
import { ListProductsUseCase } from '../../core/usecases/product/ListProductsUseCase.js';
import { UpdateProductUseCase } from '../../core/usecases/product/UpdateProductUseCase.js';
import { DeleteProductUseCase } from '../../core/usecases/product/DeleteProductUseCase.js';

// Admin UseCases
import { ListUsersUseCase } from '../../core/usecases/admin/ListUsersUseCase.js';
import { GetChatHealthUseCase } from '../../core/usecases/admin/GetChatHealthUseCase.js';
import { GetUserActivityAnalyticsUseCase } from '../../core/usecases/admin/GetUserActivityAnalyticsUseCase.js';
import { GetUserGraphUseCase } from '../../core/usecases/admin/GetUserGraphUseCase.js';
import { UpdateUserRoleUseCase } from '../../core/usecases/admin/UpdateUserRoleUseCase.js';
import { SuspendUserUseCase } from '../../core/usecases/admin/SuspendUserUseCase.js';

// Cart UseCases
import { GetCartUseCase } from '../../core/usecases/cart/GetCartUseCase.js';
import { AddToCartUseCase } from '../../core/usecases/cart/AddToCartUseCase.js';
import { RemoveFromCartUseCase } from '../../core/usecases/cart/RemoveFromCartUseCase.js';
import { ClearCartUseCase } from '../../core/usecases/cart/ClearCartUseCase.js';

// Category UseCases
import { CreateCategoryUseCase } from '../../core/usecases/category/CreateCategoryUseCase.js';
import { GetCategoryUseCase } from '../../core/usecases/category/GetCategoryUseCase.js';
import { ListCategoriesUseCase } from '../../core/usecases/category/ListCategoriesUseCase.js';
import { GetCategoryTreeUseCase } from '../../core/usecases/category/GetCategoryTreeUseCase.js';
import { UpdateCategoryUseCase } from '../../core/usecases/category/UpdateCategoryUseCase.js';
import { DeleteCategoryUseCase } from '../../core/usecases/category/DeleteCategoryUseCase.js';

// Order UseCases
import { CheckoutUseCase } from '../../core/usecases/order/CheckoutUseCase.js';
import { UpdateOrderStatusUseCase } from '../../core/usecases/order/UpdateOrderStatusUseCase.js';
import { GetOrderStatusHistoryUseCase } from '../../core/usecases/order/GetOrderStatusHistoryUseCase.js';

// Variant UseCases
import { CreateProductVariantUseCase } from '../../core/usecases/product/variant/CreateProductVariantUseCase.js';
import { GetProductVariantUseCase } from '../../core/usecases/product/variant/GetProductVariantUseCase.js';
import { ListProductVariantsUseCase } from '../../core/usecases/product/variant/ListProductVariantsUseCase.js';
import { UpdateProductVariantUseCase } from '../../core/usecases/product/variant/UpdateProductVariantUseCase.js';
import { DeleteProductVariantUseCase } from '../../core/usecases/product/variant/DeleteProductVariantUseCase.js';

// Review UseCases
import { AddReviewUseCase } from '../../core/usecases/review/AddReviewUseCase.js';
import { ListProductReviewsUseCase } from '../../core/usecases/review/ListProductReviewsUseCase.js';
import { DeleteReviewUseCase } from '../../core/usecases/review/DeleteReviewUseCase.js';
import { ApproveReviewUseCase } from '../../core/usecases/review/ApproveReviewUseCase.js';

// Wishlist UseCases
import { GetWishlistUseCase } from '../../core/usecases/wishlist/GetWishlistUseCase.js';
import { AddItemToWishlistUseCase } from '../../core/usecases/wishlist/AddItemToWishlistUseCase.js';
import { RemoveItemFromWishlistUseCase } from '../../core/usecases/wishlist/RemoveItemFromWishlistUseCase.js';

// Address UseCases
import { AddAddressUseCase } from '../../core/usecases/address/AddAddressUseCase.js';
import { GetAddressUseCase } from '../../core/usecases/address/GetAddressUseCase.js';
import { ListUserAddressesUseCase } from '../../core/usecases/address/ListUserAddressesUseCase.js';
import { UpdateAddressUseCase } from '../../core/usecases/address/UpdateAddressUseCase.js';
import { DeleteAddressUseCase } from '../../core/usecases/address/DeleteAddressUseCase.js';

// User UseCases
import { GetMeUseCase } from '../../core/usecases/user/GetMeUseCase.js';
import { GetPublicProfileUseCase } from '../../core/usecases/user/GetPublicProfileUseCase.js';
import { UpdateProfileUseCase } from '../../core/usecases/user/UpdateProfileUseCase.js';
import { DeleteAccountUseCase } from '../../core/usecases/user/DeleteAccountUseCase.js';

// â”€â”€â”€ Repositories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Container.set('IUserRepository', Container.get(UserRepository));
Container.set('IReportRepository', Container.get(ReportRepository));
Container.set('INotificationRepository', Container.get(NotificationRepository));
Container.set('IDeviceTokenRepository', Container.get(DeviceTokenRepository));
Container.set('IProductRepository', Container.get(ProductRepository));
Container.set('ICartRepository', Container.get(CartRepository));
Container.set('IOrderRepository', Container.get(OrderRepository));
Container.set('IOrderStatusHistoryRepository', Container.get(OrderStatusHistoryRepository));
Container.set('ICategoryRepository', Container.get(CategoryRepository));
Container.set('IProductVariantRepository', Container.get(ProductVariantRepository));
Container.set('IReviewRepository', Container.get(ReviewRepository));
Container.set('IWishlistRepository', Container.get(WishlistRepository));
Container.set('IAddressRepository', Container.get(AddressRepository));

// â”€â”€â”€ Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Container.set('IPasswordHasher', Container.get(BcryptPasswordHasher));
Container.set('INotificationSender', Container.get(FirebaseMessagingService));
Container.set('IStorageService', Container.get(FirebaseStorageService));
Container.set('ILocalizationService', Container.get(LocalizationService));
Container.set('ILoggerFactory', Container.get(LoggerFactory));
Container.set('IEventEmitter', Container.get(BullMqEventEmitter));
Container.set('IPaymentService', Container.get(StripeService));
Container.set('IEventRegistry', Container.get(EventRegistry));
Container.set('EventProcessor', Container.get(EventProcessor));
Container.set('ITransactionManager', Container.get(TransactionManager));

// â”€â”€â”€ Handles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const productRepo = Container.get('IProductRepository') as any;
const categoryRepo = Container.get('ICategoryRepository') as any;
const cartRepo = Container.get('ICartRepository') as any;
const orderRepo = Container.get('IOrderRepository') as any;
const orderStatusRepo = Container.get('IOrderStatusHistoryRepository') as any;
const variantRepo = Container.get('IProductVariantRepository') as any;
const reviewRepo = Container.get('IReviewRepository') as any;
const wishlistRepo = Container.get('IWishlistRepository') as any;
const addressRepo = Container.get('IAddressRepository') as any;
const userRepo = Container.get('IUserRepository') as any;
const eventEmitter = Container.get('IEventEmitter') as any;
const paymentService = Container.get('IPaymentService') as any;
const transactionManager = Container.get('ITransactionManager') as any;

// â”€â”€â”€ Use Cases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Product
Container.set('IGetProductUseCase', new GetProductUseCase(productRepo));
Container.set('ICreateProductUseCase', new CreateProductUseCase(productRepo));
Container.set('IListProductsUseCase', new ListProductsUseCase(productRepo));
Container.set('IUpdateProductUseCase', new UpdateProductUseCase(productRepo));
Container.set('IDeleteProductUseCase', new DeleteProductUseCase(productRepo));

// Admin
Container.set('IListUsersUseCase', new ListUsersUseCase(userRepo));
Container.set('IGetChatHealthUseCase', new GetChatHealthUseCase());
Container.set('IUpdateUserRoleUseCase', new UpdateUserRoleUseCase(userRepo));
Container.set('ISuspendUserUseCase', new SuspendUserUseCase(userRepo));
Container.set('IGetUserActivityAnalyticsUseCase', new GetUserActivityAnalyticsUseCase());
Container.set('IGetUserGraphUseCase', new GetUserGraphUseCase());

// Category
Container.set('ICreateCategoryUseCase', new CreateCategoryUseCase(categoryRepo));
Container.set('IGetCategoryUseCase', new GetCategoryUseCase(categoryRepo));
Container.set('IListCategoriesUseCase', new ListCategoriesUseCase(categoryRepo));
Container.set('IGetCategoryTreeUseCase', new GetCategoryTreeUseCase(categoryRepo));
Container.set('IUpdateCategoryUseCase', new UpdateCategoryUseCase(categoryRepo));
Container.set('IDeleteCategoryUseCase', new DeleteCategoryUseCase(categoryRepo));

// Cart
Container.set('IGetCartUseCase', new GetCartUseCase(cartRepo));
Container.set('IAddToCartUseCase', new AddToCartUseCase(cartRepo, productRepo));
Container.set('IRemoveFromCartUseCase', new RemoveFromCartUseCase(cartRepo));
Container.set('IClearCartUseCase', new ClearCartUseCase(cartRepo));

// Order
Container.set('ICheckoutUseCase', new CheckoutUseCase(
  cartRepo,
  productRepo,
  orderRepo,
  variantRepo,
  paymentService,
  eventEmitter,
  transactionManager
));
Container.set('IUpdateOrderStatusUseCase', new UpdateOrderStatusUseCase(orderRepo, orderStatusRepo));
Container.set('IGetOrderStatusHistoryUseCase', new GetOrderStatusHistoryUseCase(orderStatusRepo));

// Variant
Container.set('ICreateProductVariantUseCase', new CreateProductVariantUseCase(variantRepo, productRepo));
Container.set('IGetProductVariantUseCase', new GetProductVariantUseCase(variantRepo));
Container.set('IListProductVariantsUseCase', new ListProductVariantsUseCase(variantRepo));
Container.set('IUpdateProductVariantUseCase', new UpdateProductVariantUseCase(variantRepo, eventEmitter));
Container.set('IDeleteProductVariantUseCase', new DeleteProductVariantUseCase(variantRepo));

// Review
Container.set('IAddReviewUseCase', new AddReviewUseCase(reviewRepo, productRepo, eventEmitter));
Container.set('IListProductReviewsUseCase', new ListProductReviewsUseCase(reviewRepo));
Container.set('IDeleteReviewUseCase', new DeleteReviewUseCase(reviewRepo, productRepo));
Container.set('IApproveReviewUseCase', new ApproveReviewUseCase(reviewRepo, eventEmitter));

// Wishlist
const getWishlistUseCase = new GetWishlistUseCase(wishlistRepo);
Container.set('IGetWishlistUseCase', getWishlistUseCase);
Container.set('IAddItemToWishlistUseCase', new AddItemToWishlistUseCase(wishlistRepo, productRepo, getWishlistUseCase));
Container.set('IRemoveItemFromWishlistUseCase', new RemoveItemFromWishlistUseCase(wishlistRepo, getWishlistUseCase));

// Address
Container.set('IAddAddressUseCase', new AddAddressUseCase(addressRepo));
Container.set('IGetAddressUseCase', new GetAddressUseCase(addressRepo));
Container.set('IListUserAddressesUseCase', new ListUserAddressesUseCase(addressRepo));
Container.set('IUpdateAddressUseCase', new UpdateAddressUseCase(addressRepo));
Container.set('IDeleteAddressUseCase', new DeleteAddressUseCase(addressRepo));

// User
Container.set('IGetMeUseCase', new GetMeUseCase(userRepo));
Container.set('IGetPublicProfileUseCase', new GetPublicProfileUseCase(userRepo));
Container.set('IUpdateProfileUseCase', new UpdateProfileUseCase(userRepo));
Container.set('IDeleteAccountUseCase', new DeleteAccountUseCase(userRepo));

export default Container;

