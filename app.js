/**
 * ロゴカッター - PDF・画像ファイルの上部/下部を一括カット
 * pdf-lib: PDF処理・画像→PDF変換
 * pdf.js: PDFプレビュー・PDF→PNG変換
 * Canvas API: 画像カット処理
 * JSZip: 複数ファイルZIP化
 */

// ===================================
// DOM Elements
// ===================================

// Upload
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');

// Settings
const settingsSection = document.getElementById('settingsSection');
const fileInfoSingle = document.getElementById('fileInfoSingle');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const changeFileBtn = document.getElementById('changeFileBtn');

// Image Gallery
const imageGallery = document.getElementById('imageGallery');
const galleryGrid = document.getElementById('galleryGrid');
const imageCount = document.getElementById('imageCount');
const addImageBtn = document.getElementById('addImageBtn');
const addImageInput = document.getElementById('addImageInput');
const galleryResetBtn = document.getElementById('galleryResetBtn');

// Direction
const dirBottom = document.getElementById('dirBottom');
const dirTop = document.getElementById('dirTop');

// Crop
const cropSlider = document.getElementById('cropSlider');
const cropValueDisplay = document.getElementById('cropValueDisplay');
const previewCanvas = document.getElementById('previewCanvas');
const cropOverlay = document.getElementById('cropOverlay');
const dragHandle = document.getElementById('dragHandle');
const pageNav = document.getElementById('pageNav');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');
const processBtn = document.getElementById('processBtn');

// Output Format
const formatSame = document.getElementById('formatSame');
const formatPdf = document.getElementById('formatPdf');
const formatPng = document.getElementById('formatPng');

// Progress
const progressSection = document.getElementById('progressSection');
const progressFileName = document.getElementById('progressFileName');
const progressFileSize = document.getElementById('progressFileSize');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');

// Result
const resultSection = document.getElementById('resultSection');
const resultFileCount = document.getElementById('resultFileCount');
const resultCropPercent = document.getElementById('resultCropPercent');
const resultCropDirection = document.getElementById('resultCropDirection');
const resultCanvas = document.getElementById('resultCanvas');
const resultPrevBtn = document.getElementById('resultPrevBtn');
const resultNextBtn = document.getElementById('resultNextBtn');
const resultPageIndicator = document.getElementById('resultPageIndicator');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// Error
const errorSection = document.getElementById('errorSection');
const errorResetBtn = document.getElementById('errorResetBtn');
const errorMessage = document.getElementById('errorMessage');

// ===================================
// State
// ===================================
let mode = null; // 'pdf' or 'image'
let cropDirection = 'bottom'; // 'bottom' or 'top'
let outputFormat = 'same'; // 'same', 'pdf', 'png'
let cropPercentage = 15;

// PDF state
let currentPdfDoc = null;
let originalPdfBytes = null;
let processedPdfBytes = null;
let processedPdfDoc = null;
let pdfFileName = '';
let currentPage = 1;
let totalPages = 1;

// Image state
let imageFiles = []; // [{file, dataUrl, img}]
let activeImageIndex = 0;

// Result state
let resultItems = []; // [{blob, name, dataUrl}]
let resultCurrentPage = 0;

// Drag state
let isDragging = false;
let canvasHeight = 0;

// ===================================
// File type helpers
// ===================================
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];

function isPDF(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file) {
    if (IMAGE_TYPES.includes(file.type)) return true;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
}

function getImageMimeType(file) {
    if (file.type && IMAGE_TYPES.includes(file.type)) return file.type;
    const ext = file.name.split('.').pop().toLowerCase();
    const map = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp' };
    return map[ext] || 'image/png';
}

// ===================================
// Initialize
// ===================================
function init() {
    // Prevent browser from opening files in new tab on drag/drop anywhere
    document.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    document.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); });

    // Drag and drop on upload zone
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('mousemove', handleMouseMove);

    // Drag and drop on settings section (for adding more files while in settings)
    settingsSection.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); settingsSection.classList.add('drag-over'); });
    settingsSection.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); settingsSection.classList.remove('drag-over'); });
    settingsSection.addEventListener('drop', handleSettingsDrop);

    // Settings
    changeFileBtn.addEventListener('click', resetApp);
    galleryResetBtn.addEventListener('click', resetApp);
    cropSlider.addEventListener('input', handleSliderChange);
    prevPageBtn.addEventListener('click', () => navigatePage(-1));
    nextPageBtn.addEventListener('click', () => navigatePage(1));
    processBtn.addEventListener('click', processFiles);

    // Image gallery add - prevent click from propagating
    addImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addImageInput.click();
    });
    addImageInput.addEventListener('click', (e) => e.stopPropagation());
    addImageInput.addEventListener('change', handleAddImages);

    // Direction buttons
    dirBottom.addEventListener('click', () => setDirection('bottom'));
    dirTop.addEventListener('click', () => setDirection('top'));

    // Output format buttons
    formatSame.addEventListener('click', () => setOutputFormat('same'));
    formatPdf.addEventListener('click', () => setOutputFormat('pdf'));
    formatPng.addEventListener('click', () => setOutputFormat('png'));

    // Drag handle
    dragHandle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    // Touch support
    dragHandle.addEventListener('touchstart', handleTouchDragStart, { passive: false });
    document.addEventListener('touchmove', handleTouchDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Result navigation
    resultPrevBtn.addEventListener('click', () => navigateResultPage(-1));
    resultNextBtn.addEventListener('click', () => navigateResultPage(1));

    // Buttons
    downloadBtn.addEventListener('click', handleDownload);
    resetBtn.addEventListener('click', resetApp);
    errorResetBtn.addEventListener('click', resetApp);
}

// ===================================
// File loading
// ===================================
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) loadFiles(files);
}

async function handleSettingsDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    settingsSection.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (mode === 'image') {
        // Add dropped images to gallery
        const newImages = files.filter(f => isImage(f));
        for (const file of newImages) {
            const dataUrl = await readFileAsDataUrl(file);
            const img = await loadImage(dataUrl);
            imageFiles.push({ file, dataUrl, img });
        }
        renderGallery();
        renderPreview();
        updateCropOverlay();
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) loadFiles(files);
}

function handleMouseMove(e) {
    const rect = dropZone.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    dropZone.style.setProperty('--mouse-x', `${x}%`);
    dropZone.style.setProperty('--mouse-y', `${y}%`);
}

async function loadFiles(files) {
    const firstFile = files[0];

    if (isPDF(firstFile)) {
        mode = 'pdf';
        await loadPDFFile(firstFile);
    } else if (isImage(firstFile)) {
        mode = 'image';
        const imageFilesOnly = files.filter(f => isImage(f));
        await loadImageFiles(imageFilesOnly);
    } else {
        showError('対応していないファイル形式です。PDF・PNG・JPEG・WebP・GIF・BMPに対応しています。');
        return;
    }
}

// ===================================
// PDF Loading
// ===================================
async function loadPDFFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        originalPdfBytes = new Uint8Array(arrayBuffer);
        currentPdfDoc = await pdfjsLib.getDocument({ data: originalPdfBytes.slice() }).promise;
        totalPages = currentPdfDoc.numPages;
        currentPage = 1;
        pdfFileName = file.name;

        // UI
        fileInfoSingle.hidden = false;
        imageGallery.hidden = true;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        pageNav.style.display = '';

        showSection('settings');
        await renderPreview();
        updatePageNavigation();
        updateCropOverlay();
    } catch (error) {
        console.error('PDF loading error:', error);
        showError('PDFの読み込みに失敗しました。ファイルが破損しているか、暗号化されている可能性があります。');
    }
}

// ===================================
// Image Loading
// ===================================
async function loadImageFiles(files) {
    for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);
        imageFiles.push({ file, dataUrl, img });
    }

    activeImageIndex = 0;

    // UI
    fileInfoSingle.hidden = true;
    imageGallery.hidden = false;
    pageNav.style.display = 'none';

    renderGallery();
    showSection('settings');
    await renderPreview();
    updateCropOverlay();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// ===================================
// Image Gallery
// ===================================
function renderGallery() {
    galleryGrid.innerHTML = '';
    imageCount.textContent = `${imageFiles.length}枚`;

    imageFiles.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item' + (index === activeImageIndex ? ' active' : '');
        div.innerHTML = `
            <img src="${item.dataUrl}" alt="${item.file.name}">
            <button class="gallery-item-remove" data-index="${index}">×</button>
            <div class="gallery-item-name">${item.file.name}</div>
        `;
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('gallery-item-remove')) {
                activeImageIndex = index;
                renderGallery();
                renderPreview();
                updateCropOverlay();
            }
        });
        const removeBtn = div.querySelector('.gallery-item-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageFiles.splice(index, 1);
            if (activeImageIndex >= imageFiles.length) activeImageIndex = Math.max(0, imageFiles.length - 1);
            if (imageFiles.length === 0) {
                resetApp();
                return;
            }
            renderGallery();
            renderPreview();
            updateCropOverlay();
        });
        galleryGrid.appendChild(div);
    });
}

async function handleAddImages(e) {
    const files = Array.from(e.target.files).filter(f => isImage(f));
    for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);
        imageFiles.push({ file, dataUrl, img });
    }
    addImageInput.value = '';
    renderGallery();
}

// ===================================
// Direction
// ===================================
function setDirection(dir) {
    cropDirection = dir;
    dirBottom.classList.toggle('active', dir === 'bottom');
    dirTop.classList.toggle('active', dir === 'top');
    updateCropOverlay();
}

// ===================================
// Output Format
// ===================================
function setOutputFormat(fmt) {
    outputFormat = fmt;
    formatSame.classList.toggle('active', fmt === 'same');
    formatPdf.classList.toggle('active', fmt === 'pdf');
    formatPng.classList.toggle('active', fmt === 'png');
}

// ===================================
// Crop Settings
// ===================================
function handleSliderChange(e) {
    cropPercentage = parseInt(e.target.value);
    cropValueDisplay.textContent = `${cropPercentage}%`;
    updateCropOverlay();
}

function updateCropOverlay() {
    if (cropDirection === 'bottom') {
        cropOverlay.classList.remove('crop-top');
        cropOverlay.style.height = `${cropPercentage}%`;
        cropOverlay.style.top = '';
    } else {
        cropOverlay.classList.add('crop-top');
        cropOverlay.style.height = `${cropPercentage}%`;
        cropOverlay.style.bottom = '';
    }
}

// ===================================
// Drag Handle
// ===================================
function handleDragStart(e) {
    e.preventDefault();
    isDragging = true;
    canvasHeight = previewCanvas.offsetHeight;
    dragHandle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
}

function handleTouchDragStart(e) {
    e.preventDefault();
    isDragging = true;
    canvasHeight = previewCanvas.offsetHeight;
    dragHandle.classList.add('dragging');
}

function handleDragMove(e) {
    if (!isDragging || !canvasHeight) return;
    e.preventDefault();
    const rect = previewCanvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    updateCropFromMouse(mouseY);
}

function handleTouchDragMove(e) {
    if (!isDragging || !canvasHeight) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = previewCanvas.getBoundingClientRect();
    const mouseY = touch.clientY - rect.top;
    updateCropFromMouse(mouseY);
}

function updateCropFromMouse(mouseY) {
    let percentage;
    if (cropDirection === 'bottom') {
        const heightFromBottom = canvasHeight - mouseY;
        percentage = (heightFromBottom / canvasHeight) * 100;
    } else {
        percentage = (mouseY / canvasHeight) * 100;
    }
    percentage = Math.max(1, Math.min(50, Math.round(percentage)));

    if (percentage !== cropPercentage) {
        cropPercentage = percentage;
        cropValueDisplay.textContent = `${cropPercentage}%`;
        cropSlider.value = cropPercentage;
        updateCropOverlay();
    }
}

function handleDragEnd(e) {
    if (!isDragging) return;
    if (e) e.preventDefault();
    isDragging = false;
    dragHandle.classList.remove('dragging');
    document.body.style.cursor = '';
}

// ===================================
// Preview Rendering
// ===================================
async function renderPreview() {
    if (mode === 'pdf') {
        await renderPDFPreview(currentPage);
    } else if (mode === 'image') {
        renderImagePreview();
    }
}

async function renderPDFPreview(pageNum) {
    if (!currentPdfDoc) return;
    try {
        const page = await currentPdfDoc.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = previewCanvas;
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
    } catch (error) {
        console.error('Page render error:', error);
    }
}

function renderImagePreview() {
    if (imageFiles.length === 0) return;
    const item = imageFiles[activeImageIndex];
    const canvas = previewCanvas;
    const context = canvas.getContext('2d');

    const maxW = 600;
    const maxH = 400;
    let w = item.img.width;
    let h = item.img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);

    canvas.width = w;
    canvas.height = h;
    context.drawImage(item.img, 0, 0, w, h);
}

// ===================================
// Page Navigation (PDF)
// ===================================
function navigatePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderPreview();
        updatePageNavigation();
    }
}

function updatePageNavigation() {
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// ===================================
// Processing
// ===================================
async function processFiles() {
    resultItems = [];
    showSection('progress');
    progressFileName.textContent = mode === 'pdf' ? pdfFileName : `${imageFiles.length}枚の画像`;
    progressFileSize.textContent = '';
    updateProgress(0, '処理を開始...');

    try {
        if (mode === 'pdf') {
            await processPDF();
        } else {
            await processImages();
        }
    } catch (error) {
        console.error('Processing error:', error);
        showError('ファイルの処理中にエラーが発生しました。');
    }
}

// ===================================
// PDF Processing
// ===================================
async function processPDF() {
    updateProgress(10, 'PDFを解析中...');
    const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes.slice());
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    updateProgress(20, `${pageCount}ページを処理中...`);

    for (let i = 0; i < pageCount; i++) {
        const page = pages[i];
        if (cropDirection === 'bottom') {
            cropPageBottom(page, cropPercentage);
        } else {
            cropPageTop(page, cropPercentage);
        }
        updateProgress(20 + ((i + 1) / pageCount * 50), `ページ ${i + 1}/${pageCount} を処理中...`);
        await sleep(5);
    }

    updateProgress(75, 'PDFを生成中...');
    const savedBytes = await pdfDoc.save();
    processedPdfBytes = new Uint8Array(savedBytes);

    // Choose output based on format
    if (outputFormat === 'png') {
        updateProgress(80, 'PNGに変換中...');
        await convertPdfToPng(processedPdfBytes);
    } else {
        // Output as PDF (same or explicit pdf)
        const baseName = pdfFileName.replace(/\.pdf$/i, '');
        resultItems = [{
            blob: new Blob([processedPdfBytes], { type: 'application/pdf' }),
            name: `${baseName}_cut.pdf`,
            dataUrl: null
        }];
        // Load for preview
        processedPdfDoc = await pdfjsLib.getDocument({ data: processedPdfBytes.slice() }).promise;
    }

    updateProgress(100, '完了！');
    await sleep(300);
    showResult();
}

async function convertPdfToPng(pdfBytes) {
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
    const numPages = pdfDoc.numPages;

    for (let i = 1; i <= numPages; i++) {
        updateProgress(80 + (i / numPages * 18), `PNG変換中... ${i}/${numPages}`);
        const page = await pdfDoc.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await canvasToBlob(canvas, 'image/png');
        const dataUrl = canvas.toDataURL('image/png');
        resultItems.push({
            blob,
            name: `page_${String(i).padStart(3, '0')}.png`,
            dataUrl
        });
        await sleep(5);
    }
}

function cropPageBottom(page, percentage) {
    const { width, height } = page.getSize();
    const cropHeight = height * (percentage / 100);
    const newHeight = height - cropHeight;
    const mediaBox = page.getMediaBox();
    page.setCropBox(mediaBox.x, mediaBox.y + cropHeight, mediaBox.width, newHeight);
    page.setMediaBox(mediaBox.x, mediaBox.y + cropHeight, mediaBox.width, newHeight);
}

function cropPageTop(page, percentage) {
    const { width, height } = page.getSize();
    const cropHeight = height * (percentage / 100);
    const newHeight = height - cropHeight;
    const mediaBox = page.getMediaBox();
    page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, newHeight);
    page.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, newHeight);
}

// ===================================
// Image Processing
// ===================================
async function processImages() {
    const total = imageFiles.length;

    for (let i = 0; i < total; i++) {
        updateProgress((i / total) * 80, `画像 ${i + 1}/${total} を処理中...`);
        const item = imageFiles[i];
        const croppedCanvas = cropImageCanvas(item.img, cropDirection, cropPercentage);

        const mimeType = getImageMimeType(item.file);
        const ext = getExtFromMime(mimeType);
        const baseName = item.file.name.replace(/\.[^.]+$/, '');

        if (outputFormat === 'same') {
            const blob = await canvasToBlob(croppedCanvas, mimeType);
            const dataUrl = croppedCanvas.toDataURL(mimeType);
            resultItems.push({ blob, name: `${baseName}_cut.${ext}`, dataUrl });
        } else if (outputFormat === 'png') {
            const blob = await canvasToBlob(croppedCanvas, 'image/png');
            const dataUrl = croppedCanvas.toDataURL('image/png');
            resultItems.push({ blob, name: `${baseName}_cut.png`, dataUrl });
        } else if (outputFormat === 'pdf') {
            // Collect canvases, create PDF at end
            resultItems.push({ canvas: croppedCanvas, name: baseName });
        }
        await sleep(5);
    }

    if (outputFormat === 'pdf') {
        updateProgress(85, 'PDFを生成中...');
        await createPdfFromCanvases();
    }

    updateProgress(100, '完了！');
    await sleep(300);
    showResult();
}

function cropImageCanvas(img, direction, percentage) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cropPx = Math.round(img.height * (percentage / 100));
    const newHeight = img.height - cropPx;

    canvas.width = img.width;
    canvas.height = newHeight;

    if (direction === 'bottom') {
        ctx.drawImage(img, 0, 0, img.width, newHeight, 0, 0, img.width, newHeight);
    } else {
        ctx.drawImage(img, 0, cropPx, img.width, newHeight, 0, 0, img.width, newHeight);
    }
    return canvas;
}

async function createPdfFromCanvases() {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const canvases = resultItems.map(r => r.canvas);

    for (const canvas of canvases) {
        const pngDataUrl = canvas.toDataURL('image/png');
        const pngBytes = dataUrlToUint8Array(pngDataUrl);
        const pngImage = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
        page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
    }

    const pdfBytes = await pdfDoc.save();
    processedPdfBytes = new Uint8Array(pdfBytes);
    processedPdfDoc = await pdfjsLib.getDocument({ data: processedPdfBytes.slice() }).promise;

    resultItems = [{
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: 'images_cut.pdf',
        dataUrl: null
    }];
}

// ===================================
// Result Display
// ===================================
function showResult() {
    const totalCount = mode === 'pdf' ? totalPages : imageFiles.length;
    resultFileCount.textContent = mode === 'pdf' ? totalCount : `${imageFiles.length}`;
    resultCropPercent.textContent = `${cropPercentage}%`;
    resultCropDirection.textContent = cropDirection === 'bottom' ? '下部削除' : '上部削除';

    resultCurrentPage = 0;
    renderResultPreview();
    updateResultPageNavigation();
    showSection('result');
}

async function renderResultPreview() {
    const canvas = resultCanvas;
    const ctx = canvas.getContext('2d');

    // If we have a processed PDF doc (PDF output)
    if (processedPdfDoc && (outputFormat !== 'png' || mode === 'pdf' && outputFormat === 'same')) {
        // For PDF output, use pdf.js
        if (resultItems.length === 1 && resultItems[0].blob.type === 'application/pdf') {
            const pageNum = resultCurrentPage + 1;
            if (pageNum <= processedPdfDoc.numPages) {
                const page = await processedPdfDoc.getPage(pageNum);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: ctx, viewport }).promise;
            }
            return;
        }
    }

    // For image results
    if (resultItems[resultCurrentPage] && resultItems[resultCurrentPage].dataUrl) {
        const img = await loadImage(resultItems[resultCurrentPage].dataUrl);
        const maxW = 600;
        const maxH = 400;
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
    }
}

function navigateResultPage(direction) {
    const maxPages = getResultPageCount();
    const newPage = resultCurrentPage + direction;
    if (newPage >= 0 && newPage < maxPages) {
        resultCurrentPage = newPage;
        renderResultPreview();
        updateResultPageNavigation();
    }
}

function getResultPageCount() {
    if (processedPdfDoc && resultItems.length === 1 && resultItems[0].blob.type === 'application/pdf') {
        return processedPdfDoc.numPages;
    }
    return resultItems.length;
}

function updateResultPageNavigation() {
    const maxPages = getResultPageCount();
    resultPageIndicator.textContent = `${resultCurrentPage + 1} / ${maxPages}`;
    resultPrevBtn.disabled = resultCurrentPage <= 0;
    resultNextBtn.disabled = resultCurrentPage >= maxPages - 1;
}

// ===================================
// Download
// ===================================
async function handleDownload() {
    if (resultItems.length === 0) return;

    if (resultItems.length === 1) {
        // Single file download
        const item = resultItems[0];
        downloadBlob(item.blob, item.name);
    } else {
        // Multiple files - ZIP
        const zip = new JSZip();
        for (const item of resultItems) {
            zip.file(item.name, item.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'logo_cutter_output.zip');
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===================================
// Utilities
// ===================================
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function canvasToBlob(canvas, mimeType) {
    return new Promise((resolve) => {
        canvas.toBlob(blob => resolve(blob), mimeType, 0.95);
    });
}

function getExtFromMime(mime) {
    const map = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/bmp': 'bmp' };
    return map[mime] || 'png';
}

function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return array;
}

function updateProgress(percent, status) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressStatus.textContent = status;
}

function showSection(section) {
    uploadSection.hidden = section !== 'upload';
    settingsSection.hidden = section !== 'settings';
    progressSection.hidden = section !== 'progress';
    resultSection.hidden = section !== 'result';
    errorSection.hidden = section !== 'error';
}

function showError(message) {
    errorMessage.textContent = message;
    showSection('error');
}

function resetApp() {
    mode = null;
    cropDirection = 'bottom';
    outputFormat = 'same';
    cropPercentage = 15;

    currentPdfDoc = null;
    originalPdfBytes = null;
    processedPdfBytes = null;
    processedPdfDoc = null;
    pdfFileName = '';
    currentPage = 1;
    totalPages = 1;

    imageFiles = [];
    activeImageIndex = 0;
    resultItems = [];
    resultCurrentPage = 0;

    cropSlider.value = 15;
    cropValueDisplay.textContent = '15%';
    fileInput.value = '';
    addImageInput.value = '';
    progressFill.style.width = '0%';

    setDirection('bottom');
    setOutputFormat('same');

    galleryGrid.innerHTML = '';
    cropOverlay.classList.remove('crop-top');

    showSection('upload');
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
