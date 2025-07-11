import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/sidebar";
import CSVUploadForm from "@/components/upload/csv-upload-form";

export default async function UploadPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Sidebar>
      <div className="p-8">
        <CSVUploadForm />
      </div>
    </Sidebar>
  );
}
