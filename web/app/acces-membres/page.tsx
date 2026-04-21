import { redirect } from "next/navigation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-du-changement.vercel.app";

export default function AccesMembresPage() {
  redirect(APP_URL);
}
