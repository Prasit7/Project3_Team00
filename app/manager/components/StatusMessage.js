import styles from "../manager.module.css";

export default function StatusMessage({ status }) {
  if (!status?.text) {
    return null;
  }

  const toneClass = status.type === "error" ? styles.messageError : styles.messageOk;
  return <p className={`${styles.message} ${toneClass}`}>{status.text}</p>;
}
