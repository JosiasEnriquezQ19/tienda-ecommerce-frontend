import axios from 'axios';
import { API } from '../api';

export async function getComentarios(productoId) {
  const res = await axios.get(`${API}/productos/${productoId}/comentarios`);
  return res.data;
}

export async function crearComentario(productoId, data, token) {
  const res = await axios.post(
    `${API}/productos/${productoId}/comentarios`,
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
  return res.data;
}

export async function actualizarComentario(comentarioId, data, token) {
  const res = await axios.put(
    `${API}/comentarios/${comentarioId}`,
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
  return res.data;
}

export async function eliminarComentario(comentarioId, token) {
  const res = await axios.delete(
    `${API}/comentarios/${comentarioId}`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
  return res.data;
}
