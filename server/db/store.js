import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory + File persisted data store
let store = {
  users: {
    "default-user": {
      id: "default-user",
      name: "Sanskriti Sharma",
      phone: "+91 9876543210",
      role: "Program Manager",
      organization: "State Education Transformation Cell",
      state: "Punjab",
      focusArea: "Foundational Literacy & Numeracy (FLN)",
      language: "English",
      onboarded: false
    }
  },
  conversations: [],
  feedbackLogs: [],
  knowledgeGaps: [],
  selectionLogs: [],
  config: JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'framework_templates.json'), 'utf-8'))
};

// Persistence helper
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

export const loadStore = () => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
      store = { ...store, ...data };
    }
  } catch (err) {
    console.error("Error loading store:", err);
  }
};

export const saveStore = () => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Error saving store:", err);
  }
};

loadStore();

export const getStore = () => store;
export const updateConfig = (newConfig) => {
  store.config = { ...store.config, ...newConfig };
  saveStore();
  return store.config;
};
