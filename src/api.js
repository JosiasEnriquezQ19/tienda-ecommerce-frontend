// Usamos VITE_API_BASE como prioridad (para Vercel/Producción), 
// y configuramos tu URL actual como respaldo por defecto.
export const API = import.meta.env.VITE_API_BASE || 'https://simple-marketplace-api.onrender.com/api';

// Cuando los usuarios del backend fueron reseedeados, los IDs válidos de prueba son 1..5
export const DEFAULT_USER_ID = Number(import.meta.env.VITE_DEFAULT_USER_ID || 1);

