import Image from "next/image";
import LeadUploadForm from "../components/LeadUploadForm";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 p-8">
      <LeadUploadForm />
      <AnalyticsDashboard />
    </div>
  );
}
