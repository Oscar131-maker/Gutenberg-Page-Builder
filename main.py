from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware
import os

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optimización: Compresión Gzip (Reduce el tamaño de HTML/JS/JSON)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CLASE PERSONALIZADA PARA CACHÉ ESTÁTICO
# Esto asegura que cada imagen se sirva con instrucciones de guardado inmediato.
class CacheControlStaticFiles(StaticFiles):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        # Cache por 1 año (31536000 seg)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

# Definir rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "img_wireframes")
KADENCE_DIR = os.path.join(BASE_DIR, "kadence_wireframes")
CSS_DIR = os.path.join(BASE_DIR, "css")
JS_DIR = os.path.join(BASE_DIR, "js")

# Servir manifest.json
@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(BASE_DIR, "manifest.json"))

# Servir index.html en la raíz
@app.get("/")
async def read_root():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Montar directorios usando la clase optimizada
if os.path.exists(IMG_DIR):
    app.mount("/img_wireframes", CacheControlStaticFiles(directory=IMG_DIR), name="images")

if os.path.exists(KADENCE_DIR):
    app.mount("/wireframes", CacheControlStaticFiles(directory=KADENCE_DIR), name="wireframes")

if os.path.exists(CSS_DIR):
    app.mount("/css", CacheControlStaticFiles(directory=CSS_DIR), name="css")

if os.path.exists(JS_DIR):
    app.mount("/js", CacheControlStaticFiles(directory=JS_DIR), name="js")

if __name__ == "__main__":
    import uvicorn
    # En producción Railway se encarga de esto con el Procfile
    uvicorn.run(app, host="0.0.0.0", port=8000)
