import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API, DEFAULT_USER_ID } from '../api';
import { AuthContext } from '../auth/AuthContext';
import './PerfilUsuario.css';

export default function PerfilUsuario() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagResults, setDiagResults] = useState([]);
  
  // Form states
  const [activeTab, setActiveTab] = useState('perfil');
  const [editForm, setEditForm] = useState({
    nombre: user?.nombre ?? user?.Nombre ?? '',
    apellido: user?.apellido ?? user?.Apellido ?? '',
    email: user?.email ?? user?.Email ?? '',
    telefono: user?.telefono ?? user?.Telefono ?? ''
  });
  const [addrForm, setAddrForm] = useState({
    calle: '',
    telefono: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    pais: 'Perú',
    alias: 'Casa',
    esPrincipal: false
  });
  // edit mode ids
  const [addrEditId, setAddrEditId] = useState(null)

  // Load user data
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId ?? DEFAULT_USER_ID;

    const fetchData = async () => {
      try {
        const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        // Build headers with Accept to reduce 415 responses
        const headersWithAccept = { ...headers, Accept: 'application/json' }

        // Helper to try a sequence of GET endpoints for a resource
        async function tryFetchResource(resource) {
          // order: ?usuarioId, ?userId, /resource/usuario/{id}, /resource/usuario (token-only), /resource (all) then filter
          let r = null
          // Only abort on 415 (unsupported media type); for 400/405 keep trying other endpoints
          const stopOnStatuses = new Set([415])

          // helper to attempt and stop on certain status codes
          async function attempt(url, opts) {
            try {
              const res = await axios.get(url, opts)
              return res
            } catch (e) {
              const status = e?.response?.status
              if (status && stopOnStatuses.has(status)) {
                // server indicates this method/route is not supported — abort further tries
                return { abort: true, status }
              }
              return null
            }
          }

          // 1) /resource/usuario/{id}
          r = await attempt(`${API}/${resource}/usuario/${userId}`, { headers: headersWithAccept })
          if (r && r.abort) return []
          if (r && r.data) return r.data

          // 2) /resource?usuarioId=...
          r = await attempt(`${API}/${resource}`, { params: { usuarioId: userId }, headers: headersWithAccept })
          if (r && r.abort) return []
          if (r && r.data) return r.data

          // 3) /resource?userId=...
          r = await attempt(`${API}/${resource}`, { params: { userId: userId }, headers: headersWithAccept })
          if (r && r.abort) return []
          if (r && r.data) return r.data

          // 4) /resource/usuario (token-based)
          r = await attempt(`${API}/${resource}/usuario`, { headers: headersWithAccept })
          if (r && r.abort) return []
          if (r && r.data) return r.data

          // 5) fetch all and filter
          try {
            const all = await axios.get(`${API}/${resource}`, { headers: headersWithAccept })
            if (Array.isArray(all.data)) return all.data.filter(item => String(item.usuarioId || item.UsuarioId || item.userId || item.usuario) === String(userId))
          } catch (e) {
            // if this fails with stop status, abort
            const status = e?.response?.status
            if (status && stopOnStatuses.has(status)) return []
          }

          return []
        }

        // Fetch only addresses
        const fDirs = await tryFetchResource('Direcciones');
        setDirecciones(Array.isArray(fDirs) ? fDirs : []);
        
        // It's valid for a user to have no addresses yet.
        // Don't surface an error page just for empty lists; keep UI showing empty states.
        if (!fDirs || fDirs.length === 0) {
          console.warn('[PerfilUsuario] usuario sin direcciones. No es un error crítico.');
        }
      } catch (e) {
        console.error('[PerfilUsuario] unexpected fetch error', e)
        setError(e.message || String(e))
      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, [user, navigate]);

  // Adopt tab from URL (supports /perfil/direcciones, /perfil/pagos or ?tab=direcciones)
  useEffect(() => {
    try {
      const path = location?.pathname || '';
      const search = location?.search || '';
      if (path.includes('/perfil/')) {
        if (path.includes('direcciones')) setActiveTab('direcciones');
        else if (path.includes('pagos')) setActiveTab('pagos');
        else if (path.includes('perfil')) setActiveTab('perfil');
      }
      if (search) {
        const params = new URLSearchParams(search);
        const t = params.get('tab');
        if (t) setActiveTab(t);
      }
    } catch {}
  }, [location?.pathname, location?.search]);

  // Diagnostics helper: probe common user endpoints to see what responds
  const runDiagnostics = async () => {
    setDiagResults([]);
    const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId;
    if (!userId) {
      setDiagResults([{ ok: false, url: 'N/A', info: 'No hay userId' }]);
      return;
    }

    const token = user?.token || user?.accessToken || user?.jwt || user?.authToken;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const probes = [
  { method: 'get', url: `${API}/Usuarios/${userId}` },
  { method: 'get', url: `${API}/Auth/me/${userId}` },
  { method: 'put', url: `${API}/Auth/me/${userId}`, body: { Nombre: editForm.nombre } },
  { method: 'put', url: `${API}/Usuarios/${userId}`, body: { Nombre: editForm.nombre } },
  { method: 'put', url: `${API}/Auth/me`, body: { UsuarioId: userId, ...editForm } },
    ];

    const results = [];
    for (const p of probes) {
      try {
        let res;
        if (p.method === 'get') res = await axios.get(p.url, { headers });
        else if (p.method === 'put') res = await axios.put(p.url, p.body, { headers });
        else res = await axios({ method: p.method, url: p.url, data: p.body, headers });

        results.push({ ok: true, url: p.url, method: p.method.toUpperCase(), status: res.status, data: res.data });
      } catch (e) {
        results.push({ ok: false, url: p.url, method: p.method.toUpperCase(), status: e.response?.status || null, data: e.response?.data || e.message });
      }
    }

    setDiagResults(results);
    // also log to console for easier copy/paste
    console.group('[PerfilUsuario] diagnostics');
    console.log(results);
    console.groupEnd();
  };

  // Helper: remove empty string / undefined fields from payload
  function sanitizePayload(obj){
    const out = {}
    Object.keys(obj || {}).forEach(k => {
      const v = obj[k]
      if (v === undefined) return
      if (typeof v === 'string' && v.trim() === '') return
      out[k] = v
    })
    return out
  }

  // Build address payload matching backend Direcciones table (no Region column)
  function buildAddressPayload(userId, form) {
    const regionVal = form?.Region || form?.region || form?.estado || ''
    return sanitizePayload({
      usuarioId: userId,
      alias: form?.alias,
      calle: form?.calle,
      telefono: form?.telefono,
      ciudad: form?.ciudad,
      estado: form?.estado,
      Region: regionVal,
      codigoPostal: form?.codigoPostal,
      pais: form?.pais,
      esPrincipal: !!form?.esPrincipal,
    })
  }

  // Handle form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddrChange = (e) => {
    const { name, value } = e.target;
    setAddrForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardForm(prev => ({ ...prev, [name]: value }));
  };

  // Form submissions
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId;
  const payload = sanitizePayload(editForm)
  console.debug('[PerfilUsuario] guardar perfil, payload:', payload, 'userId:', userId);
  // Prefer updateUser helper (it tries multiple endpoints) but pass sanitized payload
  await updateUser(userId, payload);
      alert('Perfil actualizado correctamente');
    } catch (e) {
      // Log full error for debugging
  console.error('[PerfilUsuario] updateUser error', e?.response?.status, e?.response?.data || e.message || e);

      // Try sensible fallbacks to match backend expectations (Usuarios/{id}, Auth/me without id)
      const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId;
  const payload = sanitizePayload(editForm);

      try {
        const r1 = await axios.put(`${API}/Usuarios/${userId}`, payload);
        console.info('[PerfilUsuario] update via /Usuarios/{id} succeeded', r1.status);
        alert('Perfil actualizado correctamente (vía Usuarios/{id})');
        return;
      } catch (e1) {
        console.warn('[PerfilUsuario] put /Usuarios/{id} failed', e1?.response?.status, e1?.response?.data || e1.message || e1);
      }

      try {
        const r2 = await axios.patch(`${API}/Usuarios/${userId}`, payload);
        console.info('[PerfilUsuario] patch /Usuarios/{id} succeeded', r2.status);
        alert('Perfil actualizado correctamente (vía PATCH Usuarios/{id})');
        return;
      } catch (e2) {
        console.warn('[PerfilUsuario] patch /Usuarios/{id} failed', e2?.response?.status, e2?.response?.data || e2.message || e2);
      }

      try {
        const r3 = await axios.put(`${API}/Auth/me`, { usuarioId: userId, ...payload });
        console.info('[PerfilUsuario] put /Auth/me (no id) succeeded', r3.status);
        alert('Perfil actualizado correctamente (vía Auth/me)');
        return;
      } catch (e3) {
        console.warn('[PerfilUsuario] put /Auth/me failed', e3?.response?.status, e3?.response?.data || e3.message || e3);
      }

      // If all fallbacks failed, show detailed error to user for debugging
  const status = e?.response?.status;
  const data = e?.response?.data;
  alert('Error al actualizar perfil. Código: ' + (status || 'N/A') + '\nRespuesta: ' + (data ? (typeof data === 'string' ? data : JSON.stringify(data)) : (e.message || String(e))));
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId;
      if (addrEditId) {
        // update existing
        await updateAddress(addrEditId, buildAddressPayload(userId, addrForm))
        return
      }
      const response = await axios.post(`${API}/Direcciones`, buildAddressPayload(userId, addrForm));
      setDirecciones([...direcciones, response.data]);
      setAddrForm({ calle: '', ciudad: '', estado: '', codigoPostal: '', pais: 'Perú', alias: 'Casa', telefono: '', esPrincipal: false });
  setAddrEditId(null);
  setActiveTab('direcciones');
      alert('Dirección agregada correctamente');
    } catch (e) {
      console.error('[PerfilUsuario] add address error', e?.response?.status, e?.response?.data || e.message || e);
      alert('Error al agregar dirección: ' + (e.response?.data?.message || (e.response?.data ? JSON.stringify(e.response.data) : e.message)));
    }
  };

  async function updateAddress(id, payload) {
    try {
      // try PUT then PATCH
      try {
        const r = await axios.put(`${API}/Direcciones/${id}`, payload);
        setDirecciones(prev => prev.map(d => (String(d.direccionId ?? d.id) === String(id) ? r.data || { ...d, ...payload } : d)));
        alert('Dirección actualizada');
  setAddrForm({ calle: '', ciudad: '', estado: '', codigoPostal: '', pais: 'Perú', alias: 'Casa', telefono: '', esPrincipal: false });
        setAddrEditId(null);
        setActiveTab('direcciones');
        return
      } catch (e) {
        console.debug('[PerfilUsuario] PUT /Direcciones/{id} failed', e.response?.status || e.message)
      }

      try {
        const r2 = await axios.patch(`${API}/Direcciones/${id}`, payload);
        setDirecciones(prev => prev.map(d => (String(d.direccionId ?? d.id) === String(id) ? r2.data || { ...d, ...payload } : d)));
        alert('Dirección actualizada');
  setAddrForm({ calle: '', ciudad: '', estado: '', codigoPostal: '', pais: 'Perú', alias: 'Casa', telefono: '', esPrincipal: false });
        setAddrEditId(null);
        setActiveTab('direcciones');
        return
      } catch (e) {
        console.debug('[PerfilUsuario] PATCH /Direcciones/{id} failed', e.response?.status || e.message)
      }

      alert('No se pudo actualizar la dirección. Ver consola para más detalles.');
    } catch (e) {
      alert('Error al actualizar dirección: ' + (e.response?.data?.message || e.message));
    }
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta dirección?')) return;
    try {
      await axios.delete(`${API}/Direcciones/${id}`);
      setDirecciones(direcciones.filter(addr => addr.direccionId !== id && addr.id !== id));
    } catch (e) {
      alert('Error al eliminar dirección: ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading) {
    return (
      <div className="ae-loading">
        <div className="ae-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ae-error">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="ae-retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="ae-profile-container">
      {/* Header */}
      <div className="ae-profile-header">
        <div className="ae-user-info">
          <div className="ae-avatar">
            {user?.nombre?.charAt(0) || user?.Nombre?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h2>{user?.nombre ?? user?.Nombre ?? 'Usuario'}</h2>
            <p className="ae-user-email">{user?.email ?? user?.Email}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="ae-logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Diagnostics panel (dev helper) */}
      <div style={{ margin: '10px 0' }}>
        <button onClick={runDiagnostics} className="ae-add-btn">Probar endpoints de usuario (diagnóstico)</button>
        {diagResults.length > 0 && (
          <div style={{ marginTop: 8, background: '#fff', padding: 8, borderRadius: 6 }}>
            <strong>Resultados:</strong>
            <ul>
              {diagResults.map((r, i) => (
                <li key={i} style={{ fontSize: 12 }}>
                  {r.method || 'GET'} {r.url} — {r.ok ? `OK ${r.status}` : `ERROR ${r.status || ''}`} {r.data && typeof r.data === 'string' ? `: ${r.data}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="ae-profile-tabs">
        <button 
          className={`ae-tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          <span>Mi perfil</span>
        </button>
        <button 
          className={`ae-tab-btn ${activeTab === 'direcciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('direcciones')}
        >
          <span>Mis direcciones</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'perfil' && (
        <div className="ae-profile-section">
          <h3>Información personal</h3>
          <form onSubmit={handleSaveProfile} className="ae-profile-form">
            <div className="ae-form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={editForm.nombre}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={editForm.apellido}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                required
                disabled
              />
            </div>
            <div className="ae-form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={editForm.telefono}
                onChange={handleEditChange}
              />
            </div>
            <button type="submit" className="ae-save-btn">Guardar cambios</button>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'direcciones' && (
        <div className="ae-profile-section">
          <div className="ae-section-header">
            <h3>Mis direcciones</h3>
            <button 
              className="ae-add-btn"
              onClick={() => setActiveTab('nueva-direccion')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Añadir dirección
            </button>
          </div>

          {direcciones.length === 0 ? (
            <div className="ae-empty-state">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <p>No tienes direcciones guardadas</p>
            </div>
          ) : (
            <div className="ae-address-grid">
              {direcciones.map(addr => (
                    <div key={addr.direccionId || addr.id} className="ae-address-card">
                      <div className="ae-address-header">
                        <h4>{addr.alias || 'Dirección'}</h4>
                        <div style={{display:'flex',gap:8}}>
                          <button className="ae-secondary-button" onClick={() => {
                            // start edit
                            setAddrEditId(addr.direccionId || addr.id)
                            setAddrForm({ alias: addr.alias || 'Casa', calle: addr.calle || addr.linea || addr.direccion || '', telefono: addr.telefono || addr.telefonoNumero || '', ciudad: addr.ciudad || '', estado: addr.estado || addr.region || addr.Region || '', codigoPostal: addr.codigoPostal || addr.codigo || '', pais: addr.pais || 'Perú' })
                            setActiveTab('nueva-direccion')
                          }}>Editar</button>
                          <button 
                            onClick={() => handleDeleteAddress(addr.direccionId || addr.id)}
                            className="ae-delete-btn"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <p>{addr.calle || addr.linea || addr.direccion}</p>
                      <p>{addr.ciudad}, {addr.estado}</p>
                      <p>{addr.codigoPostal || addr.codigo}, {addr.pais}</p>
                      { (addr.telefono || addr.telefonoNumero) && <p>Tel: {addr.telefono || addr.telefonoNumero}</p> }
                    </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Address Tab */}
      {activeTab === 'nueva-direccion' && (
        <div className="ae-profile-section">
          <div className="ae-section-header">
            <button 
              className="ae-back-btn"
              onClick={() => setActiveTab('direcciones')}
            >
              ← Volver
            </button>
            <h3>Añadir nueva dirección</h3>
          </div>

          <form onSubmit={handleAddAddress} className="ae-profile-form">
            <div className="ae-form-group">
              <label>Alias (ej. Casa, Oficina)</label>
              <input
                type="text"
                name="alias"
                value={addrForm.alias}
                onChange={handleAddrChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Calle y número</label>
              <input
                type="text"
                name="calle"
                value={addrForm.calle}
                onChange={handleAddrChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={addrForm.ciudad}
                onChange={handleAddrChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Departamento/Estado</label>
              <input
                type="text"
                name="estado"
                value={addrForm.estado}
                onChange={handleAddrChange}
                required
              />
            </div>
            <div className="ae-form-group">
              <label>Código postal</label>
              <input
                type="text"
                name="codigoPostal"
                value={addrForm.codigoPostal}
                onChange={handleAddrChange}
              />
            </div>
            <div className="ae-form-group">
              <label>País</label>
              <select
                name="pais"
                value={addrForm.pais}
                onChange={handleAddrChange}
              >
                <option value="Perú">Perú</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Colombia">Colombia</option>
                <option value="México">México</option>
                <option value="España">España</option>
              </select>
            </div>
            <div className="ae-form-group ae-switch-group">
              <label className="ae-switch">
                <input type="checkbox" name="esPrincipal" checked={!!addrForm.esPrincipal} onChange={(e)=> setAddrForm(prev=>({...prev, esPrincipal: e.target.checked}))} />
                <span className="ae-slider"></span>
              </label>
              <span>Marcar como dirección principal</span>
            </div>
            <button type="submit" className="ae-save-btn">Guardar dirección</button>
          </form>
        </div>
      )}


    </div>
  );
}