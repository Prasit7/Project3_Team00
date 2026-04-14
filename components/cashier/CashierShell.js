"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../app/cashier/cashier.module.css";

export default function CashierShell() {
  const [menuItems, setMenuItems] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeOrderItemId, setActiveOrderItemId] = useState(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [customModifierInput, setCustomModifierInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [orderNotice, setOrderNotice] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setIsLoadingMenu(true);
      setMenuError("");

      try {
        const response = await fetch("/api/menu-items");
        if (!response.ok) {
          throw new Error(`Menu request failed (${response.status})`);
        }

        const data = await response.json();
        if (!cancelled) {
          setMenuItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMenuError(error.message || "Unable to load menu items.");
          setMenuItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMenu(false);
        }
      }
    }

    async function loadModifiers() {
      try {
        const response = await fetch("/api/menu-modifiers");
        if (!response.ok) {
          throw new Error(`Modifier request failed (${response.status})`);
        }

        const data = await response.json();
        if (!cancelled) {
          const grouped = [
            { title: "Ice Level", exclusive: true, options: [] },
            { title: "Sugar Level", exclusive: true, options: [] },
            { title: "Topping", exclusive: false, options: [] },
          ].map((group) => {
            const options = (Array.isArray(data) ? data : [])
              .filter((item) => item.modifierType === group.title)
              .map((item) => item.name);

            if (group.title === "Sugar Level" && !options.includes("Extra Sugar")) {
              options.push("Extra Sugar");
            }

            return {
              ...group,
              options,
            };
          });

          setModifierGroups(grouped.filter((group) => group.options.length > 0));
        }
      } catch (_error) {
        if (!cancelled) {
          setModifierGroups([]);
        }
      }
    }

    loadMenu();
    loadModifiers();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(menuItems.map((item) => String(item.category || "").trim()).filter(Boolean))
    );
    return ["All", ...dynamicCategories];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedSearch || String(item.name || "").toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menuItems, searchTerm]);

  const selectedItem = useMemo(
    () => menuItems.find((item) => item.id === selectedItemId) || null,
    [menuItems, selectedItemId]
  );
  const quickDrinkItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        const category = String(item.category || "").toLowerCase();
        return category.includes("drink") || category.includes("beverage");
      })
      .slice(0, 6);
  }, [menuItems]);
  const activeOrderItem = useMemo(
    () => orderItems.find((item) => item.id === activeOrderItemId) || null,
    [orderItems, activeOrderItemId]
  );

  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [orderItems]);

  const cashReceivedValue = useMemo(() => {
    const parsed = Number.parseFloat(cashReceived);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [cashReceived]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    return Math.max(0, cashReceivedValue - orderTotal);
  }, [cashReceivedValue, orderTotal, paymentMethod]);
  const checkoutReady =
    orderItems.length > 0 &&
    (paymentMethod === "card" || (paymentMethod === "cash" && cashReceivedValue >= orderTotal));

  function addItemToOrder(itemToAdd) {
    if (!itemToAdd) return;
    setOrderNotice("");

    setOrderItems((previousItems) => {
      const existingIndex = previousItems.findIndex((item) => item.id === itemToAdd.id);

      if (existingIndex === -1) {
        return [
          ...previousItems,
          {
            id: itemToAdd.id,
            name: itemToAdd.name,
            category: itemToAdd.category,
            price: Number(itemToAdd.price || 0),
            quantity: 1,
            modifiers: [],
          },
        ];
      }

      return previousItems.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
    setActiveOrderItemId(itemToAdd.id);
  }

  function addSelectedItemToOrder() {
    addItemToOrder(selectedItem);
  }

  function updateOrderItemQuantity(itemId, nextQuantity) {
    setOrderNotice("");
    setOrderItems((previousItems) =>
      previousItems
        .map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeOrderItem(itemId) {
    setOrderNotice("");
    setOrderItems((previousItems) => previousItems.filter((item) => item.id !== itemId));
    if (activeOrderItemId === itemId) {
      setActiveOrderItemId(null);
      setCustomModifierInput("");
    }
  }

  function toggleModifier(modifierLabel, groupOptions, isExclusive) {
    if (!activeOrderItem) return;
    setOrderNotice("");

    setOrderItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== activeOrderItem.id) return item;
        const hasModifier = item.modifiers.includes(modifierLabel);
        if (hasModifier) {
          return {
            ...item,
            modifiers: item.modifiers.filter((modifier) => modifier !== modifierLabel),
          };
        }

        if (isExclusive) {
          return {
            ...item,
            modifiers: [...item.modifiers.filter((modifier) => !groupOptions.includes(modifier)), modifierLabel],
          };
        }

        return {
          ...item,
          modifiers: [...item.modifiers, modifierLabel],
        };
      })
    );
  }

  function addCustomModifier() {
    if (!activeOrderItem) return;
    setOrderNotice("");
    const trimmedValue = customModifierInput.trim();
    if (!trimmedValue) return;
    if (activeOrderItem.modifiers.includes(trimmedValue)) {
      setCustomModifierInput("");
      return;
    }

    setOrderItems((previousItems) =>
      previousItems.map((item) =>
        item.id === activeOrderItem.id ? { ...item, modifiers: [...item.modifiers, trimmedValue] } : item
      )
    );
    setCustomModifierInput("");
  }

  function selectPaymentMethod(method) {
    setPaymentMethod(method);
    setPaymentError("");
    if (method === "cash") {
      setIsCashModalOpen(true);
    } else {
      setIsCashModalOpen(false);
    }
  }

  async function submitOrder() {
    setPaymentError("");
    setOrderNotice("");

    if (orderItems.length === 0) {
      setPaymentError("Add at least one item before submitting an order.");
      return;
    }

    if (!paymentMethod) {
      setPaymentError("Select a payment method.");
      return;
    }

    if (paymentMethod === "cash" && cashReceivedValue < orderTotal) {
      setPaymentError("Cash received must be at least the order total.");
      setIsCashModalOpen(true);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const response = await fetch("/api/cashier/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          paymentMethod,
          cashReceived: paymentMethod === "cash" ? cashReceivedValue : null,
          items: orderItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            modifiers: item.modifiers,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Submit failed (${response.status})`);
      }

      const lineItemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      setOrderNotice(
        `Order #${payload.orderId} submitted (${lineItemCount} item${
          lineItemCount === 1 ? "" : "s"
        }) · ${paymentMethod.toUpperCase()} payment`
      );
      setOrderItems([]);
      setSelectedItemId(null);
      setActiveOrderItemId(null);
      setCustomModifierInput("");
      setCashReceived("");
      setPaymentMethod("");
      setIsCashModalOpen(false);
    } catch (error) {
      setPaymentError(error.message || "Unable to submit order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <section className={styles.shell} aria-label="Cashier POS Layout">
      <header className={styles.header}>
        <h1 className={styles.title}>Cashier POS</h1>
        <p className={styles.subtitle}>Fast item search, live order editing, and checkout flow.</p>
      </header>

      <div className={styles.columns}>
        <section className={styles.menuPanel} aria-label="Menu Search and Items">
          <div className={styles.panelHeader}>
            <h2>Menu</h2>
            <input
              type="text"
              placeholder="Search menu items"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search menu items"
            />
          </div>

          <div className={styles.categoryRow} role="tablist" aria-label="Menu categories">
            {categories.map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {quickDrinkItems.length > 0 && (
            <div className={styles.drinkStrip} aria-label="Quick Add Drinks">
              <p className={styles.drinkStripTitle}>Quick Add Drinks</p>
              <div className={styles.drinkButtons}>
                {quickDrinkItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.drinkQuickButton}
                    onClick={() => addItemToOrder(item)}
                  >
                    <span>{item.name}</span>
                    <span>${Number(item.price || 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.placeholderGrid}>
            {isLoadingMenu && <p className={styles.loadingState}>Loading menu...</p>}
            {!isLoadingMenu && menuError && <p className={styles.errorState}>{menuError}</p>}
            {!isLoadingMenu && !menuError && filteredItems.length === 0 && (
              <p className={styles.emptyState}>No items match this search.</p>
            )}

            {!isLoadingMenu &&
              !menuError &&
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.menuItemCard} ${isSelected ? styles.menuItemCardSelected : ""}`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <span className={styles.menuItemName}>{item.name}</span>
                    <span className={styles.menuItemMeta}>{item.category}</span>
                    <span className={styles.menuItemPrice}>${Number(item.price || 0).toFixed(2)}</span>
                  </button>
                );
              })}
          </div>
        </section>

        <section className={styles.orderPanel} aria-label="Current Order and Checkout">
          <div className={styles.panelHeader}>
            <h2>Current Order</h2>
            <p className={styles.total}>${orderTotal.toFixed(2)}</p>
          </div>

          <div className={styles.orderListPlaceholder}>
            {orderItems.length > 0 ? (
              <div className={styles.orderItemsList}>
                {orderItems.map((item) => (
                  <article
                    key={item.id}
                    className={`${styles.orderItemCard} ${activeOrderItemId === item.id ? styles.orderItemCardActive : ""}`}
                  >
                    <div className={styles.orderItemTop}>
                      <div>
                        <p className={styles.orderItemName}>{item.name}</p>
                        <p className={styles.orderItemMeta}>{item.category}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => removeOrderItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        Remove
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.selectForModsButton}
                      onClick={() => setActiveOrderItemId(item.id)}
                    >
                      {activeOrderItemId === item.id ? "Selected for Modifications" : "Select for Modifications"}
                    </button>
                    {item.modifiers.length > 0 && (
                      <p className={styles.modifierSummary}>Mods: {item.modifiers.join(", ")}</p>
                    )}
                    <div className={styles.orderItemBottom}>
                      <div className={styles.qtyControls}>
                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          -
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <p className={styles.orderItemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : selectedItem ? (
              <div className={styles.selectedItemPreview}>
                <p className={styles.selectedLabel}>Selected Item</p>
                <p className={styles.selectedName}>{selectedItem.name}</p>
                <p className={styles.selectedMeta}>
                  {selectedItem.category} · ${Number(selectedItem.price || 0).toFixed(2)}
                </p>
              </div>
            ) : (
              "Select an item from the menu."
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={addSelectedItemToOrder}
              disabled={!selectedItem}
            >
              Add Selected Item
            </button>
            <div className={styles.modifierPanel}>
              <p className={styles.modifierTitle}>Apply Modifications</p>
              <p className={styles.modifierHelp}>
                {activeOrderItem ? `Editing: ${activeOrderItem.name}` : "Select an order item to apply modifiers."}
              </p>
              <div className={styles.modifierGroups}>
                {modifierGroups.map((group) => (
                  <section key={group.title} className={styles.modifierGroup}>
                    <p className={styles.modifierGroupTitle}>{group.title}</p>
                    <div className={styles.modifierChipRow}>
                      {group.options.map((modifierLabel) => (
                        <button
                          key={modifierLabel}
                          type="button"
                          className={`${styles.modifierChip} ${
                            activeOrderItem?.modifiers.includes(modifierLabel) ? styles.modifierChipActive : ""
                          }`}
                          onClick={() => toggleModifier(modifierLabel, group.options, group.exclusive)}
                          disabled={!activeOrderItem}
                        >
                          {modifierLabel}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
                {modifierGroups.length === 0 && (
                  <p className={styles.modifierHelp}>Modifier options could not be loaded from the database.</p>
                )}
              </div>
              <div className={styles.customModifierRow}>
                <input
                  type="text"
                  className={styles.customModifierInput}
                  placeholder="Custom modifier"
                  value={customModifierInput}
                  onChange={(event) => setCustomModifierInput(event.target.value)}
                  disabled={!activeOrderItem}
                />
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={addCustomModifier}
                  disabled={!activeOrderItem || !customModifierInput.trim()}
                >
                  Add Note
                </button>
              </div>
            </div>
            <div className={styles.paymentPanel}>
              <p className={styles.paymentTitle}>Payment</p>
              <p className={styles.paymentHint}>Total due: ${orderTotal.toFixed(2)}</p>
              <div className={styles.paymentMethodRow}>
                <button
                  type="button"
                  className={`${styles.paymentMethodButton} ${
                    paymentMethod === "cash" ? styles.paymentMethodButtonActive : ""
                  }`}
                  onClick={() => selectPaymentMethod("cash")}
                >
                  Cash
                </button>
                <button
                  type="button"
                  className={`${styles.paymentMethodButton} ${
                    paymentMethod === "card" ? styles.paymentMethodButtonActive : ""
                  }`}
                  onClick={() => selectPaymentMethod("card")}
                >
                  Card
                </button>
              </div>
              {paymentMethod === "cash" && (
                <div className={styles.cashSummaryRow}>
                  <p className={styles.cashSummaryText}>Cash received: ${cashReceivedValue.toFixed(2)}</p>
                  <p className={styles.changeDue}>Change Due: ${changeDue.toFixed(2)}</p>
                </div>
              )}
              {paymentError && <p className={styles.paymentError}>{paymentError}</p>}
            </div>

            <button
              type="button"
              className={styles.primaryAction}
              onClick={submitOrder}
              disabled={isSubmittingOrder || !checkoutReady}
            >
              {isSubmittingOrder ? "Submitting..." : "Submit Order"}
            </button>
            {!checkoutReady && <p className={styles.checkoutHint}>Complete payment details to submit this order.</p>}
            {orderNotice && <p className={styles.orderNotice}>{orderNotice}</p>}
          </div>
        </section>
      </div>

      {isCashModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setIsCashModalOpen(false)}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label="Enter cash received"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Cash Received</h3>
            <p className={styles.modalHint}>Total due: ${orderTotal.toFixed(2)}</p>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.cashInput}
              value={cashReceived}
              onChange={(event) => {
                setCashReceived(event.target.value);
                setPaymentError("");
              }}
              placeholder="0.00"
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setCashReceived(orderTotal.toFixed(2))}
              >
                Exact
              </button>
              <button type="button" className={styles.actionButton} onClick={() => setCashReceived("")}>
                Clear
              </button>
              <button type="button" className={styles.secondaryAction} onClick={() => setIsCashModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
