# TP 08 - Endpoints persistentes de reservas de salas

## 1. Origen y Mantenimiento
- **Origen:** Copia funcional individual del TP 07 (`tp-07-salas-mongodb`).
- **Versiones de entorno:** Node.js v22.x, Express v5.0, Mongoose v8.x.
- **Transición a almacenamiento persistente:** Se eliminaron las importaciones del servicio en memoria y los datos semilla del arranque persistente. La API JSON y la interfaz web operan de forma asíncrona sobre la misma base de datos en MongoDB Atlas, sin borrar datos ni insertar automáticamente al reiniciar o listar.

## 2. Configuración y Base de Datos
- **Entorno Atlas:** Clúster Gratuito MongoDB Atlas Free (M0).
- **Base de datos:** `reservas_salas_u8`
- **Colección:** `reservas`

### Plantilla de entorno (`.env.example`)
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u8?retryWrites=true&w=majority

### Comando de inicio
node --env-file=.env src/index.js

## 3. Diagnóstico DNS y Cierre Ordenado (*Graceful Shutdown*)
- **Ajuste DNS:** Se mantiene la resolución DNS mediante `dns.setServers(["8.8.8.8", "1.1.1.1"])` en `src/config/base-datos.js` para asegurar la conectividad con los registros SRV de MongoDB Atlas.
- **Conexión previa:** El servidor espera a establecer la conexión con MongoDB Atlas antes de escuchar peticiones en el puerto.
- **Cierre ordenado:** El proceso escucha las señales `SIGINT` y `SIGTERM` para finalizar el servidor HTTP y desconectar Mongoose de forma limpia antes de salir.

## 4. Arquitectura y Estructura por Capas

tp-08-salas-http-mongodb/
├── src/
│   ├── config/
│   │   ├── entorno.js         # Lectura de variables de entorno
│   │   └── base-datos.js      # Conexión asíncrona a Atlas y DNS
│   ├── modelos/
│   │   └── reserva.js         # Esquema Mongoose con 6 campos + estado (default pendiente)
│   ├── servicios/
│   │   └── reservas.js        # Operaciones asíncronas Mongoose (sin arreglos en memoria)
│   ├── controladores/
│   │   ├── reservas.js        # Renderizado de vistas HTML (EJS)
│   │   └── api-reservas.js    # Respuestas REST JSON y códigos HTTP
│   ├── rutas/
│   │   ├── reservas.js        # Router para el sitio web
│   │   └── api-reservas.js    # Router para la API REST JSON
│   ├── utils/
│   │   └── formatear.js       # Formateador de _id a id textual
│   ├── middleware/
│   │   ├── reservas.js        # Validaciones
│   │   └── solicitudes.js     # Logger de peticiones
│   ├── app.js                 # Integración Express y middleware global de errores
│   └── index.js               # Conexión asíncrona, listen y Graceful Shutdown
├── views/                     # Plantillas EJS del sitio web
├── public/                    # Archivos estáticos (CSS)
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
├── package-lock.json
└── README.md

## 5. Esquema y Modelo de Datos

El modelo de Mongoose exige que todos los campos del cliente sean **obligatorios** (requeridos). Las reglas aplicadas son:

- **`estudiante`** (`String`): Se aplica limpieza de espacios en los extremos (`trim`).
- **`email`** (`String`): Se aplica `trim` y se exige la presencia obligatoria del carácter `@`.
- **`sala`** (`String`): Limitado mediante `enum` estrictamente a: `"Sala Norte"`, `"Sala Sur"`, `"Sala Multimedia"`.
- **`fecha`** (`String`): Se aplica limpieza de espacios (`trim`).
- **`turno`** (`String`): Limitado mediante `enum` estrictamente a: `"Mañana"`, `"Tarde"`, `"Noche"`.
- **`personas`** (`Number`): Validado internamente como entero puro (`Number.isInteger`) y delimitado a un rango permitido (Mínimo `1`, Máximo `6`).
- **`estado`** (`String`): *Campo asignado automáticamente por el servidor.* Valor por defecto: `"pendiente"`. Limitado mediante `enum` a `"pendiente"` o `"confirmada"`.


## 6. Tabla de Endpoints API

### Operaciones de Lectura (GET)
- **`GET /api/reservas`**
  Obtiene el listado completo de reservas directamente desde MongoDB Atlas. *(Respuesta esperada: 200 OK)*
- **`GET /api/reservas?sala=Nombre%20De%20Sala`**
  Filtra la colección y devuelve un arreglo con las reservas que coincidan de forma exacta con la sala. *(Respuesta esperada: 200 OK)*
- **`GET /api/reservas/:id`**
  Busca un documento específico por su ID. *(Respuestas posibles: 200 OK, 400 Bad Request para formato inválido, 404 Not Found si no existe)*
- **`GET /estado`**
  Ruta de diagnóstico (*health check*) que realiza un conteo asíncrono real en la colección y devuelve el total de documentos. *(Respuesta esperada: 200 OK)*

### Operaciones de Escritura (POST)
- **`POST /api/reservas`**
  Crea una nueva reserva. Recibe el payload en JSON, valida las reglas del esquema, asigna un estado, y guarda el registro en la base de datos de manera persistente. Devuelve la ruta del nuevo recurso en la cabecera `Location`. *(Respuesta esperada: 201 Created)*

## 7. Ejemplo de Solicitud y Respuesta JSON

### Solicitud POST (`/api/reservas`)
- **Headers:** `Content-Type: application/json`
- **Cuerpo:**
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-21",
  "turno": "Mañana",
  "personas": 2
}

### Respuesta POST (`201 Created`)
- **Headers de respuesta:** `Location: /api/reservas/671e8a2b3f123456789abcde`
- **Cuerpo:**
{
  "id": "671e8a2b3f123456789abcde",
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-21",
  "turno": "Mañana",
  "personas": 2,
  "estado": "pendiente"
}

## 8. Instrucciones para Reproducir en Postman

1. **Consultar listado inicial:** `GET http://localhost:3000/api/reservas` (Body: `none`). Registrar `200 OK` y arreglo inicial.
2. **Crear una reserva:** `POST http://localhost:3000/api/reservas` (Body: `raw` -> `JSON`). Comprobar `201 Created`, cabecera `Location` y `"estado": "pendiente"`. Guardar el ID retornado.
3. **Consultar recurso creado:** `GET http://localhost:3000/api/reservas/ID_RECIBIDO`. Verificar `200 OK` y coincidencia de datos.
4. **Prueba de persistencia tras reinicio:**
   - Detener el servidor con `Ctrl + C`.
   - Volver a iniciar con `node --env-file=.env src/index.js`.
   - Reenviar el `GET` con el mismo ID en Postman y comprobar recuperación exitosa del documento.
5. **Casos de rechazo:**
   - Enviar ID mal formado (`/api/reservas/1`) -> `400 Bad Request`.
   - Enviar ID bien formado inexistente (`/api/reservas/000000000000000000000000`) -> `404 Not Found`.
   - Enviar campo extra `estado: "confirmada"` en POST -> El servidor ignora el valor del cliente y asigna `pendiente`.
   - Enviar parámetro repetido (`?sala=Sala%20Norte&sala=Sala%20Sur`) -> `400 Bad Request`.

## 9. Matriz Mínima de Resultados

### Pruebas de Éxito y Persistencia (Happy Path)
- **Listado inicial en base nueva:** Se esperaba `200 OK` con `[]`. **Resultado:** `200 OK`, `[]`.
- **Creación válida:** Se esperaba `201 Created` con cabecera Location. **Resultado:** `201 Created`, Location asignada correctamente.
- **Consulta por ID creado:** Se esperaba `200 OK` con el recurso. **Resultado:** `200 OK`, id y estado pendientes correctos.
- **Consulta tras reiniciar servidor:** Se esperaba mantener el mismo documento. **Resultado:** `200 OK`, datos recuperados intactos desde Atlas.
- **Listar dos veces:** Se esperaba una cantidad estable. **Resultado:** Cantidad estable (sin duplicados).
- **`/estado` y sitio web:** Se esperaba lectura real desde MongoDB. **Resultado:** Conteo persistente y vistas EJS operativas.

### Pruebas de Rechazo y Errores (400 / 404)
- **ID mal formado ("1"):** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request`.
- **ID válido inexistente (24 hex):** Se esperaba `404 Not Found`. **Resultado:** `404 Not Found`.
- **Estudiante vacío / email sin @:** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request` (sin escrituras en BD).
- **Sala o turno no permitido:** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request` (sin escrituras en BD).
- **Fecha vacía:** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request` (sin escrituras en BD).
- **Personas fuera de rango (0, 7) o tipo erróneo (2.5, "abc"):** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request` (sin escrituras en BD).
- **Cuerpos ausentes o JSON mal formado:** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request`.
- **Filtro de sala repetido en Query:** Se esperaba `400 Bad Request`. **Resultado:** `400 Bad Request`.

### Pruebas de Comportamiento Específico
- **Inyección de campos extra (`estado`, `_id`):** Se esperaba que el servidor los ignore. **Resultado:** `201 Created`, el servidor ignora el dato y asigna default `pendiente`.
- **Filtro exacto por sala (`?sala=...`):** Se esperaba coincidencias exactas o vacío. **Resultado:** Devuelve las coincidencias exactas de forma estricta.
- **Validación en Formulario Web:** Se esperaba redirección o recarga con error. **Resultado:** `302 Found` (éxito) / `400 Bad Request` (falla).

## 10. Comparación con el TP 07
- **Integración HTTP/MongoDB:** En el TP 07, la base de datos se probaba únicamente mediante scripts de terminal independientes (`scripts/`), mientras el servidor web operaba en memoria. En el TP 08, el servidor Express se conecta a MongoDB Atlas en el arranque y atiende tanto el sitio HTML como la API REST JSON leyendo y escribiendo en la base persistente.
- **Modelo de datos:** Se incorporó el campo `estado` con valor por defecto `"pendiente"`.
- **Desuso del servicio en memoria:** Se eliminó la dependencia de arreglos locales y semillas estáticas en el arranque.