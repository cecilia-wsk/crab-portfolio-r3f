export default function AboutPage() {
  return (
    <div className="page about-page">
      <div className="about-content">
        <div className="section-title about-title-wrapper">
          <div className="ui-headline-line">
            <h2 className="about-title">About</h2>
          </div>
        </div>
        <div className="section-body about-body">
          <p className="about-reveal-p1">
            Hi, I'm Cecilia Wielonsky, a creative developer and UX/UI designer,
            based in Barcelona with over 9 years of experience in the tech
            industry. I craft immersive web experiences using three.js, shaders,
            and modern JavaScript.
          </p>
          <p className="about-reveal-p2">
            I started as a front-end developer and later discovered my passion
            for creative coding, which led me to explore the intersection of
            design and technology. My focus for the past few years has been
            front-end development with a strong interest in 3D and shaders magic
            ✨
          </p>
          <div className="about-reveal-resume">
            <a
              href="/assets/cv_cecilia_wielonsky.pdf"
              download
              className="ui-social-link"
            >
              <img
                src="/assets/arrow-external.svg"
                alt=""
                className="ui-social-arrow"
                aria-hidden="true"
              />
              Download my resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
