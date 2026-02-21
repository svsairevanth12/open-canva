function Sidebar(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Renders Canva-style left navigation and template previews.
   */
  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <button className="sidebar-nav-item" type="button">Templates</button>
        <button className="sidebar-nav-item" type="button">Elements</button>
        <button className="sidebar-nav-item" type="button">Text</button>
        <button className="sidebar-nav-item" type="button">Brand</button>
        <button className="sidebar-nav-item" type="button">Uploads</button>
        <button className="sidebar-nav-item" type="button">Tools</button>
        <button className="sidebar-nav-item" type="button">Projects</button>
        <button className="sidebar-nav-item" type="button">Apps</button>
      </div>
      <div className="sidebar-content">
        <h3>Quick Templates</h3>
        <div className="template-card">Instagram Post · 1080 × 1080</div>
        <div className="template-card">Presentation · 1920 × 1080</div>
        <div className="template-card">Story · 1080 × 1920</div>
        <h3>Quick Start</h3>
        <ul>
          <li>Upload an SVG from the top bar or canvas button.</li>
          <li>Use the right panel to edit text styles and object colors.</li>
          <li>Use layer controls to bring items front/back and lock them.</li>
          <li>Export to SVG or PNG anytime.</li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
