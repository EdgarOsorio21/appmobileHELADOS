import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { orderApi, catalogApi } from "@/services/api";
import { COLORS } from "@/constants/colors";

export default function AdminScreen() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      if (!token || !isAdmin) return;
      setLoading(true);
      setError(null);
      try {
        const [ordersResponse, productsResponse] = await Promise.all([
          orderApi.allOrders(token),
          catalogApi.products(),
        ]);
        setOrders(ordersResponse.orders || []);
        setProducts(productsResponse.products || []);
      } catch (err) {
        setError(err.message || "No pudimos obtener la información administrativa");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, isAdmin]);

  const refreshProducts = async () => {
    const response = await catalogApi.products();
    setProducts(response.products || []);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdating(true);
      const updated = await orderApi.updateStatus(token, orderId, status);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: updated.status } : order))
      );
      return updated;
    } catch (err) {
      Alert.alert("Error actualizando el estado", err.message || "Intenta nuevamente");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleProduct = async (product) => {
    try {
      setUpdating(true);
      await catalogApi.updateProduct(token, product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.image_url,
        stock: product.stock,
        categoryId: product.category_id,
        active: product.active ? 0 : 1,
      });
      await refreshProducts();
    } catch (err) {
      Alert.alert("Error actualizando el producto", err.message || "Intenta de nuevo");
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Zona administrativa</Text>
        <Text style={styles.subtitle}>Solo los usuarios con rol administrador pueden acceder aquí.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Panel de administración</Text>
      <Text style={styles.subtitle}>Gestiona pedidos y disponibilidad del menú en un solo lugar.</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos recientes</Text>
          {updating && <ActivityIndicator color={COLORS.primary} />}
        </View>
        {orders.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay pedidos registrados.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Orden #{order.id}</Text>
                <Text style={[styles.badge, styles[`status${order.status}`] || styles.badge]}>{order.status}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Cliente: {order.customerName || "Invitado"} - Total ${Number(order.total).toFixed(2)}
              </Text>
              <View style={styles.orderItems}>
                {order.items?.map((item) => (
                  <Text key={item.id} style={styles.orderItem}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleStatusChange(order.id, "paid")}>
                  <Text style={styles.actionButtonText}>Marcar pagado</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleStatusChange(order.id, "cancelled")}
                >
                  <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventario activo</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No hay productos registrados todavía.</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{product.name}</Text>
                <Text style={styles.cardSubtitle}>{product.category_name}</Text>
              </View>
              <Text style={styles.cardSubtitle}>Stock: {product.stock} unidades</Text>
              <Text style={styles.cardSubtitle}>${Number(product.price).toFixed(2)}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleProduct(product)}>
                  <Text style={styles.actionButtonText}>
                    {product.active ? "Despublicar" : "Publicar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: COLORS.background,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textLight,
    marginTop: 6,
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: COLORS.text,
  },
  cardSubtitle: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  orderItems: {
    gap: 4,
  },
  orderItem: {
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  dangerButton: {
    backgroundColor: COLORS.errorLight,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: "capitalize",
    color: COLORS.white,
    fontWeight: "700",
    backgroundColor: COLORS.primary,
  },
  statuspaid: {
    backgroundColor: COLORS.success,
  },
  statuspending: {
    backgroundColor: COLORS.primary,
  },
  statuscancelled: {
    backgroundColor: COLORS.error,
  },
  emptyText: {
    color: COLORS.textLight,
  },
  error: {
    color: COLORS.error,
  },
});
