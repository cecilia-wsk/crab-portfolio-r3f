import { useState, useEffect, useRef, useCallback } from "react";

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
    url: "#",
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
    title: "DNA Particules",
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
    tags: ["GLSL", "Three.js", "Shaders"],
    url: "https://visualdata-head.vercel.app/",
    image: "/assets/visualdata.webp",
  },
];

export default function WorksPage() {
  const [hovered, setHovered] = useState(null);
  const [mouseY, setMouseY] = useState(0);
  const imgRef = useRef(null);

  // Track cursor Y for the floating image
  const onMouseMove = useCallback((e) => {
    setMouseY(e.clientY);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);

  return (
    <div className="page works-page">
      <div className="works-inner">
        <div className="works-title-wrapper">
          <h1 className="works-title">Works</h1>
        </div>

        <div className="works-list">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="works-project"
              onMouseEnter={() => setHovered(project)}
              onMouseLeave={() => setHovered(null)}
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

      {/* Floating hover image — follows cursor Y */}
      <div
        ref={imgRef}
        className={`works-hover-image ${hovered ? "is-visible" : ""}`}
        style={
          hovered
            ? { transform: `translateY(${mouseY - window.innerHeight / 2}px)` }
            : undefined
        }
      >
        {hovered && (
          <img
            src={hovered.image}
            alt={hovered.title}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
