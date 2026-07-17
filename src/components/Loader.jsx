import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function Loader() {
  const containerRef = useRef(null);
  const lineRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    const counter = { val: 0 };
    tl.to(
      counter,
      {
        val: 100,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (textRef.current) {
            textRef.current.textContent = Math.round(counter.val);
          }
        },
      },
      0,
    );

    tl.fromTo(
      lineRef.current,
      { scaleX: 0, opacity: 0.2 },
      { scaleX: 1, opacity: 1, duration: 1.2, ease: "power2.inOut" },
      0,
    );

    tl.to(
      containerRef.current,
      {
        yPercent: -100,
        duration: 1.2,
        ease: "power3.inOut",
      },
      1.5,
    );

    return () => tl.kill();
  }, []);

  return (
    <div ref={containerRef} className="loader">
      <div className="loader-inner">
        <span ref={textRef} className="loader-text">
          0
        </span>
        <div className="loader-line-wrapper">
          <div ref={lineRef} className="loader-line" />
        </div>
      </div>
    </div>
  );
}
