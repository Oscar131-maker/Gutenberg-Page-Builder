'''
Este script actualiza automáticamente el archivo manifest.json escaneando
los directorios 'img_wireframes' y 'kadence_wireframes'.

El script recopila todos los nombres de archivo .webp, .png y .html de los subdirectorios
y los organiza en una estructura JSON que luego se guarda en manifest.json.

Para ejecutarlo, simplemente corre `python update_manifest.py` desde la terminal
en el directorio raíz del proyecto.
'''
import os
import json
import re

# El script asume que se ejecuta desde el directorio raíz del proyecto.
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# Rutas a los directorios que se van a escanear.
IMG_DIR = os.path.join(ROOT_DIR, 'img_wireframes')
HTML_DIR = os.path.join(ROOT_DIR, 'kadence_wireframes')
MANIFEST_FILE = os.path.join(ROOT_DIR, 'manifest.json')

def natural_sort_key(s):
    """
    Key for natural sorting: orders strings containing numbers correctly.
    e.g. 'file_2.ext' comes before 'file_10.ext'
    """
    return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', s)]

def generate_manifest():
    """
    Escanea los directorios de wireframes para generar el manifest.json.
    """
    manifest = {}

    # 1. Procesar archivos de imagen (.webp o .png)
    if os.path.exists(IMG_DIR):
        for category in sorted(os.listdir(IMG_DIR)):
            category_path = os.path.join(IMG_DIR, category)
            if os.path.isdir(category_path):
                if category not in manifest:
                    manifest[category] = {'images': [], 'html': []}
                
                # Filtrar imagenes
                files = [f for f in os.listdir(category_path) if f.lower().endswith(('.webp', '.png'))]
                # Ordenar numéricamente (natural sort)
                images = sorted(files, key=natural_sort_key)
                manifest[category]['images'] = images

    # 2. Procesar archivos HTML (.html)
    if os.path.exists(HTML_DIR):
        for category in sorted(os.listdir(HTML_DIR)):
            category_path = os.path.join(HTML_DIR, category)
            if os.path.isdir(category_path):
                if category in manifest:
                    files = [f for f in os.listdir(category_path) if f.lower().endswith('.html')]
                    # Ordenar numéricamente (natural sort)
                    html_files = sorted(files, key=natural_sort_key)
                    manifest[category]['html'] = html_files

    # 3. Escribir el archivo manifest.json
    try:
        with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"El archivo {os.path.basename(MANIFEST_FILE)} ha sido actualizado exitosamente con orden natural.")
    except IOError as e:
        print(f"Error al escribir en el archivo {MANIFEST_FILE}: {e}")

if __name__ == '__main__':
    generate_manifest()
