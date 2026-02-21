import {
  ChangeEvent,
  RefObject,
  useRef
} from 'react';

import type { StoredDesign } from '../../types/editor';

type HomePageProps = {
  designs: StoredDesign[];
  onCreateDesign: () => void;
  onOpenDesign: (designId: string) => void;
  onUploadAsset: (file: File) => Promise<void>;
};

const DESIGN_CATEGORIES = [
  'Presentation',
  'Social media',
  'Video',
  'Printables',
  'Doc',
  'Whiteboard',
  'Sheet',
  'Website',
  'Email',
  'Photo editor',
  'Custom size',
  'Upload'
];

function HomePage(props: HomePageProps): JSX.Element {
  /**
   * var: props
   * type: HomePageProps
   * desc: Handlers and persistent design data required for the home workspace.
   */
  const uploadInputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Upload input event containing selected asset payload.
     */
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    await props.onUploadAsset(file);
    event.target.value = '';
  };

  return (
    <section className="home-page">
      <aside className="home-left-rail">
        <button className="home-rail-create" onClick={props.onCreateDesign} type="button">Create</button>
        <button className="home-rail-item" type="button">Home</button>
        <button className="home-rail-item" type="button">Projects</button>
        <button className="home-rail-item" type="button">Templates</button>
        <button className="home-rail-item" type="button">Brand</button>
      </aside>
      <div className="home-main">
        <div className="home-hero">
          <h1>What do you want to edit today?</h1>
          <div className="home-chip-row">
            <button className="home-chip active" type="button">Your designs</button>
            <button className="home-chip" type="button">Templates</button>
            <button className="home-chip" type="button">Open Canva AI</button>
          </div>
          <div className="home-search">Search designs, folders and uploads</div>
          <div className="home-category-row">
            {DESIGN_CATEGORIES.map((category) => (
              <button className="home-category" key={category} onClick={props.onCreateDesign} type="button">{category}</button>
            ))}
          </div>
        </div>
        <div className="home-section-header">
          <h2>Your designs</h2>
          <button className="button-primary" onClick={() => uploadInputRef.current?.click()} type="button">Upload</button>
          <input accept=".svg,image/*" hidden onChange={handleUpload} ref={uploadInputRef} type="file" />
        </div>
        <div className="home-design-grid">
          {props.designs.map((design) => (
            <button className="home-design-card" key={design.id} onClick={() => props.onOpenDesign(design.id)} type="button">
              <div className="home-design-preview">{design.kind.toUpperCase()}</div>
              <p>{design.name}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
