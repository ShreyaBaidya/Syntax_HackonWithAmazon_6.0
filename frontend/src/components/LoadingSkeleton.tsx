export function LoadingSkeleton() {
  return (
    <div style={{ padding: "16px" }}>
      {/* Search Bar Skeleton */}
      <div style={{ height: 44, background: "#EAEAEA", borderRadius: 8, marginBottom: 16, animation: "pulse 1.5s infinite" }} />
      {/* Categories Skeleton */}
      <div style={{ display: "flex", gap: 12, overflowX: "hidden", marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 72, height: 90, background: "#EAEAEA", borderRadius: 12, flexShrink: 0, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
      {/* Product Grid Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ height: 220, background: "#EAEAEA", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );
}
