export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#1B2A6B]">IMC Cargo</h1>
        <p className="text-sm text-gray-500 mt-1">Freight Forwarder</p>
      </div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {children}
      </div>
    </div>
  );
}
