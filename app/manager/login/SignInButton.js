"use client";

import { signIn } from "next-auth/react";
import styles from "../manager.module.css";

export default function SignInButton({ callbackUrl }) {
  return (
    <button
      className={`${styles.button} ${styles.buttonPrimary}`}
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
    >
      Sign In With Google
    </button>
  );
}
