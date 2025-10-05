import { validationResult } from "express-validator";
import { getActiveCart, getCartItems } from "../services/cartService.js";
import {
  createOrderFromCart,
  getAllOrders,
  getOrderItems,
  getOrdersForUser,
  updateOrderStatus,
} from "../services/orderService.js";

export const checkout = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const cart = await getActiveCart(req.user.id);
    if (!cart) {
      return res.status(400).json({ message: "No hay carrito activo" });
    }

    const items = await getCartItems(cart.id);
    if (!items.length) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    const orderId = await createOrderFromCart({ userId: req.user.id, cartId: cart.id, items });
    const orderItems = await getOrderItems(orderId);

    res.status(201).json({ orderId, items: orderItems });
  } catch (error) {
    console.error("Error al procesar checkout", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const listMyOrders = async (req, res) => {
  try {
    const orders = await getOrdersForUser(req.user.id);
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await getOrderItems(order.id),
      }))
    );

    res.json({ orders: enrichedOrders });
  } catch (error) {
    console.error("Error obteniendo órdenes", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const listAllOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await getOrderItems(order.id),
      }))
    );

    res.json({ orders: enrichedOrders });
  } catch (error) {
    console.error("Error obteniendo órdenes administrativas", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateOrderStatusController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId } = req.params;
  const { status } = req.body;

  try {
    await updateOrderStatus(orderId, status);
    const items = await getOrderItems(orderId);
    res.json({ orderId: Number(orderId), status, items });
  } catch (error) {
    console.error("Error actualizando estado de orden", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
