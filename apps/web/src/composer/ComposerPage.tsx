import { useRef, useState, useCallback } from 'react';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './layout';
import { useMultiCanvasRenderer, type SlideConfig, type SharedConfig } from './useCanvasRenderer';

const MIN_SLIDES = 3;
const MAX_SLIDES = 5;

function createEmptySlide(): SlideConfig {
  return { screenshot: null, headline: '' };
}

export function ComposerPage() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const [slides, setSlides] = useState<SlideConfig[]>(() =>
    Array.from({ length: MIN_SLIDES }, createEmptySlide)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [shared, setShared] = useState<SharedConfig>({
    backgroundTop: '#0f172a',
    backgroundBottom: '#38bdf8',
  });

  const { mockupLoaded, mockupError, downloadAll, downloadOne } =
    useMultiCanvasRenderer(canvasRefs, slides, shared);

  const updateSlide = useCallback((index: number, patch: Partial<SlideConfig>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }, []);

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    setSlides((prev) => [...prev, createEmptySlide()]);
    setActiveIndex(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= MIN_SLIDES) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => Math.min(prev, slides.length - 2));
  };

  const onFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => updateSlide(index, { screenshot: img });
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const setCanvasRef = (index: number, el: HTMLCanvasElement | null) => {
    canvasRefs.current[index] = el;
  };

  return (
    <main className="composer-shell">
      <section className="hero">
        <p className="eyebrow">Screenshot Composer</p>
        <h1>Create App Store screenshots instantly.</h1>
        <p className="hero-copy">
          Upload your app screens, add headlines, and download store-ready 1242x2688 mockups.
        </p>
      </section>

      <div className="composer-layout">
        <section className="composer-panel">
          <div className="composer-form">
            <h3 className="section-title">Background</h3>

            <label className="field">
              <span>Gradient Top</span>
              <div className="color-input">
                <input
                  type="color"
                  value={shared.backgroundTop}
                  onChange={(e) => setShared((s) => ({ ...s, backgroundTop: e.target.value }))}
                />
                <input
                  type="text"
                  value={shared.backgroundTop}
                  onChange={(e) => setShared((s) => ({ ...s, backgroundTop: e.target.value }))}
                />
              </div>
            </label>

            <label className="field">
              <span>Gradient Bottom</span>
              <div className="color-input">
                <input
                  type="color"
                  value={shared.backgroundBottom}
                  onChange={(e) => setShared((s) => ({ ...s, backgroundBottom: e.target.value }))}
                />
                <input
                  type="text"
                  value={shared.backgroundBottom}
                  onChange={(e) => setShared((s) => ({ ...s, backgroundBottom: e.target.value }))}
                />
              </div>
            </label>

            <div className="slides-section">
              <div className="slides-header">
                <h3 className="section-title" style={{ border: 'none', paddingBottom: 0, boxShadow: 'none' }}>
                  Slides
                </h3>
                <span className="slide-count">{slides.length} / {MAX_SLIDES}</span>
              </div>

              {slides.map((slide, i) => (
                <div
                  key={i}
                  className={`slide-item${i === activeIndex ? ' active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <div className="slide-header">
                    <span className="slide-number">#{i + 1}</span>
                    {slides.length > MIN_SLIDES && (
                      <button
                        className="slide-remove"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(i);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="slide-fields">
                    <label className="field" onClick={(e) => e.stopPropagation()}>
                      <span>Screenshot</span>
                      <input type="file" accept="image/*" onChange={(e) => onFileChange(i, e)} />
                    </label>
                    <label className="field" onClick={(e) => e.stopPropagation()}>
                      <span>Headline</span>
                      <input
                        type="text"
                        value={slide.headline}
                        onChange={(e) => updateSlide(i, { headline: e.target.value })}
                        placeholder="Enter headline text"
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                className="add-slide-button"
                type="button"
                onClick={addSlide}
                disabled={slides.length >= MAX_SLIDES}
              >
                + Add Slide
              </button>
            </div>

            <div className="download-section">
              <button
                className="primary-button"
                type="button"
                onClick={downloadAll}
                disabled={!mockupLoaded}
              >
                Download All
              </button>
            </div>
          </div>

          {mockupError && <p className="error-text">{mockupError}</p>}
          {!mockupLoaded && !mockupError && <p className="status">Loading mockup frame...</p>}
        </section>

        <section className="composer-preview">
          <div className="preview-grid">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`preview-item${i === activeIndex ? ' active' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <canvas
                  ref={(el) => setCanvasRef(i, el)}
                  style={{
                    aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  }}
                />
                <span className="preview-label">
                  #{i + 1}
                  {' '}
                  <button
                    className="secondary-button"
                    type="button"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadOne(i);
                    }}
                    disabled={!mockupLoaded}
                  >
                    Download
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
