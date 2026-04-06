import styles from '../../app/cashier/cashier.module.css';

export default function CashierShell() {
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
              disabled
              aria-label="Search menu items"
            />
          </div>
          <div className={styles.placeholderGrid}>
            <button className={styles.touchCard} disabled>Drink</button>
            <button className={styles.touchCard} disabled>Main</button>
            <button className={styles.touchCard} disabled>Snack</button>
            <button className={styles.touchCard} disabled>Dessert</button>
          </div>
        </section>

        <section className={styles.orderPanel} aria-label="Current Order and Checkout">
          <div className={styles.panelHeader}>
            <h2>Current Order</h2>
            <p className={styles.total}>$0.00</p>
          </div>

          <div className={styles.orderListPlaceholder}>No items yet</div>

          <div className={styles.actions}>
            <button className={styles.actionButton} disabled>Apply Modifications</button>
            <button className={styles.actionButton} disabled>Edit / Remove</button>
            <button className={styles.primaryAction} disabled>Take Payment</button>
          </div>
        </section>
      </div>
    </section>
  );
}
