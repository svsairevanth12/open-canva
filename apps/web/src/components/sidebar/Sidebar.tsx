function Sidebar(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Renders left-side panel with quick guidance and editing flow details.
   */
  return (
    <aside className="sidebar">
      <h3>Design Panel</h3>
      <div className="sidebar-card">
        <h4>Getting Started</h4>
        <ol>
          <li>Click <strong>Upload SVG</strong> in the top bar.</li>
          <li>Select objects on the canvas to move or delete.</li>
          <li>Use Text, Shapes, and Image buttons to build designs.</li>
          <li>Export your work as SVG or PNG.</li>
        </ol>
      </div>
      <div className="sidebar-card">
        <h4>Canvas Tips</h4>
        <ul>
          <li>Drag and drop SVG or image files directly on the canvas.</li>
          <li>Use arrow controls to nudge selected elements.</li>
          <li>Use Edit Group to tweak imported SVG group children.</li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
