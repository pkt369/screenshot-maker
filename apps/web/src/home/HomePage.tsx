// Design Ref: §2.2 — iPad card activated with Link to /ipad
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-hero">
        <p className="eyebrow">Screenshot Maker</p>
        <h1>Create beautiful app screenshots.</h1>
        <p className="home-hero-copy">
          Choose your platform and device to get started.
        </p>
      </section>

      <div className="home-content">
        {/* Plan SC: SC-01 — Apple/Android 섹션, iPad 카드 활성화 */}
        <section className="device-section">
          <h2 className="section-heading">Apple</h2>
          <div className="device-grid">
            <Link to="/iphone" className="device-card">
              <span className="device-icon">iPhone</span>
              <span className="device-name">iPhone</span>
              <span className="device-desc">
                App Store screenshots (1242×2688)
              </span>
            </Link>
            <Link to="/ipad" className="device-card">
              <span className="device-icon">iPad</span>
              <span className="device-name">iPad</span>
              <span className="device-desc">
                App Store screenshots (2048×2732)
              </span>
            </Link>
          </div>
        </section>

        <section className="device-section">
          <h2 className="section-heading">Android</h2>
          <div className="device-grid">
            <div className="device-card disabled">
              <span className="device-icon">Galaxy</span>
              <span className="device-name">Galaxy</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            <div className="device-card disabled">
              <span className="device-icon">Design</span>
              <span className="device-name">Graphic Design</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
