import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SignInButton from "./SignInButton";
import { authOptions } from "../../../lib/auth";
import {
  isManagerEmail,
  MANAGER_HOME_PATH,
  normalizeCallbackUrl,
} from "../../../lib/auth/shared";
import styles from "../manager.module.css";

function getErrorMessage(errorCode) {
  if (errorCode === "AccessDenied") {
    return "This Google account is not allowed to access the manager dashboard.";
  }

  return "";
}

export default async function ManagerLoginPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const callbackUrl = normalizeCallbackUrl(resolvedSearchParams?.callbackUrl);
  const errorMessage = getErrorMessage(resolvedSearchParams?.error);

  if (session?.user?.email && isManagerEmail(session.user.email)) {
    redirect(callbackUrl || MANAGER_HOME_PATH);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={`${styles.section} ${styles.authCard}`}>
          <h1 className={styles.title}>Manager Sign-In</h1>
          <p className={styles.subtitle}>
            Use Google to access the protected manager dashboard.
          </p>
          {errorMessage ? <p className={`${styles.message} ${styles.messageError}`}>{errorMessage}</p> : null}
          <div className={styles.actions}>
            <SignInButton callbackUrl={callbackUrl} />
          </div>
        </section>
      </div>
    </main>
  );
}
