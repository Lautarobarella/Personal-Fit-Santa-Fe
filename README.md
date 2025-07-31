# Personal-Fit-Santa-Fe

## 🏗️ Estructura de Deploy para Personal Fit

Este proyecto está compuesto por **tres partes principales** que pueden (y deberían) desplegarse por separado para mayor escalabilidad y robustez:

---

### 1. **Frontend (Next.js)**

- **¿Qué es?**  
  La interfaz de usuario de la aplicación, desarrollada con Next.js.

- **¿Dónde hostear?**  
  Servicios como [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), [AWS Amplify](https://aws.amazon.com/amplify/), etc.

- **Función:**  
  Sirve la web/app a los usuarios y realiza llamadas HTTP al backend.

---

### 2. **Backend Principal (Docker)**

- **¿Qué es?**  
  El backend principal, empaquetado en un contenedor Docker.

- **¿Dónde hostear?**  
  Plataformas de contenedores como [AWS ECS](https://aws.amazon.com/ecs/), [Google Cloud Run](https://cloud.google.com/run), [Azure Container Instances](https://azure.microsoft.com/en-us/products/container-instances/), [Railway](https://railway.app/), [Render](https://render.com/), etc.

- **Función:**  
  Lógica de negocio, base de datos, autenticación, etc.

---

### 3. **Servidor Express (API para Mercado Pago y Webhooks)**

- **¿Qué es?**  
  Un servidor Express que expone endpoints para pagos y recibe webhooks de Mercado Pago.

- **¿Dónde hostear?**  
  Puede estar en el mismo servidor/servicio que el backend principal o en uno separado, pero **debe ser accesible públicamente** para recibir webhooks.

- **Función:**  
  Gestiona pagos y comunicación con Mercado Pago.

---

## 🚫 ¿Qué NO deberías hacer?

- No hostear el frontend y el backend en el mismo contenedor salvo que tengas una razón muy fuerte.
- No exponer el backend solo en `localhost`, ya que Mercado Pago necesita accederlo desde internet.

---

## 💡 ¿Puedo unir el backend y el servidor Express?

Sí, si tiene sentido para tu proyecto, puedes tener un solo backend (en Docker) que incluya tanto la lógica de negocio como los endpoints de Mercado Pago.  
O puedes separarlos si prefieres mantener responsabilidades separadas.

---

## 📦 Scripts recomendados para producción

```json
"scripts": {
  "build": "next build",
  "start:next": "next start",
  "start:express": "node dist/index.js"
}

[ Usuario ]
     |
     v
[ Frontend (Next.js) ] <------> [ Backend Principal (Docker/Express) ]
                                      ^
                                      |
                             [ Mercado Pago Webhooks ]
