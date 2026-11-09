import type { DocumentStore } from './store';
export function getDocumentStore():Promise<DocumentStore>{return Promise.reject(new Error('Los documentos requieren la aplicación nativa cifrada.'));}
