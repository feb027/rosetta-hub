export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-slate-400 text-lg">Loading...</p>
      </div>
    </div>
  );
}
