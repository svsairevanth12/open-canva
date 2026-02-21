import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './styles.css';

function renderApplication(): void {
  /**
   * var: none
   * type: void
   * desc: Mounts the React application to the root DOM node.
   */
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

renderApplication();
