export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-slate-800 text-sm font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Creator BM</div>
        <div className="text-slate-400 text-[10px]">Business Manager</div>
      </div>
    </div>
  );
}
