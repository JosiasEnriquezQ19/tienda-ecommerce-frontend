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
  const [activeTab, setActiveTab] = useState('perfil');
  const [addrEditId, setAddrEditId] = useState(null);

  const [editForm, setEditForm] = useState({
    nombre: user?.nombre ?? user?.Nombre ?? '',
    apellido: user?.apellido ?? user?.Apellido ?? '',
    email: user?.email ?? user?.Email ?? '',
    telefono: user?.telefono ?? user?.Telefono ?? ''
  });

  const [addrForm, setAddrForm] = useState({
    calle: '', telefono: '', ciudad: '', estado: '',
    codigoPostal: '', pais: 'Perú', alias: 'Casa', esPrincipal: false
  });

  const userId = user?.usuarioId ?? user?.UsuarioId ?? user?.id ?? user?.userId ?? DEFAULT_USER_ID;
  const userPhoto = user?.fotoUrl || user?.photoURL || user?.avatar || null;
  const userInitial = (user?.nombre || user?.Nombre || user?.email || 'U')[0].toUpperCase();

  // Load data
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    (async () => {
      try {
        const token = user?.token || user?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let dirs = [];
        // Try various endpoints
        try { const r = await axios.get(`${API}/Direcciones/usuario/${userId}`, { headers }); dirs = r.data; } catch {
          try { const r = await axios.get(`${API}/Direcciones`, { params: { usuarioId: userId }, headers }); dirs = r.data; } catch {
            try { const r = await axios.get(`${API}/Direcciones`, { headers }); dirs = (r.data || []).filter(d => String(d.usuarioId || d.UsuarioId) === String(userId)); } catch { }
          }
        }
        setDirecciones(Array.isArray(dirs) ? dirs : []);
      } catch (e) {
        setError(e.message);
      } finally { setLoading(false); }
    })();
  }, [user, navigate, userId]);

  // Tab from URL
  useEffect(() => {
    const path = location?.pathname || '';
    if (path.includes('direcciones')) setActiveTab('direcciones');
    const params = new URLSearchParams(location?.search || '');
    if (params.get('tab')) setActiveTab(params.get('tab'));
  }, [location]);

  // Helpers
  const sanitize = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== '') out[k] = v; });
    return out;
  };

  const handleEdit = (e) => {
    const { name, value } = e.target;
    setEditForm(p => ({ ...p, [name]: value }));
  };

  const handleAddr = (e) => {
    const { name, value } = e.target;
    setAddrForm(p => ({ ...p, [name]: value }));
  };

  // Save profile
  const saveProfile = async (e) => {
    e.preventDefault();
    const payload = sanitize(editForm);
    try {
      await updateUser(userId, payload);
      alert('Perfil actualizado correctamente');
    } catch {
      // Fallbacks
      try { await axios.put(`${API}/Usuarios/${userId}`, payload); alert('Perfil actualizado'); return; } catch { }
      try { await axios.patch(`${API}/Usuarios/${userId}`, payload); alert('Perfil actualizado'); return; } catch { }
      alert('Error al actualizar perfil');
    }
  };

  // Save address
  const saveAddress = async (e) => {
    e.preventDefault();
    const payload = sanitize({ usuarioId: userId, ...addrForm });
    try {
      if (addrEditId) {
        try { const r = await axios.put(`${API}/Direcciones/${addrEditId}`, payload); setDirecciones(p => p.map(d => String(d.direccionId ?? d.id) === String(addrEditId) ? r.data || { ...d, ...payload } : d)); } catch {
          const r = await axios.patch(`${API}/Direcciones/${addrEditId}`, payload);
          setDirecciones(p => p.map(d => String(d.direccionId ?? d.id) === String(addrEditId) ? r.data || { ...d, ...payload } : d));
        }
        alert('Dirección actualizada');
      } else {
        const r = await axios.post(`${API}/Direcciones`, payload);
        setDirecciones(p => [...p, r.data]);
        alert('Dirección agregada');
      }
      setAddrForm({ calle: '', telefono: '', ciudad: '', estado: '', codigoPostal: '', pais: 'Perú', alias: 'Casa', esPrincipal: false });
      setAddrEditId(null);
      setActiveTab('direcciones');
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await axios.delete(`${API}/Direcciones/${id}`);
      setDirecciones(p => p.filter(d => (d.direccionId || d.id) !== id));
    } catch (e) { alert('Error al eliminar'); }
  };

  const startEditAddr = (addr) => {
    setAddrEditId(addr.direccionId || addr.id);
    setAddrForm({
      alias: addr.alias || 'Casa',
      calle: addr.calle || addr.linea || addr.direccion || '',
      telefono: addr.telefono || '',
      ciudad: addr.ciudad || '',
      estado: addr.estado || addr.region || '',
      codigoPostal: addr.codigoPostal || '',
      pais: addr.pais || 'Perú',
      esPrincipal: !!addr.esPrincipal
    });
    setActiveTab('nueva-direccion');
  };

  // States
  if (loading) return (
    <div className="pf"><div className="pf-center"><div className="pf-spinner" /><p>Cargando perfil...</p></div></div>
  );
  if (error) return (
    <div className="pf"><div className="pf-center"><p>{error}</p><button onClick={() => window.location.reload()} className="pf-btn pf-btn-primary">Reintentar</button></div></div>
  );

  return (
    <div className="pf">

      {/* ── Header ── */}
      <div className="pf-header">
        <div className="pf-photo">
          {userPhoto ? <img src={userPhoto} alt="Foto de perfil" /> : userInitial}
        </div>
        <div className="pf-user-info">
          <h2>{user?.nombre ?? user?.Nombre ?? 'Usuario'} {user?.apellido ?? user?.Apellido ?? ''}</h2>
          <p>{user?.email ?? user?.Email}</p>
        </div>
        <button className="pf-logout" onClick={() => { logout(); navigate('/'); }}>
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Cerrar sesión
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="pf-tabs">
        {['perfil', 'direcciones'].map(t => (
          <button key={t} className={`pf-tab ${activeTab === t ? 'on' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'perfil' ? 'Mi perfil' : 'Mis direcciones'}
          </button>
        ))}
      </div>

      {/* ── Tab: Perfil ── */}
      {activeTab === 'perfil' && (
        <div className="pf-section">
          <h3>Información personal</h3>
          <form className="pf-form" onSubmit={saveProfile}>
            <div className="pf-row">
              <div className="pf-field">
                <label>Nombre</label>
                <input type="text" name="nombre" value={editForm.nombre} onChange={handleEdit} required />
              </div>
              <div className="pf-field">
                <label>Apellido</label>
                <input type="text" name="apellido" value={editForm.apellido} onChange={handleEdit} />
              </div>
            </div>
            <div className="pf-field">
              <label>Correo electrónico</label>
              <input type="email" name="email" value={editForm.email} disabled />
            </div>
            <div className="pf-field">
              <label>Teléfono</label>
              <input type="tel" name="telefono" value={editForm.telefono} onChange={handleEdit} placeholder="Ej. 987 654 321" />
            </div>
            <button type="submit" className="pf-btn pf-btn-primary">Guardar cambios</button>
          </form>
        </div>
      )}

      {/* ── Tab: Direcciones ── */}
      {activeTab === 'direcciones' && (
        <div className="pf-section">
          <div className="pf-section-head">
            <h3>Mis direcciones</h3>
            <button className="pf-btn-add" onClick={() => { setAddrEditId(null); setAddrForm({ calle: '', telefono: '', ciudad: '', estado: '', codigoPostal: '', pais: 'Perú', alias: 'Casa', esPrincipal: false }); setActiveTab('nueva-direccion'); }}>
              + Añadir dirección
            </button>
          </div>
          {direcciones.length === 0 ? (
            <div className="pf-empty">
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="9" r="2.5" /></svg>
              <p>No tienes direcciones guardadas</p>
            </div>
          ) : (
            <div className="pf-cards">
              {direcciones.map(addr => (
                <div key={addr.direccionId || addr.id} className="pf-card">
                  <div className="pf-card-head">
                    <h4>{addr.alias || 'Dirección'}</h4>
                    {addr.esPrincipal && <span className="pf-tag">Principal</span>}
                  </div>
                  <div className="pf-card-body">
                    <p>{addr.calle || addr.linea || addr.direccion}</p>
                    <p>{addr.ciudad}{addr.estado ? `, ${addr.estado}` : ''}</p>
                    <p>{addr.codigoPostal ? `${addr.codigoPostal}, ` : ''}{addr.pais}</p>
                    {(addr.telefono || addr.telefonoNumero) && <p style={{ color: '#64748b', fontSize: 13 }}>Tel: {addr.telefono || addr.telefonoNumero}</p>}
                  </div>
                  <div className="pf-card-footer">
                    <button className="pf-card-btn edit" onClick={() => startEditAddr(addr)}>Editar</button>
                    <button className="pf-card-btn del" onClick={() => deleteAddress(addr.direccionId || addr.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Nueva Dirección ── */}
      {activeTab === 'nueva-direccion' && (
        <div className="pf-section">
          <button className="pf-btn-back" onClick={() => setActiveTab('direcciones')}>← Volver a direcciones</button>
          <h3>{addrEditId ? 'Editar dirección' : 'Nueva dirección'}</h3>
          <form className="pf-form" onSubmit={saveAddress}>
            <div className="pf-row">
              <div className="pf-field">
                <label>Alias</label>
                <input type="text" name="alias" value={addrForm.alias} onChange={handleAddr} required placeholder="Ej. Casa, Oficina" />
              </div>
              <div className="pf-field">
                <label>Teléfono</label>
                <input type="tel" name="telefono" value={addrForm.telefono} onChange={handleAddr} placeholder="Ej. 987 654 321" />
              </div>
            </div>
            <div className="pf-field">
              <label>Calle y número</label>
              <input type="text" name="calle" value={addrForm.calle} onChange={handleAddr} required />
            </div>
            <div className="pf-row">
              <div className="pf-field">
                <label>Ciudad</label>
                <input type="text" name="ciudad" value={addrForm.ciudad} onChange={handleAddr} required />
              </div>
              <div className="pf-field">
                <label>Distrito</label>
                <input type="text" name="estado" value={addrForm.estado} onChange={handleAddr} required />
              </div>
            </div>
            <div className="pf-row">
              <div className="pf-field">
                <label>Código postal</label>
                <input type="text" name="codigoPostal" value={addrForm.codigoPostal} onChange={handleAddr} />
              </div>
              <div className="pf-field">
                <label>País</label>
                <select name="pais" value={addrForm.pais} onChange={handleAddr}>
                  <option value="Perú">Perú</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Colombia">Colombia</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                </select>
              </div>
            </div>
            <div className="pf-switch-row">
              <label className="pf-switch">
                <input type="checkbox" checked={!!addrForm.esPrincipal} onChange={e => setAddrForm(p => ({ ...p, esPrincipal: e.target.checked }))} />
                <span className="pf-switch-track" />
              </label>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Dirección principal</span>
            </div>
            <button type="submit" className="pf-btn pf-btn-primary">
              {addrEditId ? 'Actualizar dirección' : 'Guardar dirección'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}