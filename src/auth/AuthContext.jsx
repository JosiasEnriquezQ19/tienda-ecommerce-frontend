import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '../api'

// Google Client ID from the backend appsettings.json
export const GOOGLE_CLIENT_ID = '565092651331-aq6gmrgbms3jci0jr2oan3l56d9ialqs.apps.googleusercontent.com'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Intentamos cargar el usuario desde localStorage al inicio
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Persist user to localStorage whenever it changes. Remove storage when user is null.
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user))
      else localStorage.removeItem('user')
    } catch (e) { /* ignore storage errors */ }
  }, [user])

  // Eliminamos la función de verificación de administrador ya que este frontend
  // es exclusivamente para usuarios normales y tenemos otro frontend para administradores

  // Axios interceptor to attach JWT token to every request
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
    return () => axios.interceptors.request.eject(interceptor)
  }, [])

  async function login(email, password) {
    try {
      const res = await axios.post(`${API}/Auth/login`, { email, password })
      const data = res.data
      // Backend returns { token, usuario, expiresAt }
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      const userData = data.usuario || data
      setUser(userData)
      return data
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) throw new Error('Credenciales incorrectas')
        throw new Error(err.response.data?.message || `Error en login: ${err.response.status}`)
      }
      throw new Error('Error de red al iniciar sesión')
    }
  }

  async function googleLogin(credentialResponse) {
    try {
      const res = await axios.post(`${API}/Auth/google-login`, {
        idToken: credentialResponse.credential
      })
      const data = res.data
      // Save JWT token
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      // Set user from response - the backend returns { token, usuario, expiresAt }
      const userData = data.usuario || data
      setUser(userData)
      return data
    } catch (err) {
      console.error('[Auth] Google login error:', err)
      if (err.response) {
        throw new Error(err.response.data?.message || `Error en login con Google: ${err.response.status}`)
      }
      throw new Error('Error de red al iniciar sesión con Google')
    }
  }
  async function register(payload) {
    console.log('[Auth] Iniciando proceso de registro de usuario');

    try {
      // Omitimos las verificaciones de duplicados aquí, ya que se realizan en el componente Registro.jsx
      // y están causando errores 400/404. Confiamos en que la validación se hizo correctamente en el componente.

      console.log('[Auth] Enviando solicitud de registro a:', `${API}/Auth/register`);
      const res = await axios.post(`${API}/Auth/register`, payload);

      if (!res.data) {
        console.warn('[Auth] Respuesta del registro no contiene datos de usuario');
        throw new Error('El servidor no devolvió datos de usuario');
      }

      console.log('[Auth] Registro exitoso, datos recibidos:', res.data);
      const data = res.data;

      // Save JWT token from register response
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      const userData = data.usuario || data;

      // Ya no verificamos si es administrador, puesto que este frontend es solo para usuarios regulares

      console.log('[Auth] Guardando sesión del nuevo usuario');
      setUser(userData);
      return data;
    } catch (error) {
      // Capturar errores específicos del registro y mostrar mensajes más descriptivos
      if (error.response) {
        if (error.response.status === 400) {
          console.error('[Auth] Error 400 en registro:', error.response.data);
          if (typeof error.response.data === 'string' && error.response.data.includes('email')) {
            throw new Error('Este correo electrónico ya está registrado');
          } else if (typeof error.response.data === 'string' && error.response.data.includes('telefono')) {
            throw new Error('Este número de teléfono ya está registrado');
          } else {
            throw new Error(`Error en el registro: ${error.response.data || 'Datos inválidos'}`);
          }
        } else {
          console.error('[Auth] Error en registro:', error.response.status, error.response.data);
          throw new Error(`Error en el servidor (${error.response.status}): ${error.response.data || 'No se pudo completar el registro'}`);
        }
      }

      console.error('[Auth] Error general en registro:', error);
      throw error;
    }
  }
  async function updateUser(userId, payload) {
    // Probar qué endpoint existe y usar el que corresponda.
    // Preferimos `/Usuarios/{id}` (coincide con la tabla Usuarios). Si no existe,
    // intentamos `/Auth/me/{id}` y luego las variaciones sin id.
    try {
      console.debug('[Auth] updateUser: comprobando /Usuarios/' + userId)
      // Primero comprobar si la ruta /Usuarios/{id} responde
      try {
        const probe = await axios.get(`${API}/Usuarios/${userId}`)
        if (probe.status === 200) {
          // Endpoint existe: usar PUT a /Usuarios/{id}
          const res = await axios.put(`${API}/Usuarios/${userId}`, payload)
          if (res.status === 204 || res.data === undefined) {
            const fresh = await axios.get(`${API}/Usuarios/${userId}`)
            setUser(fresh.data)
            return fresh.data
          }
          setUser(res.data)
          return res.data
        }
      } catch (probeErr) {
        console.debug('[Auth] /Usuarios/{id} no disponible:', probeErr.response?.status || probeErr.message)
        // continuar con otras comprobaciones
      }

      // Probar /Auth/me/{id}
      try {
        const probe2 = await axios.get(`${API}/Auth/me/${userId}`)
        if (probe2.status === 200) {
          const res2 = await axios.put(`${API}/Auth/me/${userId}`, payload)
          if (res2.status === 204 || res2.data === undefined) {
            const fresh = await axios.get(`${API}/Auth/me/${userId}`)
            setUser(fresh.data)
            return fresh.data
          }
          setUser(res2.data)
          return res2.data
        }
      } catch (probe2Err) {
        console.debug('[Auth] /Auth/me/{id} no disponible:', probe2Err.response?.status || probe2Err.message)
      }

      // Intentar variantes sin id (PUT /Auth/me, PUT /Usuarios, PATCH /Usuarios)
      try {
        const r1 = await axios.put(`${API}/Auth/me`, { usuarioId: userId, ...payload })
        if (r1.status === 204 || r1.data === undefined) {
          // intentar re-obtener via Auth/me/{id} o Usuarios/{id}
          try {
            const fresh = await axios.get(`${API}/Auth/me/${userId}`)
            setUser(fresh.data)
            return fresh.data
          } catch (_) {
            const fresh2 = await axios.get(`${API}/Usuarios/${userId}`)
            setUser(fresh2.data)
            return fresh2.data
          }
        }
        setUser(r1.data)
        return r1.data
      } catch (e1) {
        console.debug('[Auth] put /Auth/me falló:', e1.response?.status || e1.message)
      }

      try {
        const r2 = await axios.put(`${API}/Usuarios`, { usuarioId: userId, ...payload })
        if (r2.status === 204 || r2.data === undefined) {
          const fresh = await axios.get(`${API}/Usuarios/${userId}`)
          setUser(fresh.data)
          return fresh.data
        }
        setUser(r2.data)
        return r2.data
      } catch (e2) {
        console.debug('[Auth] put /Usuarios (colección) falló:', e2.response?.status || e2.message)
      }

      try {
        const r3 = await axios.patch(`${API}/Usuarios`, { usuarioId: userId, ...payload })
        setUser(r3.data)
        return r3.data
      } catch (e3) {
        console.debug('[Auth] patch /Usuarios (colección) falló:', e3.response?.status || e3.message)
      }

      // Si llegamos aquí, no se pudo actualizar en ninguna ruta probada
      const error = new Error('No se encontró endpoint de actualización de usuario en el backend (404/405)')
      error.response = { status: 404, data: 'No endpoint available' }
      throw error
    } catch (err) {
      // Propagar para que la UI muestre detalles
      console.error('[Auth] updateUser error final:', err.response?.status, err.response?.data || err.message)
      throw err
    }
  }
  async function changePassword(userId, currentPassword, newPassword) {
    // tentativa: endpoint POST /api/Auth/change-password
    const res = await axios.post(`${API}/Auth/change-password`, { usuarioId: userId, currentPassword, newPassword })
    return res.data
  }
  function logout() { setUser(null); localStorage.removeItem('user'); localStorage.removeItem('token') }

  // Helper para establecer la sesión del usuario manualmente
  function setSession(u) { setUser(u); localStorage.setItem('user', JSON.stringify(u)) }

  return <AuthContext.Provider value={{ user, login, googleLogin, register, updateUser, changePassword, logout, setSession }}>{children}</AuthContext.Provider>
}
