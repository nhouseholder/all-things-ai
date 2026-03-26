import { useRef, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Drop-in replacement for recharts ResponsiveContainer that fixes
 * the "no bars until scroll" bug. Uses IntersectionObserver to
 * trigger a resize event when the chart enters the viewport.
 */
export default function ChartContainer({ children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Force recharts to recalculate dimensions
          window.dispatchEvent(new Event('resize'));
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <ResponsiveContainer {...props}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
