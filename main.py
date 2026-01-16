from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Configurar CORS (Permite que otras webs accedan a tus imágenes/datos)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, puedes restringir esto a tu dominio frontend
    allow_credentials=True,
    allow_headers=["*"],
)

# Optimización: Compresión Gzip
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Optimización: Caché Agresivo para estáticos
@app.middleware("http")
async def cache_control_middleware(request, call_next):
    response = await call_next(request)
    # Aplicar caché de 1 año (31536000 segundos) a imágenes y wireframes
    if request.url.path.startswith(("/img_wireframes", "/wireframes", "/css", "/js")):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response

# Definir rutas absolutas basadas en la ubicación de este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "img_wireframes")
KADENCE_DIR = os.path.join(BASE_DIR, "kadence_wireframes")

# Rutas para CSS y JS
CSS_DIR = os.path.join(BASE_DIR, "css")
JS_DIR = os.path.join(BASE_DIR, "js")

# Servir manifest.json en el root o en un endpoint específico
@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(BASE_DIR, "manifest.json"))

# Servir index.html en la raíz
@app.get("/")
async def read_root():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Montar directorios estáticos
# Acceso: /img_wireframes/About/about_1.webp
if os.path.exists(IMG_DIR):
    app.mount("/img_wireframes", StaticFiles(directory=IMG_DIR), name="images")

# Acceso: /wireframes/About/about_1.html
if os.path.exists(KADENCE_DIR):
    app.mount("/wireframes", StaticFiles(directory=KADENCE_DIR), name="wireframes")

# Acceso: /css/style.css
if os.path.exists(CSS_DIR):
    app.mount("/css", StaticFiles(directory=CSS_DIR), name="css")

# Acceso: /js/main.js
if os.path.exists(JS_DIR):
    app.mount("/js", StaticFiles(directory=JS_DIR), name="js")

if __name__ == "__main__":
    import uvicorn
    # Para correr localmente
    uvicorn.run(app, host="0.0.0.0", port=8000)
