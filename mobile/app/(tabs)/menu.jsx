import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { catalogApi } from "@/services/api";
import { COLORS } from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const fallbackProductImage = "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=600&q=60";

const getProductImage = (imageUrl) =>
  imageUrl && imageUrl.startsWith("http")
    ? { uri: imageUrl }
    : { uri: fallbackProductImage };

const ProductCard = ({ product, onAdd }) => (
  <View style={styles.productCard}>
    <Image source={getProductImage(product.image_url)} style={styles.productImage} />
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productCategory}>{product.category_name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {product.description}
      </Text>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product.id)}>
          <Text style={styles.addButtonText}>Añadir</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default function MenuScreen() {
  const params = useLocalSearchParams();
  const defaultCategory = params?.categoryId ? Number(params.categoryId) : null;
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [search, setSearch] = useState(params?.categoryName ? String(params.categoryName) : "");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filtering, setFiltering] = useState(false);
  const { addItem } = useCart();

  const debouncedSearch = useMemo(() => search.trim(), [search]);

  const fetchCategories = useCallback(async () => {
    const response = await catalogApi.categories();
    return response.categories || [];
  }, []);

  const fetchProducts = useCallback(async (filters = {}) => {
    const response = await catalogApi.products(filters);
    const products = response.products || [];
    const unique = [];
    const seen = new Set();

    for (const product of products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      unique.push(product);
    }

    return unique;
  }, []);

  const loadData = useCallback(
    async ({ withCategories = false, filters = {}, showSkeleton = true, showFilterIndicator = false } = {}) => {
      if (showSkeleton) {
        setLoading(true);
      } else if (showFilterIndicator) {
        setFiltering(true);
      }

      setError(null);
      try {
        if (withCategories) {
          const cats = await fetchCategories();
          setCategories(cats);
        }
        const prods = await fetchProducts(filters);
        setProducts(prods);
      } catch (err) {
        setError(err.message || "No pudimos obtener la carta");
      } finally {
        if (showSkeleton) {
          setLoading(false);
        }
        if (showFilterIndicator) {
          setFiltering(false);
        }
      }
    },
    [fetchCategories, fetchProducts]
  );

  useEffect(() => {
    loadData({ withCategories: true, filters: { categoryId: defaultCategory } });
  }, [loadData, defaultCategory]);

  useEffect(() => {
    if (loading) return;
    const handler = setTimeout(() => {
      loadData({
        filters: { categoryId: selectedCategory, search: debouncedSearch || undefined },
        showSkeleton: false,
        showFilterIndicator: true,
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [selectedCategory, debouncedSearch, loadData, loading]);

  const handleSearch = useCallback(async () => {
    await loadData({
      filters: { categoryId: selectedCategory, search: debouncedSearch },
      showSkeleton: false,
      showFilterIndicator: true,
    });
  }, [selectedCategory, debouncedSearch, loadData]);

  const handleAddToCart = async (productId) => {
    try {
      await addItem({ productId, quantity: 1 });
    } catch (err) {
      setError(err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({
      withCategories: true,
      filters: { categoryId: selectedCategory, search: debouncedSearch || undefined },
      showSkeleton: false,
    });
    setRefreshing(false);
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Nuestra carta</Text>
        <Text style={styles.subtitle}>
          Paletas artesanales, helados cremosos y malteadas preparadas al momento.
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar sabores, toppings o categorías"
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.categoryList}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="options-outline" size={16} color={COLORS.white} />
          <Text style={styles.searchButtonText}>Filtrar</Text>
        </TouchableOpacity>
        {filtering && (
          <View style={styles.filteringIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.filteringText}>Buscando resultados frescos…</Text>
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    ),
    [search, categories, selectedCategory, error, handleSearch, filtering]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      renderItem={({ item }) => <ProductCard product={item} onAdd={handleAddToCart} />}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.emptyText}>No encontramos helados con esos filtros.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  searchButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  filteringIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  filteringText: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  productInfo: {
    flex: 1,
    gap: 6,
  },
  productName: {
    fontWeight: "700",
    fontSize: 18,
    color: COLORS.text,
  },
  productCategory: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  productDescription: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  productFooter: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontWeight: "700",
    color: COLORS.primary,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textLight,
    marginTop: 32,
  },
  error: {
    color: COLORS.error,
    marginTop: 8,
  },
});
