// Siempre usa la variable de entorno VITE_API_BASE para la URL de la API.
// Si no está definida, lanza un error para evitar confusiones en producción.
export const API = (() => {
	const url = import.meta.env.VITE_API_BASE;
	if (!url) {
		throw new Error('VITE_API_BASE no está definida. Configura la URL de la API en el archivo .env o .env.production');
	}
	return url;
})();

// Cuando los usuarios del backend fueron reseedeados, los IDs válidos de prueba son 1..5
export const DEFAULT_USER_ID = Number(import.meta.env.VITE_DEFAULT_USER_ID || 1);
