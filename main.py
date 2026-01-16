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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Definir rutas absolutas basadas en la ubicación de este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "img_wireframes")
KADENCE_DIR = os.path.join(BASE_DIR, "kadence_wireframes")

# Servir manifest.json en el root o en un endpoint específico
@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(BASE_DIR, "manifest.json"))

# También podemos servirlo como la raíz de la API si prefieres
@app.get("/")
async def read_root():
    return {
        "message": "Backend Wireframe API is running",
        "endpoints": {
            "manifest": "/manifest.json",
            "images": "/img/{category}/{filename}",
            "wireframes": "/wireframes/{category}/{filename}"
        }
    }

# Montar directorios estáticos
# Acceso: /img/About/about_1.webp
if os.path.exists(IMG_DIR):
    app.mount("/img", StaticFiles(directory=IMG_DIR), name="images")

# Acceso: /wireframes/About/about_1.html
if os.path.exists(KADENCE_DIR):
    app.mount("/wireframes", StaticFiles(directory=KADENCE_DIR), name="wireframes")

if __name__ == "__main__":
    import uvicorn
    # Para correr localmente
    uvicorn.run(app, host="0.0.0.0", port=8000)
