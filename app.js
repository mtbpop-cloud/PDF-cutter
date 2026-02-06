/**
 * PDF下部カッター - PDFの各ページ下部を自動削除
 * pdf-libで処理、pdf.jsでプレビュー表示
 */

// DOM Elements - Upload
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');

// DOM Elements - Settings
const settingsSection = document.getElementById('settingsSection');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const changeFileBtn = document.getElementById('changeFileBtn');
const cropSlider = document.getElementById('cropSlider');
const cropValueDisplay = document.getElementById('cropValueDisplay');
const previewCanvas = document.getElementById('previewCanvas');
const cropOverlay = document.getElementById('cropOverlay');
const dragHandle = document.getElementById('dragHandle');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');
const processBtn = document.getElementById('processBtn');

// DOM Elements - Progress
const progressSection = document.getElementById('progressSection');
const progressFileName = document.getElementById('progressFileName');
const progressFileSize = document.getElementById('progressFileSize');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');

// DOM Elements - Result
const resultSection = document.getElementById('resultSection');
const pageCount = document.getElementById('pageCount');
const cropPercent = document.getElementById('cropPercent');
const resultCanvas = document.getElementById('resultCanvas');
const resultPrevBtn = document.getElementById('resultPrevBtn');
const resultNextBtn = document.getElementById('resultNextBtn');
const resultPageIndicator = document.getElementById('resultPageIndicator');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// DOM Elements - Error
const errorSection = document.getElementById('errorSection');
const errorResetBtn = document.getElementById('errorResetBtn');
const errorMessage = document.getElementById('errorMessage');

// State
let currentFile = null;
let currentPdfDoc = null;  // pdf.js document for preview
let originalPdfBytes = null;
let processedPdfBytes = null;
let processedPdfDoc = null; // pdf.js document for result preview
let originalFileName = '';
let currentPage = 1;
let totalPages = 1;
let resultCurrentPage = 1;
let cropPercentage = 15;

// Drag state
let isDragging = false;
let canvasHeight = 0;

/**
 * Initialize event listeners
 */
function init() {
    // Drag and drop events
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Mouse tracking for hover effect
    dropZone.addEventListener('mousemove', handleMouseMove);

    // Settings events
    changeFileBtn.addEventListener('click', resetApp);
    cropSlider.addEventListener('input', handleSliderChange);
    prevPageBtn.addEventListener('click', () => navigatePage(-1));
    nextPageBtn.addEventListener('click', () => navigatePage(1));
    processBtn.addEventListener('click', processFile);

    // Drag handle events
    dragHandle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Result navigation
    resultPrevBtn.addEventListener('click', () => navigateResultPage(-1));
    resultNextBtn.addEventListener('click', () => navigateResultPage(1));

    // Button events
    downloadBtn.addEventListener('click', handleDownload);
    resetBtn.addEventListener('click', resetApp);
    errorResetBtn.addEventListener('click', resetApp);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadFile(files[0]);
    }
}

/**
 * Handle file select from input
 */
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        loadFile(files[0]);
    }
}

/**
 * Handle mouse move for hover effect
 */
function handleMouseMove(e) {
    const rect = dropZone.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    dropZone.style.setProperty('--mouse-x', `${x}%`);
    dropZone.style.setProperty('--mouse-y', `${y}%`);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Load PDF file and show settings
 */
async function loadFile(file) {
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showError('PDFファイルを選択してください。');
        return;
    }

    currentFile = file;
    originalFileName = file.name.replace(/\.pdf$/i, '') + '_cropped.pdf';

    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        // Store as Uint8Array to prevent detachment issues
        originalPdfBytes = new Uint8Array(arrayBuffer);

        // Load with pdf.js for preview - pass a COPY to avoid buffer detachment
        currentPdfDoc = await pdfjsLib.getDocument({ data: originalPdfBytes.slice() }).promise;
        totalPages = currentPdfDoc.numPages;
        currentPage = 1;

        // Update UI
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        // Show settings section
        showSection('settings');

        // Render first page preview
        await renderPreviewPage(currentPage);
        updatePageNavigation();
        updateCropOverlay();

    } catch (error) {
        console.error('PDF loading error:', error);
        showError('PDFの読み込みに失敗しました。ファイルが破損しているか、暗号化されている可能性があります。');
    }
}

/**
 * Handle slider change
 */
function handleSliderChange(e) {
    cropPercentage = parseInt(e.target.value);
    cropValueDisplay.textContent = `${cropPercentage}%`;
    updateCropOverlay();
}

/**
 * Update the crop overlay height
 */
function updateCropOverlay() {
    cropOverlay.style.height = `${cropPercentage}%`;
}

/**
 * Handle drag start on the crop overlay handle
 */
function handleDragStart(e) {
    e.preventDefault();
    isDragging = true;
    canvasHeight = previewCanvas.offsetHeight;
    dragHandle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
}

/**
 * Handle drag move
 */
function handleDragMove(e) {
    if (!isDragging || !canvasHeight) return;

    e.preventDefault();

    // Get the mouse position relative to the canvas
    const rect = previewCanvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Calculate the height from the bottom
    const heightFromBottom = canvasHeight - mouseY;

    // Calculate percentage (clamped between 1% and 50%)
    let percentage = (heightFromBottom / canvasHeight) * 100;
    percentage = Math.max(1, Math.min(50, Math.round(percentage)));

    // Update crop percentage
    if (percentage !== cropPercentage) {
        cropPercentage = percentage;
        cropValueDisplay.textContent = `${cropPercentage}%`;
        cropSlider.value = cropPercentage;
        updateCropOverlay();
    }
}

/**
 * Handle drag end
 */
function handleDragEnd(e) {
    if (!isDragging) return;

    e.preventDefault();
    isDragging = false;
    dragHandle.classList.remove('dragging');
    document.body.style.cursor = '';
}

/**
 * Navigate preview pages
 */
function navigatePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderPreviewPage(currentPage);
        updatePageNavigation();
    }
}

/**
 * Update page navigation UI
 */
function updatePageNavigation() {
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

/**
 * Render a page to preview canvas
 */
async function renderPreviewPage(pageNum) {
    if (!currentPdfDoc) return;

    try {
        const page = await currentPdfDoc.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = previewCanvas;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

    } catch (error) {
        console.error('Page render error:', error);
    }
}

/**
 * Process the PDF file
 */
async function processFile() {
    if (!originalPdfBytes) return;

    // Show progress section
    showSection('progress');
    progressFileName.textContent = currentFile.name;
    progressFileSize.textContent = formatFileSize(currentFile.size);
    updateProgress(0, 'ファイルを読み込み中...');

    try {
        updateProgress(20, 'PDFを解析中...');

        // Load PDF with pdf-lib - use a copy of the bytes
        const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes.slice());
        const pages = pdfDoc.getPages();
        const processedPageCount = pages.length;

        updateProgress(30, `${processedPageCount}ページを処理中...`);

        // Process each page
        for (let i = 0; i < processedPageCount; i++) {
            const page = pages[i];
            cropPageBottom(page, cropPercentage);

            const progress = 30 + ((i + 1) / processedPageCount * 60);
            updateProgress(progress, `ページ ${i + 1}/${processedPageCount} を処理中...`);

            await new Promise(resolve => setTimeout(resolve, 10));
        }

        updateProgress(95, 'PDFを生成中...');

        // Save the modified PDF as Uint8Array
        const savedBytes = await pdfDoc.save();
        processedPdfBytes = new Uint8Array(savedBytes);

        updateProgress(100, '完了！');

        // Load processed PDF for preview - pass a COPY to avoid buffer detachment
        processedPdfDoc = await pdfjsLib.getDocument({ data: processedPdfBytes.slice() }).promise;
        resultCurrentPage = 1;

        // Show result
        setTimeout(async () => {
            pageCount.textContent = processedPageCount;
            cropPercent.textContent = `${cropPercentage}%`;

            await renderResultPage(1);
            updateResultPageNavigation();

            showSection('result');
        }, 300);

    } catch (error) {
        console.error('PDF processing error:', error);
        showError('PDFの処理中にエラーが発生しました。ファイルが破損しているか、暗号化されている可能性があります。');
    }
}

/**
 * Crop the bottom portion of a PDF page
 */
function cropPageBottom(page, percentage) {
    const { width, height } = page.getSize();
    const cropHeight = height * (percentage / 100);
    const newHeight = height - cropHeight;
    const mediaBox = page.getMediaBox();

    page.setCropBox(
        mediaBox.x,
        mediaBox.y + cropHeight,
        mediaBox.width,
        newHeight
    );

    page.setMediaBox(
        mediaBox.x,
        mediaBox.y + cropHeight,
        mediaBox.width,
        newHeight
    );
}

/**
 * Navigate result preview pages
 */
function navigateResultPage(direction) {
    const newPage = resultCurrentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        resultCurrentPage = newPage;
        renderResultPage(resultCurrentPage);
        updateResultPageNavigation();
    }
}

/**
 * Update result page navigation UI
 */
function updateResultPageNavigation() {
    resultPageIndicator.textContent = `${resultCurrentPage} / ${totalPages}`;
    resultPrevBtn.disabled = resultCurrentPage <= 1;
    resultNextBtn.disabled = resultCurrentPage >= totalPages;
}

/**
 * Render a page to result canvas
 */
async function renderResultPage(pageNum) {
    if (!processedPdfDoc) return;

    try {
        const page = await processedPdfDoc.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = resultCanvas;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

    } catch (error) {
        console.error('Result page render error:', error);
    }
}

/**
 * Update progress display
 */
function updateProgress(percent, status) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressStatus.textContent = status;
}

/**
 * Show a specific section
 */
function showSection(section) {
    uploadSection.hidden = section !== 'upload';
    settingsSection.hidden = section !== 'settings';
    progressSection.hidden = section !== 'progress';
    resultSection.hidden = section !== 'result';
    errorSection.hidden = section !== 'error';
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    showSection('error');
}

/**
 * Handle download button click
 */
function handleDownload() {
    if (!processedPdfBytes) return;

    const blob = new Blob([processedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Reset the application to initial state
 */
function resetApp() {
    currentFile = null;
    currentPdfDoc = null;
    originalPdfBytes = null;
    processedPdfBytes = null;
    processedPdfDoc = null;
    originalFileName = '';
    currentPage = 1;
    totalPages = 1;
    resultCurrentPage = 1;
    cropPercentage = 15;

    cropSlider.value = 15;
    cropValueDisplay.textContent = '15%';
    fileInput.value = '';
    progressFill.style.width = '0%';

    showSection('upload');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
