import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS } from "@/constants/colors";

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => (
  <View style={styles.itemCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>${Number(item.unitPrice).toFixed(2)}</Text>
    </View>
    <View style={styles.quantityControls}>
      <TouchableOpacity style={styles.quantityButton} onPress={onDecrease}>
        <Ionicons name="remove" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.quantityValue}>{item.quantity}</Text>
      <TouchableOpacity style={styles.quantityButton} onPress={onIncrease}>
        <Ionicons name="add" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
      <Ionicons name="trash" size={20} color={COLORS.error} />
    </TouchableOpacity>
  </View>
);

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

export default function CartScreen() {
  const { items, totals, loading, updateItem, removeItem, checkout } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [items]
  );

  const handleIncrease = async (item) => {
    try {
      await updateItem({ itemId: item.id, quantity: item.quantity + 1 });
    } catch (err) {
      Alert.alert("No se pudo actualizar", err.message || "Intenta nuevamente");
    }
  };

  const handleDecrease = async (item) => {
    try {
      const nextQuantity = item.quantity - 1;
      if (nextQuantity <= 0) {
        await removeItem(item.id);
      } else {
        await updateItem({ itemId: item.id, quantity: nextQuantity });
      }
    } catch (err) {
      Alert.alert("No se pudo actualizar", err.message || "Intenta nuevamente");
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      Alert.alert("No se pudo eliminar", err.message || "Intenta nuevamente");
    }
  };

  const handleCheckout = async () => {
    if (!items.length) {
      Alert.alert("Tu carrito está vacío", "Agrega helados antes de continuar.");
      return;
    }

    try {
      setSubmitting(true);
      setReceipt(null);
      const order = await checkout();
      setReceipt(order);
    } catch (err) {
      Alert.alert("No pudimos procesar tu pedido", err.message || "Intenta de nuevo más tarde");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tu carrito</Text>
        <Text style={styles.subtitle}>
          {user ? `Listo para disfrutar, ${user.name.split(" ")[0]}!` : "Inicia sesión para guardar tus helados."}
        </Text>
      </View>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onIncrease={() => handleIncrease(item)}
            onDecrease={() => handleDecrease(item)}
            onRemove={() => handleRemove(item.id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Tu carrito está vacío por ahora.</Text>}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(totals.total)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.checkoutText}>Confirmar pedido</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={Boolean(receipt)} animationType="slide" transparent onRequestClose={() => setReceipt(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.receiptTitle}>Pedido confirmado</Text>
                {receipt?.orderId && (
                  <Text style={styles.receiptSubtitle}>#{receipt.orderId}</Text>
                )}
              </View>
              <Pressable onPress={() => setReceipt(null)} accessibilityRole="button">
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={styles.receiptContent}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Cliente</Text>
                <Text style={styles.receiptValue}>{user?.name || receipt?.customer?.name || "Invitado"}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Correo</Text>
                <Text style={styles.receiptValue}>{receipt?.customer?.email || "-"}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Fecha</Text>
                <Text style={styles.receiptValue}>{formatDate(receipt?.createdAt)}</Text>
              </View>
              <View style={styles.receiptDivider} />
              <Text style={styles.receiptSectionTitle}>Resumen</Text>
              {receipt?.items?.map((item) => (
                <View key={item.id} style={styles.receiptItemRow}>
                  <View>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemMeta}>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.receiptItemTotal}>
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </Text>
                </View>
              ))}
              <View style={styles.receiptDivider} />
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Total</Text>
                <Text style={styles.receiptTotalValue}>{formatCurrency(receipt?.total)}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setReceipt(null)}>
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textLight,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  itemName: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  itemPrice: {
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 6,
    borderRadius: 12,
  },
  quantityButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 6,
  },
  quantityValue: {
    fontWeight: "700",
    color: COLORS.text,
  },
  removeButton: {
    padding: 6,
  },
  summary: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: COLORS.textLight,
  },
  summaryValue: {
    color: COLORS.text,
    fontWeight: "600",
  },
  summaryTotal: {
    fontWeight: "800",
    fontSize: 20,
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  checkoutText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textLight,
    marginTop: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(25, 16, 32, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  receiptSubtitle: {
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  receiptContent: {
    gap: 12,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  receiptValue: {
    color: COLORS.text,
    fontWeight: "600",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  receiptSectionTitle: {
    fontWeight: "700",
    color: COLORS.text,
  },
  receiptItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptItemName: {
    fontWeight: "600",
    color: COLORS.text,
  },
  receiptItemMeta: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  receiptItemTotal: {
    fontWeight: "700",
    color: COLORS.text,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
