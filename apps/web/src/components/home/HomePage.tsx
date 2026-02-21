import {
  ChangeEvent,
  RefObject,
  useMemo,
  useRef,
  useState
} from 'react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { StoredDesign } from '../../types/editor';

type TemplateDescriptor = {
  category: string;
  id: string;
  name: string;
};

type HomePageProps = {
  designs: StoredDesign[];
  onCreateDesign: () => void;
  onOpenDesign: (designId: string) => void;
  onOpenTemplate: (templateId: string) => void;
  onUploadAsset: (file: File) => Promise<void>;
  templates: TemplateDescriptor[];
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
  const [query, setQuery] = useState<string>('');
  const [tab, setTab] = useState<'recent' | 'templates'>('recent');
  const debouncedQuery = useDebouncedValue(query, 180);

  const filteredDesigns = useMemo((): StoredDesign[] => {
    /**
     * var: none
     * type: void
     * desc: Filters stored design cards using active home search query.
     */
    return props.designs.filter((design) => design.name.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, props.designs]);

  const filteredTemplates = useMemo((): TemplateDescriptor[] => {
    /**
     * var: none
     * type: void
     * desc: Filters template cards using active home search query.
     */
    return props.templates.filter((template) => template.name.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, props.templates]);

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
            <button className={`home-chip ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')} type="button">Recent designs</button>
            <button className={`home-chip ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')} type="button">Templates</button>
            <button className="home-chip" type="button">Open Canva AI</button>
          </div>
          <input className="home-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search designs, folders and uploads" type="text" value={query} />
          <div className="home-category-row">
            {DESIGN_CATEGORIES.map((category) => (
              <button className="home-category" key={category} onClick={props.onCreateDesign} type="button">{category}</button>
            ))}
          </div>
        </div>
        <div className="home-section-header">
          <h2>{tab === 'recent' ? 'Your designs' : 'Template gallery'}</h2>
          <button className="button-primary" onClick={() => uploadInputRef.current?.click()} type="button">Upload</button>
          <input accept=".svg,image/*" hidden onChange={handleUpload} ref={uploadInputRef} type="file" />
        </div>
        <div className="home-design-grid">
          {tab === 'recent' && filteredDesigns.map((design) => (
            <button className="home-design-card" key={design.id} onClick={() => props.onOpenDesign(design.id)} type="button">
              <div className="home-design-preview">{design.kind.toUpperCase()}</div>
              <p>{design.name}</p>
            </button>
          ))}
          {tab === 'recent' && filteredDesigns.length === 0 && <div className="home-empty">No designs found for this query.</div>}
          {tab === 'templates' && filteredTemplates.map((template) => (
            <button className="home-design-card" key={template.id} onClick={() => props.onOpenTemplate(template.id)} type="button">
              <div className="home-design-preview">{template.category}</div>
              <p>{template.name}</p>
            </button>
          ))}
          {tab === 'templates' && filteredTemplates.length === 0 && <div className="home-empty">No templates found for this query.</div>}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
