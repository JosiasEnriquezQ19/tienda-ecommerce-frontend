# Tienda Frontend (Ejemplo)

Frontend React (Vite) de ejemplo para consumir la API ASP.NET Core descrita en `BACKEND DOCUMENTACION.txt`.

Requisitos:
- Node.js y npm instalados
- La API backend debe estar corriendo en `http://localhost:5184` (o ajustar `VITE_API_BASE`)

Pasos (PowerShell):

```powershell
cd "D:\4 CICLO\HERRAMIENTAS DE PROGRAMACION 2\TiendaFrontend\tienda-frontend"
npm install
# Ejecutar en dev mode
npm run dev
```

Variables de entorno (opcional):
- Crea un archivo `.env` en la raíz con `VITE_API_BASE=http://localhost:5184/api` si la API usa otra URL.

Qué incluye:
- Listado de productos (GET /api/Productos)
- Detalle de producto y botón para añadir al carrito
- Carrito local (localStorage)
- Checkout que hace POST a `/api/Pedidos/usuario/{userId}`

Notas:
- La app asume que la API permite CORS desde `http://localhost:3000` según la documentación, pero Vite usa por defecto `http://localhost:5173`; si hay problemas con CORS, arranca React en el puerto 3000 o ajusta la política CORS en backend.
- Puedo añadir autenticación, manejo de direcciones/metodos de pago y formularios más completos si lo deseas.

## Nota sobre CORS y puerto de desarrollo

La API en la documentación permite CORS para `http://localhost:3000`. Para evitar problemas de CORS es recomendable arrancar Vite en el puerto 3000 y usar el proxy integrado (ya configurado en `vite.config.js`).

Usa los siguientes comandos en PowerShell:

```powershell
cd "D:\4 CICLO\HERRAMIENTAS DE PROGRAMACION 2\TiendaFrontend\tienda-frontend"
npm install
npm run dev
```

Esto iniciará el dev server en `http://localhost:3000` y cualquier petición a `/api/*` será reenviada a `http://localhost:5184`.

## Checklist rápido

- Backend corriendo en `http://localhost:5184` (ver `BACKEND DOCUMENTACION.txt`).
- Node.js y npm instalados.

## Comandos PowerShell

```powershell
cd "D:\4 CICLO\HERRAMIENTAS DE PROGRAMACION 2\TiendaFrontend\tienda-frontend"
npm install
npm run dev
```
