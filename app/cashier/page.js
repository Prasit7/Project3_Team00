import CashierShell from '../../components/cashier/CashierShell';
import styles from './cashier.module.css';

export const metadata = {
  title: 'Cashier POS',
  description: 'Cashier point-of-sale interface',
};

export default function CashierPage() {
  return (
    <main className={styles.page}>
      <CashierShell />
    </main>
  );
}
