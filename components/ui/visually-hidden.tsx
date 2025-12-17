import type * as React from "react";

export function VisuallyHidden({children}: { children: React.ReactNode }) {
    return (
        <span
            style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: "0",
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                borderWidth: "0",
            }}
        >
      {children}
    </span>
    );
}
