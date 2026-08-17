import { useEffect, useState } from "react";

/**
 * Componente para testar responsividade em diferentes breakpoints
 * Usado para validar que o layout funciona corretamente em mobile, tablet e desktop
 */
export function ResponsiveTest() {
  const [breakpoint, setBreakpoint] = useState<string>("desktop");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint("mobile");
      } else if (width < 1024) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-foreground text-background px-3 py-2 rounded text-xs font-mono z-50">
      {breakpoint} ({window.innerWidth}px)
    </div>
  );
}

export default ResponsiveTest;
