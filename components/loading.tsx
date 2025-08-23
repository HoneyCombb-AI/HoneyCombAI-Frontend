const HexagonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
  </svg>
);

export function Loading() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-2">
      <div className="hexagon-loader">
        <div>
          <div>
            <span className="one h6"></span>
            <span className="two h3"></span>
          </div>
        </div>
        <div>
          <div>
            <span className="one h1"></span>
            <span className="two h4"></span>
          </div>
        </div>
        <div>
          <div>
            <span className="one h5"></span>
            <span className="two h2"></span>
          </div>
        </div>
      </div>
      {/* Center hexagon icon */}
      <HexagonIcon className="absolute inset-0 text-amber-400 animate-pulse z-10 w-10 h-10 m-auto rotate-90" />
    </div>
  );
}
