import { redirect } from "next/navigation";

export default function LowStockPage() {
  redirect("/dashboard/inventory");
}
