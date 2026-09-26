import { redirect } from "next/navigation";

export default function NewItemPage() {
  redirect("/dashboard/products?new=1");
}
