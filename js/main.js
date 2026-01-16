document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const widgetList = document.getElementById('widget-list');
    const layoutStructure = document.getElementById('layout-structure');
    const outputPreview = document.getElementById('output-preview');
    const updateBtn = document.getElementById('update-btn');
    const clearBtn = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-btn');
    const projectNameInput = document.getElementById('project-name');

    // State
    let manifestData = null;

    // --- INITIALIZATION ---
    async function initializeApp() {
        await loadManifest();
        loadWidgets();
        setupEventListeners();
    }

    async function loadManifest() {
        try {
            const response = await fetch('manifest.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            manifestData = await response.json();
        } catch (error) {
            console.error("Error al cargar manifest.json:", error);
        }
    }

    function loadWidgets() {
        if (!manifestData) return;
        widgetList.innerHTML = '';
        for (const widgetName in manifestData) {
            const widget = document.createElement('div');
            widget.className = 'widget-item';
            widget.setAttribute('draggable', 'true');
            widget.dataset.widgetName = widgetName;
            widget.textContent = widgetName;
            widgetList.appendChild(widget);
        }
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        widgetList.addEventListener('dragstart', handleWidgetDragStart);
        layoutStructure.addEventListener('dragover', handleDragOver);
        layoutStructure.addEventListener('dragleave', handleDragLeave);
        layoutStructure.addEventListener('drop', handleDrop);
        layoutStructure.addEventListener('click', handleLayoutClick);
        layoutStructure.addEventListener('dragstart', handleLayoutDragStart);
        layoutStructure.addEventListener('dragend', handleLayoutDragEnd);
        updateBtn.addEventListener('click', generatePreview);
        outputPreview.addEventListener('click', handlePreviewClick);
        outputPreview.addEventListener('change', handlePreviewChange);
        clearBtn.addEventListener('click', clearAll);
        exportBtn.addEventListener('click', exportProject);
    }

    // --- DRAG & DROP LOGIC ---
    function handleWidgetDragStart(e) {
        if (e.target.classList.contains('widget-item')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.widgetName);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            const afterElement = getDragAfterElement(layoutStructure, e.clientY);
            if (afterElement == null) {
                layoutStructure.appendChild(dragging);
            } else {
                layoutStructure.insertBefore(dragging, afterElement);
            }
        } else {
            layoutStructure.classList.add('drag-over');
        }
    }

    function handleDragLeave() {
        layoutStructure.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        layoutStructure.classList.remove('drag-over');
        if (document.querySelector('.dragging')) return;

        const widgetName = e.dataTransfer.getData('text/plain');
        if (!widgetName) return;

        const placeholder = layoutStructure.querySelector('.placeholder-text');
        if (placeholder) placeholder.style.display = 'none';

        createLayoutItem(widgetName, e.clientY);
    }

    function handleLayoutDragStart(e) {
        if (e.target.classList.contains('layout-item')) {
            e.target.classList.add('dragging');
        }
    }

    function handleLayoutDragEnd(e) {
        if (e.target.classList.contains('layout-item')) {
            e.target.classList.remove('dragging');
        }
    }

    function handleLayoutClick(e) {
        if (e.target.classList.contains('delete-btn')) {
            e.target.closest('.layout-item').remove();
            if (layoutStructure.querySelectorAll('.layout-item').length === 0) {
                const placeholder = layoutStructure.querySelector('.placeholder-text');
                if (placeholder) placeholder.style.display = 'block';
            }
        }
    }

    function createLayoutItem(name, clientY) {
        const item = document.createElement('div');
        item.className = 'layout-item';
        item.dataset.widgetName = name;
        item.setAttribute('draggable', 'true');
        item.innerHTML = `<span>${name}</span><button class="delete-btn">&times;</button>`;

        const afterElement = getDragAfterElement(layoutStructure, clientY);
        if (afterElement == null) {
            layoutStructure.appendChild(item);
        } else {
            layoutStructure.insertBefore(item, afterElement);
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.layout-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- PREVIEW LOGIC ---
    function generatePreview() {
        if (!manifestData) {
            outputPreview.innerHTML = '<p class="placeholder-text">Error: No se pudo cargar el manifiesto.</p>';
            return;
        }
        const layoutItems = layoutStructure.querySelectorAll('.layout-item');
        outputPreview.innerHTML = '';
        if (layoutItems.length === 0) {
            outputPreview.innerHTML = '<p class="placeholder-text">Presiona "Actualizar" para ver la previsualización</p>';
            return;
        }
        layoutItems.forEach(item => {
            const widgetName = item.dataset.widgetName;
            const widgetData = manifestData[widgetName];
            if (!widgetData) return;

            const randomImage = widgetData.images[Math.floor(Math.random() * widgetData.images.length)];
            const previewSection = document.createElement('div');
            previewSection.className = 'preview-section';
            previewSection.dataset.widgetName = widgetName;
            previewSection.dataset.history = JSON.stringify([]);

            const img = document.createElement('img');
            img.src = `img_wireframes/${widgetName}/${randomImage}`;
            img.alt = `Preview for ${widgetName}`;

            const controls = createPreviewControls(widgetData.images, randomImage);
            previewSection.appendChild(img);
            previewSection.appendChild(controls);
            outputPreview.appendChild(previewSection);
        });
    }

    function createPreviewControls(images, selectedImage) {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'preview-controls';
        controlsContainer.innerHTML = `<button class="prev-btn">&lsaquo;</button><select class="image-selector"></select><button class="next-btn">&rsaquo;</button>`;
        const select = controlsContainer.querySelector('select');
        images.forEach(imageFile => {
            const option = document.createElement('option');
            option.value = imageFile;
            option.textContent = imageFile;
            option.selected = imageFile === selectedImage;
            select.appendChild(option);
        });
        return controlsContainer;
    }

    function handlePreviewClick(e) {
        const target = e.target;
        const previewSection = target.closest('.preview-section');
        if (!previewSection) return;

        const widgetName = previewSection.dataset.widgetName;
        const img = previewSection.querySelector('img');
        const currentImage = img.src.split('/').pop();
        let history = JSON.parse(previewSection.dataset.history);

        if (target.classList.contains('next-btn')) {
            history.push(currentImage);
            const images = manifestData[widgetName].images;
            let nextImage = images[Math.floor(Math.random() * images.length)];
            if (images.length > 1) {
                while (nextImage === currentImage) {
                    nextImage = images[Math.floor(Math.random() * images.length)];
                }
            }
            updatePreviewSection(previewSection, widgetName, nextImage);
        } else if (target.classList.contains('prev-btn')) {
            const prevImage = history.pop();
            if (prevImage) {
                updatePreviewSection(previewSection, widgetName, prevImage, false);
            }
        }
        previewSection.dataset.history = JSON.stringify(history);
    }

    function handlePreviewChange(e) {
        if (e.target.classList.contains('image-selector')) {
            const previewSection = e.target.closest('.preview-section');
            const img = previewSection.querySelector('img');
            const history = JSON.parse(previewSection.dataset.history);
            history.push(img.src.split('/').pop());
            previewSection.dataset.history = JSON.stringify(history);
            updatePreviewSection(previewSection, previewSection.dataset.widgetName, e.target.value);
        }
    }

    function updatePreviewSection(section, widgetName, newImage) {
        const img = section.querySelector('img');
        const select = section.querySelector('select');
        img.src = `img_wireframes/${widgetName}/${newImage}`;
        select.value = newImage;
    }

    // --- FINAL ACTIONS ---
    function clearAll() {
        layoutStructure.innerHTML = '<p class="placeholder-text">Arrastra y suelta widgets aquí</p>';
        outputPreview.innerHTML = '<p class="placeholder-text">Presiona "Actualizar" para ver la previsualización</p>';
    }

    async function exportProject() {
        const projectName = projectNameInput.value.trim().replace(/[^a-zA-Z0-9_\s-]/g, '') || 'proyecto_sin_titulo';
        const previewSections = outputPreview.querySelectorAll('.preview-section');
        if (previewSections.length === 0) {
            alert('No hay nada que exportar. Genera una previsualización primero.');
            return;
        }

        exportBtn.textContent = 'Exportando...';
        exportBtn.disabled = true;

        try {
            const zip = new JSZip();

            // --- 1. Generar HTML y preparar rutas de imágenes ---
            const imagePaths = [];
            const htmlFilePromises = Array.from(previewSections).map(section => {
                const widgetName = section.dataset.widgetName;
                const selectedImageFile = section.querySelector('select').value;

                imagePaths.push(`img_wireframes/${widgetName}/${selectedImageFile}`);

                const imageIndex = manifestData[widgetName].images.indexOf(selectedImageFile);
                const htmlFileName = manifestData[widgetName].html[imageIndex];

                if (htmlFileName) {
                    return fetch(`wireframes/${widgetName}/${htmlFileName}`).then(res => res.ok ? res.text() : '');
                }
                return Promise.resolve('');
            });

            const htmlContents = await Promise.all(htmlFilePromises);
            const finalHtml = htmlContents.join('\n');
            zip.file(`${projectName}.html`, finalHtml);

            // --- 2. Generar imagen PNG de alta calidad ---
            const loadedImages = await Promise.all(imagePaths.map(path => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = (err) => reject(`Failed to load image: ${path}`);
                    img.src = path;
                });
            }));

            let totalHeight = 0;
            let maxWidth = 0;
            loadedImages.forEach(img => {
                totalHeight += img.height;
                if (img.width > maxWidth) {
                    maxWidth = img.width;
                }
            });

            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            let currentY = 0;
            loadedImages.forEach(img => {
                ctx.drawImage(img, 0, currentY);
                currentY += img.height;
            });

            const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            zip.file(`${projectName}.png`, pngBlob);

            // --- 3. Generar archivo de layout TXT ---
            const layoutItems = layoutStructure.querySelectorAll('.layout-item');
            const layoutText = Array.from(layoutItems).map(item => `[${item.dataset.widgetName}]`).join('\n');
            zip.file(`${projectName}_layout.txt`, layoutText);

            // --- 4. Generar y descargar el ZIP ---
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${projectName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error durante la exportación:', error);
            alert('Ocurrió un error durante la exportación. Revisa la consola para más detalles.');
        } finally {
            exportBtn.textContent = 'Exportar';
            exportBtn.disabled = false;
        }
    }

    // --- START ---
    initializeApp();
});