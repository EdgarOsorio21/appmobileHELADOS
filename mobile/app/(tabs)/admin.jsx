import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { orderApi, catalogApi } from "@/services/api";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

const StatusBadge = ({ status }) => (
  <View style={[styles.badge, styles[`status${status}`] || styles.badge]}>
    <Text style={styles.badgeText}>{status}</Text>
  </View>
);

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
          catalogApi.products({ includeInactive: true }),
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
    try {
      setUpdating(true);
      const response = await catalogApi.products({ includeInactive: true });
      setProducts(response.products || []);
    } catch (err) {
      setError(err.message || "No pudimos actualizar el inventario");
    } finally {
      setUpdating(false);
    }
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

  const activeProducts = products.filter((product) => product.active);
  const inactiveProducts = products.filter((product) => !product.active);

  const stats = [
    {
      label: "Pedidos pendientes",
      value: orders.filter((order) => order.status === "pending").length,
      icon: "timer-outline",
    },
    {
      label: "Pedidos completados",
      value: orders.filter((order) => order.status === "paid").length,
      icon: "checkmark-done-outline",
    },
    {
      label: "Productos activos",
      value: activeProducts.length,
      icon: "ice-cream-outline",
    },
  ];

  const profileRows = [
    { label: "Nombre", value: user?.name || "-" },
    { label: "Correo", value: user?.email || "-" },
    { label: "Teléfono", value: user?.phone || "No registrado" },
    { label: "Rol", value: user?.role === "admin" ? "Administrador" : user?.role || "-" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de Heladería</Text>
          <Text style={styles.subtitle}>Administra pedidos, catálogo y configuración desde un solo lugar.</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, updating && styles.refreshButtonDisabled]}
          onPress={refreshProducts}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Ionicons name="refresh" size={18} color={COLORS.white} />
          )}
          <Text style={styles.refreshText}>{updating ? "Actualizando" : "Actualizar"}</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.row}>
        <View style={[styles.column, styles.columnPrimary]}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Mis Datos</Text>
            <Text style={styles.panelDescription}>Información de contacto visible para el personal autorizado.</Text>
            <View style={styles.table}>
              {profileRows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.tableRow, index === profileRows.length - 1 && styles.tableRowLast]}
                >
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Modificar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Historial de pedidos</Text>
              {updating && <ActivityIndicator color={COLORS.primary} />}
            </View>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>Aún no se registran pedidos en la plataforma.</Text>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderId}>Orden #{order.id}</Text>
                      <Text style={styles.orderCustomer}>{order.customerName || "Invitado"}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>
                  <View style={styles.orderTotals}>
                    <Text style={styles.orderTotal}>Total: ${Number(order.total).toFixed(2)}</Text>
                    <Text style={styles.orderItemsLabel}>Artículos</Text>
                    {order.items?.map((item) => (
                      <Text key={item.id} style={styles.orderItem}>
                        {item.quantity}x {item.name}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.orderActions}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => handleStatusChange(order.id, "paid")}>
                      <Text style={styles.primaryButtonText}>Marcar pagado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.secondaryButtonFull, styles.dangerButton]}
                      onPress={() => handleStatusChange(order.id, "cancelled")}
                    >
                      <Text style={[styles.secondaryButtonText, styles.dangerButtonText]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={[styles.column, styles.columnSecondary]}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Acciones rápidas</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="stats-chart-outline" size={20} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Productos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Indicadores</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Ionicons name={stat.icon} size={20} color={COLORS.primary} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Inventario</Text>
              <Text style={styles.panelDescriptionSmall}>
                Activos {activeProducts.length} · Ocultos {inactiveProducts.length}
              </Text>
            </View>
            {products.length === 0 ? (
              <Text style={styles.emptyText}>No hay productos registrados todavía.</Text>
            ) : (
              products.map((product, index) => (
                <View
                  key={product.id}
                  style={[styles.inventoryRow, index === products.length - 1 && styles.inventoryRowLast]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryName}>{product.name}</Text>
                    <Text style={styles.inventoryMeta}>
                      {product.category_name} · Stock {product.stock}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.inventoryButton, !product.active && styles.secondaryButtonActive]}
                    onPress={() => handleToggleProduct(product)}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        !product.active && styles.secondaryButtonPrimaryText,
                      ]}
                    >
                      {product.active ? "Ocultar" : "Publicar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textLight,
    marginTop: 6,
    fontSize: 14,
  },
  row: {
    flexDirection: "column",
    gap: 20,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  columnPrimary: {
    gap: 16,
  },
  columnSecondary: {
    gap: 16,
  },
  panel: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  panelDescription: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  panelDescriptionSmall: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  tableValue: {
    color: COLORS.text,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: "flex-start",
  },
  secondaryButtonFull: {
    flex: 1,
    alignItems: "center",
    alignSelf: "auto",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  secondaryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondaryButtonPrimaryText: {
    color: COLORS.white,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  dangerButton: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
  orderCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  orderCustomer: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  orderTotals: {
    gap: 6,
  },
  orderTotal: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  orderItemsLabel: {
    color: COLORS.textLight,
    fontSize: 12,
    textTransform: "uppercase",
  },
  orderItem: {
    color: COLORS.text,
    fontSize: 13,
  },
  orderActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 6,
  },
  quickActionText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "flex-start",
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inventoryRowLast: {
    borderBottomWidth: 0,
  },
  inventoryName: {
    fontWeight: "600",
    color: COLORS.text,
  },
  inventoryMeta: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  inventoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: "700",
    textTransform: "capitalize",
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
    fontSize: 13,
  },
  error: {
    color: COLORS.error,
    marginBottom: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
