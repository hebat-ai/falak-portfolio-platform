import { redirect } from "next/navigation";

// Staff management now lives on Access Management.
export default function ManageStaffPage() {
  redirect("/admin/access");
}
