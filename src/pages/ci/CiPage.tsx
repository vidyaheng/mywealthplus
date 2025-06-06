

import CIForm from "@/components/ci/CIFormPage";

export default function CiPage() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">หน้าโรคร้ายแรง (CI - Critical Illness)</h2>
      <CIForm />
    </div>
  );
}