import { UserController } from "./UserController.js";
import { ProductController } from "./ProductController.js";
import { CartController } from "./CartController.js";
import { OrderController } from "./OrderController.js";
import { CategoryController } from "./CategoryController.js";
import { ProductVariantController } from "./ProductVariantController.js";
import { ReviewController } from "./ReviewController.js";
import { WishlistController } from "./WishlistController.js";
import { AddressController } from "./AddressController.js";
import { ChatController } from "./ChatController.js";
import { ChatFeedbackController } from "./ChatFeedbackController.js";
import { RecommendationController } from "./RecommendationController.js";
import { SignalController } from "./SignalController.js";
import { AdminController } from "./AdminController.js";

const controllers = [
  UserController,
  ProductController,
  CartController,
  OrderController,
  CategoryController,
  ProductVariantController,
  ReviewController,
  WishlistController,
  AddressController,
  ChatController,
  ChatFeedbackController,
  RecommendationController,
  SignalController,
  AdminController,
];
export default controllers;
