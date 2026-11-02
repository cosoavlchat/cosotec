import { auth } from "@/lib/firebase/client";

/**
 * Cliente HTTP autenticado centralizado para todas las pantallas del panel /admin/*.
 *
 * 1. Obtiene el ID Token de Firebase Auth en el instante de la petición mediante `auth.currentUser.getIdToken()`.
 * 2. Lo adjunta en la cabecera `Authorization: Bearer <idToken>`.
 * 3. NUNCA guarda el token en estado de React, localStorage, sessionStorage ni cookies.
 * 4. Si la petición devuelve 401 (token expirado o inválido), fuerza la renovación una sola vez
 *    mediante `auth.currentUser.getIdToken(true)` y reintenta la llamada.
 * 5. Si continúa fallando o no hay usuario activo, redirige a `/admin/login?expired=1`.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login?expired=1";
    }
    throw new Error("No hay una sesión activa de Firebase Auth.");
  }

  // 1. Obtener ID token actual
  let token = await user.getIdToken();

  const executeRequest = (currentToken: string) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${currentToken}`);
    return fetch(input, {
      ...init,
      headers,
    });
  };

  let response = await executeRequest(token);

  // 2. Si el servidor responde 401, forzar renovación y reintentar 1 vez
  if (response.status === 401) {
    try {
      token = await user.getIdToken(true);
      response = await executeRequest(token);
    } catch (err) {
      console.warn("[adminFetch] Error forzando refresh del token:", err);
    }

    // Si sigue en 401, la sesión ya no es válida
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login?expired=1";
      }
      throw new Error("Tu sesión expiró, vuelve a iniciar sesión.");
    }
  }

  return response;
}

