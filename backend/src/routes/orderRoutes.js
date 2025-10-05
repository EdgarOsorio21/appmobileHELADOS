import { Router } from "express";
import { body, param } from "express-validator";
import {
  checkout,
  listAllOrders,
  listMyOrders,
  updateOrderStatusController,
} from "../controllers/orderController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/checkout", authenticate, checkout);
router.get("/mine", authenticate, listMyOrders);

router.get("/", authenticate, requireAdmin, listAllOrders);

router.patch(
  "/:orderId/status",
  [
    authenticate,
    requireAdmin,
    param("orderId").isInt({ min: 1 }),
    body("status")
      .isIn(["pending", "paid", "cancelled"])
      .withMessage("Estado inválido"),
  ],
  updateOrderStatusController
);

export default router;
