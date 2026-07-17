import { useState, useEffect, useRef, useLayoutEffect } from "react";
import gsap from "gsap";

// ─── PROJECT DATA ───
const PROJECTS = [
  {
    id: "singlot",
    title: "Singlot",
    category: "Web App",
    year: "2025",
    tags: ["Craft CMS", "Design", "Figma"],
    url: "https://singlot.no/",
    image: "/assets/singlot.webp",
  },
  {
    id: "hemmingodden",
    title: "Hemmingodden",
    category: "E-commerce",
    year: "2024",
    tags: ["Craft CMS", "Design", "Figma", "React"],
    url: "https://hemmingodden.com/",
    image: "/assets/hemmingodden.webp",
  },
  {
    id: "lazy-eyes",
    title: "Lazy Eyes",
    category: "Web Experience",
    year: "2023",
    tags: ["Animsition", "Foundation", "jQuery", "JavaScript"],
    url: "https://lazyeyes.cool/",
    image: "/assets/lazyeyes.webp",
  },
  {
    id: "escape-rank",
    title: "EscapeRank",
    category: "E-commerce",
    year: "2019",
    tags: ["AWS", "Laravel", "Stripe", "Orchid"],
    url: "#",
    image: "/assets/escaperank.webp",
  },
  {
    id: "algotransparency",
    title: "AlgoTransparency",
    category: "Interactive Tool",
    year: "2018",
    tags: ["Netlify", "Parcel", "JavaScript"],
    url: "https://www.algotransparency.org/",
    image: "/assets/algotransparency.webp",
  },
  {
    id: "carabiners",
    title: "Floating Carabiners",
    category: "3D Experiment",
    year: "2026",
    tags: ["Three.js", "Physics"],
    url: "https://carabiners.vercel.app/",
    image: "/assets/carabiners.webp",
  },
  {
    id: "blob",
    title: "Blob study",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://blob-one.vercel.app/",
    image: "/assets/blob.webp",
  },
  {
    id: "dna",
    title: "DNA Particles",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://dna-particule.vercel.app/",
    image: "/assets/dna.webp",
  },
  {
    id: "dust",
    title: "Dust Particles",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://dust-particles.vercel.app/",
    image: "/assets/dust.webp",
  },
  {
    id: "fresnel",
    title: "Fresnel Coefficients",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://monopo-fresnel.vercel.app/",
    image: "/assets/fresnel.webp",
  },
  {
    id: "distortion",
    title: "Image Distortion",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://pixel-displacement.vercel.app/",
    image: "/assets/distortion.webp",
  },
  {
    id: "pepyaka",
    title: "Pepyaka",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://pepyaka.vercel.app/",
    image: "/assets/pepyaka.webp",
  },
  {
    id: "pixel-grid",
    title: "Pixel Grid Displacement",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://pixel-distortion.vercel.app/",
    image: "/assets/pixel-grid.webp",
  },
  {
    id: "visual-data",
    title: "Visual Data Particles",
    category: "3D Experiment",
    year: "2024",
    tags: ["GLSL", "Three.js", "Shaders", "FBO"],
    url: "https://visualdata-head.vercel.app/",
    image: "/assets/visualdata.webp",
  },
];

export default function WorksPage() {
  const [mouseY, setMouseY] = useState(0);
  const [stack, setStack] = useState([]);
  const maskRef = useRef(null);
  const nextId = useRef(0);
  const exitTimeoutRef = useRef(null);
  const lastIndexRef = useRef(-1);
  const entryDirRef = useRef("down");

  // ─── Body class for works overlay ───
  useEffect(() => {
    document.body.classList.add("is-works");
    return () => document.body.classList.remove("is-works");
  }, []);

  // ─── Cursor Y tracking ───
  useEffect(() => {
    const onMove = (e) => setMouseY(e.clientY);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ─── GSAP stack animation ───
  useLayoutEffect(() => {
    if (!maskRef.current || stack.length === 0) return;

    const children = Array.from(maskRef.current.children);
    const n = children.length;
    const isDown = entryDirRef.current === "down";

    children.forEach((child, i) => {
      gsap.killTweensOf(child);

      if (i === n - 1) {
        // Newest layer: enter direction depends on scroll direction
        const fromY = isDown ? 100 : -100;
        gsap.fromTo(
          child,
          { yPercent: fromY },
          { yPercent: 0, duration: 0.6, ease: "power2.out" },
        );
      } else {
        // Existing layers: read current position and nudge in the travel direction
        const currentY = gsap.getProperty(child, "yPercent") || 0;
        const delta = isDown ? -100 : 100;
        gsap.to(child, {
          yPercent: currentY + delta,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });
  }, [stack]);

  // ─── Push a new image layer ───
  const push = (project) => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    const currentIndex = PROJECTS.findIndex((p) => p.id === project.id);
    const currentDir = currentIndex >= lastIndexRef.current ? "down" : "up";
    lastIndexRef.current = currentIndex;

    // Direction flipped → reset stack to avoid huge position jumps
    if (entryDirRef.current !== currentDir && stack.length > 0) {
      entryDirRef.current = currentDir;
      setStack((prev) => {
        const last = prev[prev.length - 1];
        return [
          { ...last, id: nextId.current++ },
          { id: nextId.current++, src: project.image, alt: project.title },
        ];
      });
      return;
    }

    entryDirRef.current = currentDir;

    setStack((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].src === project.image)
        return prev;
      const next = [
        ...prev,
        { id: nextId.current++, src: project.image, alt: project.title },
      ];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  };

  // ─── Cascade exit when leaving the works content ───
  const exit = () => {
    if (!maskRef.current) return;

    const children = Array.from(maskRef.current.children);
    const isDown = entryDirRef.current === "down";
    children.forEach((child, i) => {
      gsap.killTweensOf(child);
      gsap.to(child, {
        yPercent: isDown
          ? -100 * (children.length - i)
          : 100 * (children.length - i),
        duration: 0.5,
        ease: "power2.in",
        delay: i * 0.05,
      });
    });

    exitTimeoutRef.current = setTimeout(() => {
      setStack([]);
      exitTimeoutRef.current = null;
    }, 700);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  return (
    <div className="page works-page">
      <div className="works-inner">
        <div className="works-title-wrapper">
          <h1 className="works-title">Works</h1>
        </div>

        <div className="works-list" onMouseLeave={exit}>
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="works-project"
              onMouseEnter={() => push(project)}
            >
              <a
                href={project.url === "#" ? undefined : project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="works-project-link-target"
                tabIndex={0}
                onClick={(e) => project.url === "#" && e.preventDefault()}
              >
                <div className="works-project-header">
                  <span className="works-year">{project.year}</span>
                  <h2 className="works-project-name">{project.title}</h2>
                </div>
                <div className="works-project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="works-tag">
                      {tag}
                    </span>
                  ))}
                  <span className="works-tag">{project.category}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Image stack mask */}
      <div
        ref={maskRef}
        className="works-hover-image"
        style={{
          transform: `translateY(${mouseY - window.innerHeight / 2}px)`,
        }}
      >
        {stack.map((layer) => (
          <div key={layer.id} className="works-hover-image-layer">
            <img
              src={layer.src}
              alt={layer.alt}
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
