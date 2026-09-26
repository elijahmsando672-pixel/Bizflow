import { redirect } from "next/navigation";

export default function NewStockPage() {
  redirect("/dashboard/inventory/new");
}
