import { redirect } from "next/navigation";

export default function NewBudgetPage() {
  redirect("/dashboard/budgets");
}
