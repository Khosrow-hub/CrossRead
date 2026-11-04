export default function LibraryPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gridTemplateRows: "auto 1fr auto auto",
        gap: "1.25rem",
      }}
    >
      {/* TOP RIGHT BAR (single pill at top spanning right area) */}
      <div
        style={{
          gridColumn: "1 / 4",
          gridRow: "1",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          className="nr-surface-sm"
          style={{
            width: "10rem",
            height: "1.75rem",
            borderRadius: "0.6rem",
          }}
        />
      </div>

      {/* MAIN AREA (big card, center) */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "1 / 4",
          gridRow: "2 / 4",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "26rem",
        }}
      >
        {/* image placeholder icon */}
        <div
          style={{
            color: "var(--nr-text-soft)",
            fontSize: "3.5rem",
            opacity: 0.55,
          }}
        >
          ◪
        </div>

        {/* bottom left plus pill */}
        <div
          className="nr-surface-sm"
          style={{
            position: "absolute",
            bottom: "1.25rem",
            left: "1.25rem",
            width: "7rem",
            height: "1.9rem",
            borderRadius: "0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: "0.75rem",
            color: "var(--nr-text)",
            fontSize: "0.95rem",
          }}
        >
          +
        </div>
      </div>

      {/* RIGHT COLUMN CARD 1 */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "4",
          gridRow: "1 / 2",
          minHeight: "4rem",
          position: "relative",
        }}
      >
        <PillTag />
      </div>

      {/* RIGHT COLUMN CARD 2 */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "4",
          gridRow: "2 / 3",
          minHeight: "4.5rem",
          position: "relative",
        }}
      >
        <PillTag />
      </div>

      {/* RIGHT COLUMN CARD 3 (highlighted) */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "4",
          gridRow: "3 / 4",
          minHeight: "5rem",
          position: "relative",
          background: "#eceff4",
        }}
      >
        <PillTag />
      </div>

      {/* BOTTOM CENTER CARD (text stack) */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "2 / 4",
          gridRow: "4",
          padding: "1.1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
          minHeight: "6rem",
        }}
      >
        <LinePlaceholder width="60%" />
        <LinePlaceholder width="80%" />
        <LinePlaceholder width="70%" />
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.25rem",
            justifyContent: "flex-end",
          }}
        >
          <div
            className="nr-surface-sm"
            style={{ width: "3rem", height: "0.7rem", borderRadius: "0.35rem" }}
          />
          <div
            className="nr-surface-sm"
            style={{ width: "2rem", height: "0.7rem", borderRadius: "0.35rem" }}
          />
        </div>
      </div>

      {/* BOTTOM RIGHT CARD (paper stack) */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "4",
          gridRow: "4",
          padding: "1rem",
          position: "relative",
          minHeight: "6rem",
          overflow: "hidden",
        }}
      >
        <div
          className="nr-surface-sm"
          style={{
            width: "1rem",
            height: "1rem",
            borderRadius: "0.3rem",
            marginBottom: "0.9rem",
          }}
        />
        {/* paper stack shapes */}
        <div
          style={{
            position: "absolute",
            bottom: "-1.5rem",
            right: "-1rem",
            width: "8rem",
            height: "6rem",
          }}
        >
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
              transform: "rotate(-10deg) translate(10px, 6px)",
              opacity: 0.5,
            }}
          />
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
              transform: "rotate(-5deg) translate(4px, 2px)",
              opacity: 0.75,
            }}
          />
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function PillTag() {
  return (
    <div
      className="nr-surface-sm"
      style={{
        position: "absolute",
        top: "0.65rem",
        left: "0.65rem",
        width: "1.75rem",
        height: "0.55rem",
        borderRadius: "0.3rem",
      }}
    />
  );
}

function LinePlaceholder({ width }: { width: string }) {
  return (
    <div
      className="nr-surface-sm"
      style={{
        width,
        height: "0.65rem",
        borderRadius: "0.35rem",
      }}
    />
  );
}