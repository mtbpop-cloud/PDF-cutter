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
const pasteZone = document.getElementById('pasteZone');
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
const promptCopyBtn = document.getElementById('promptCopyBtn');
const geminiPromptCopyBtn = document.getElementById('geminiPromptCopyBtn');
const geminiIconPromptCopyBtn = document.getElementById('geminiIconPromptCopyBtn');
const geminiInstaPromptCopyBtn = document.getElementById('geminiInstaPromptCopyBtn');
const rotateLeftBtn = document.getElementById('rotateLeftBtn');
const rotateRightBtn = document.getElementById('rotateRightBtn');
const pdfDeleteGroup = document.getElementById('pdfDeleteGroup');
const deletePageInput = document.getElementById('deletePageInput');
const deleteSpecificPageBtn = document.getElementById('deleteSpecificPageBtn');
const deleteCurrentPageBtn = document.getElementById('deleteCurrentPageBtn');
const toastNotification = document.getElementById('toastNotification');

const NOTEBOOK_LM_PROMPT = `system_instructions:
  objective: "提供された情報に基づき、視覚的に分かりやすいスライド資料を生成する"
  layout_and_design_constraints:
    margin_settings:
      bottom_margin: "スライド全体の高さの下部5%を完全に無地の白い余白（セーフエリア）として確保する"
      purpose: "右下に出力されるNotebookLMのウォーターマーク（ロゴ）とスライドのコンテンツが重なるのを防ぐため"
    content_area:
      usage: "下部5%の余白を除いた、上部の残り95%の領域内にすべてのコンテンツ（テキスト、図形、画像、装飾など）を収める"
      layout_balance: "95%の領域内で、テキストの視認性や要素の配置バランスが崩れないように、余白や文字サイズを自動調整して美しいレイアウトを構築する"
    strict_rules:
      - "下部5%の白い余白エリアには、背景色以外のいかなる要素も配置してはならない"
      - "スライドの縦横比（アスペクト比）は変更せず、指定された比率を維持したまま要素の配置のみを調整する"`;

const GEMINI_PROMPT = `レイアウトは以下の指示に従ってください。
# Nanobanana Pro用 レイアウト指定プロンプト
system_instructions:
  # 全体目標
  objective: "提供された情報（または前述または後述されたコンテンツ指示）に基づき、高画質でバランスの取れた画像を生成する。"
  # アスペクト比の指定（16:9を優先、またはそれに近い比率）
  aspect_ratio: "16:9（またはそれに近い比率。例：16:10）"
  # レイアウトとデザインの厳格な制約
  layout_constraints:
    # 余白の設定
    margins:
      bottom: "画像全体の高さの下部11%を完全に無地の白い余白（セーフエリア）として確保する。"
      purpose: "右下に自動的に付与される可視ウォーターマーク（ロゴ）とコンテンツが重なるのを防ぐため。"
    # コンテンツエリアの設定
    content_area:
      bounds: "下部11%の余白を除いた、上部の残り89%の領域内に、すべての主要コンテンツ（主題、背景、装飾、テキストなど）を収める。"
      balance: "89%の領域内で、テキストの視認性や要素の配置バランスが崩れないように、構図、余白、文字サイズ（テキストが存在する場合）を自動調整し、美しいレイアウトを構築する。"
  # 厳格な追加ルール
  strict_rules:
    - "下部11%の白い余白エリアには、背景色以外のいかなる要素（画像の一部、装飾、テキスト、テクスチャなど）も配置してはならない。"
    - "画像全体のアスペクト比を維持したまま、要素の配置とサイズのみを調整する。"`;

const GEMINI_ICON_PROMPT = `レイアウトや出力する画像は以下の指示に従ってください。

# Nanobanana Pro用 レイアウトとロゴ回避のための厳格な制約プロンプト（ピクセル情報なし）

system_instructions:
  objective: "提供された情報に基づき、高画質でバランスの取れた画像を生成する。特定のレイアウト比率を遵守し、将来のシステムウォーターマークの被りを回避する。"

  # 出力画像の比率設定
  ratios:
    aspect_ratio: "1:1（完全な正方形、またはそれに近い比率）"

  # レイアウトとデザインの厳格な制約
  layout_constraints:
    # 余白とセーフエリアの設定
    safe_area:
      bottom_margin: "画像全体の高さの最下部8%を、完全に無地の白い空隙（セーフエリア）として確保する。"
      purpose: "右下に自動的に配置されるシステムウォーターマーク（ロゴ）とコンテンツが重なるのを防ぐため。"

    # コンテンツエリアの設定
    content_area:
      bounds: "最下部8%の余白を除いた、上部の残り91%の領域内に、すべての主要コンテンツ（主題、背景、装飾、テキストなど）を収める。※残り1%は余白とコンテンツの分離のための緩衝材として使用可能だが、厳密には91%にコンテンツを収める指示として解釈する。"
      internal_format:
        description: "この上部91%の高さの領域内で、生成されるコンテンツ自体が「完全な正方形」の構図になるようにレイアウトする。"
        composition: "コンテンツ（scene, subject, details）は、この領域内で正方形のフォーマットを満たすように構成され、美しいレイアウトを構築する。"

  # 厳格な追加ルール
  strict_rules:
    - "最下部8%の白いセーフエリアには、背景色以外のいかなる要素（画像の一部、装飾、テキスト、テクスチャなど）も配置してはならない。"
    - "上部91%の領域内のコンテンツは、視覚的に完全な正方形として認識されるように構図を調整する。"
    - "生成される画像自体には、ピクセル数、解像度、または注釈テキストや矢印といった情報を一切含めてはならない。"
    - "出力画像のピクセル解像度は、このプロンプトでは指定せず、システム側の最適な高解像度設定に従う。"`;

const GEMINI_INSTA_PROMPT = `# Nanobanana Pro用 新・厳格化：下部12%余白＆上部88%フル充填レイアウト

system_instructions:
  objective: "高画質でバランスの取れた画像を生成する。指定されたアスペクト比を維持し、下部12%の背景延長（セーフエリア）を正確に守りつつ、上部88%の領域には余白なく重要なコンテンツを完全に充填する。"
  
  dimensions:
    aspect_ratio: "1080:1534 (約 1:1.42)" 
    target_resolution: "幅1080ピクセル × 高さ1534ピクセル相当の比率"

  layout_constraints:
    safe_area:
      bounds: "画像全体の高さの【最下部から正確に12%】のみを、背景延長エリア（セーフエリア）とする。12%を超えてセーフエリアを広げることを厳禁とする。"
      content_rule: "この領域には、背景の自然な延長線上の要素のみを描画する。重要な被写体、テキスト、ロゴは厳禁。また、意図しない余白やフェードアウトを絶対に作らないこと。"
      purpose: "システムウォーターマーク回避用。12%を超えて広げると上部コンテンツが窮屈になるため厳守。"
    
    content_area:
      bounds: "画像全体の高さの【上部から正確に88%】の領域（1080×1350ピクセルの比率）をコンテンツエリアとする。"
      fill_rule: "この上部88%の領域内は、主題、背景、各種要素で【隙間なく完全に充填】すること。下部12%の背景延長エリアとの境界線（88%のライン）まで確実に画像を描画し、意図しない余白を絶対に作らないこと。"
      composition: "上部88%の領域内で、4:5の構図として最も美しく引き立つようにレイアウトする。"

  strict_rules:
    - "上部の画像エリア（88%）と下部の背景延長エリア（12%）の境界線は水平で、くっきりと明確に分かれていること。"
    - "すべての重要な被写体、テキスト、ロゴ、および視覚的要素は、上部88%のコンテンツエリア（1080x1350）内に完全に収めること。"
    - "生成される画像自体には、ピクセル数、寸法、解像度、注釈テキスト、矢印などの解説情報を『一切含めてはならない』。"`;

function init() {
    // Prevent browser from opening files in new tab on drag/drop anywhere
    document.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    document.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isActive = item.classList.contains('active');
            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            // Open clicked if it was closed
            if (!isActive) {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
            // Update all aria-expanded
            document.querySelectorAll('.faq-question').forEach(b => {
                b.setAttribute('aria-expanded', b.closest('.faq-item').classList.contains('active'));
            });
        });
    });

    // Rotation
    if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => rotateCurrentFiles(-90));
    if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => rotateCurrentFiles(90));

    // PDF Page Deletion
    if (deleteSpecificPageBtn) {
        deleteSpecificPageBtn.addEventListener('click', () => {
            const pageNum = parseInt(deletePageInput.value);
            if (!pageNum || isNaN(pageNum)) {
                alert('削除するページ番号を入力してください。');
                return;
            }
            deletePdfPage(pageNum);
        });
    }
    if (deleteCurrentPageBtn) {
        deleteCurrentPageBtn.addEventListener('click', () => {
            if (confirm(`現在プレビューで表示しているページ (${currentPage}ページ目) を削除しますか？`)) {
                deletePdfPage(currentPage);
            }
        });
    }

    // Prompt copy buttons
    promptCopyBtn.addEventListener('click', () => copyToClipboard(NOTEBOOK_LM_PROMPT));
    geminiPromptCopyBtn.addEventListener('click', () => copyToClipboard(GEMINI_PROMPT));
    geminiIconPromptCopyBtn.addEventListener('click', () => copyToClipboard(GEMINI_ICON_PROMPT));
    geminiInstaPromptCopyBtn.addEventListener('click', () => copyToClipboard(GEMINI_INSTA_PROMPT));
    // Paste zone
    pasteZone.addEventListener('click', () => pasteZone.focus());
    pasteZone.addEventListener('paste', handlePaste);
    // Also listen for paste on document when paste zone is focused or we are in image gallery mode
    document.addEventListener('paste', (e) => {
        if (
            document.activeElement === pasteZone ||
            (mode === 'image' && !settingsSection.hidden) ||
            (!settingsSection.hidden === false)
        ) {
            handlePaste(e);
        }
    });

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
// Paste Handler
// ===================================
async function handlePaste(e) {
    e.preventDefault();
    e.stopPropagation();

    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const pastedFiles = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
                // Create a proper File from the blob with a name
                const ext = item.type.split('/')[1] || 'png';
                const fileName = `pasted_image_${Date.now()}_${i}.${ext}`;
                const file = new File([blob], fileName, { type: item.type });
                pastedFiles.push(file);
            }
        }
    }

    if (pastedFiles.length > 0) {
        // Visual feedback if pasting on main screen
        if (!settingsSection.hidden === false) {
            pasteZone.classList.add('paste-active');
            setTimeout(() => pasteZone.classList.remove('paste-active'), 500);
            loadFiles(pastedFiles);
        }
        // If we are already in image mode and adding more
        else if (mode === 'image' && !settingsSection.hidden) {
            for (const file of pastedFiles) {
                const dataUrl = await readFileAsDataUrl(file);
                const img = await loadImage(dataUrl);
                imageFiles.push({ file, dataUrl, img });
            }
            renderGallery();
            renderPreview();
            processBtn.disabled = true;
        }
    }
}

// ===================================
// Rotation
// ===================================
async function rotateCurrentFiles(degreesDelta) {
    if (!mode) return;

    // Show temporary feedback
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    try {
        if (mode === 'pdf' && currentPdfDoc) {
            const pages = currentPdfDoc.getPages();
            pages.forEach(p => {
                const r = p.getRotation().angle || 0;
                p.setRotation(PDFLib.degrees(r + degreesDelta));
            });
            const savedBytes = await currentPdfDoc.save();
            originalPdfBytes = new Uint8Array(savedBytes);
            await renderPreview();
        } else if (mode === 'image' && imageFiles.length > 0) {
            for (const item of imageFiles) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const is90 = Math.abs(degreesDelta) === 90 || Math.abs(degreesDelta) === 270;
                
                canvas.width = is90 ? item.img.height : item.img.width;
                canvas.height = is90 ? item.img.width : item.img.height;
                
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(degreesDelta * Math.PI / 180);
                ctx.drawImage(item.img, -item.img.width / 2, -item.img.height / 2);
                
                item.dataUrl = canvas.toDataURL(item.file.type || 'image/png');
                item.img = await loadImage(item.dataUrl);
            }
            renderGallery();
            renderPreview();
        }
    } catch (err) {
        console.error('Rotation error:', err);
    } finally {
        document.body.style.cursor = originalCursor;
    }
}

// ===================================
// PDF Page Deletion
// ===================================
async function deletePdfPage(pageNum) {
    if (mode !== 'pdf' || !currentPdfDoc) return;
    
    if (pageNum < 1 || pageNum > totalPages) {
        alert(`ページ番号は1から${totalPages}の間で指定してください。`);
        return;
    }

    if (totalPages <= 1) {
        alert('最後の1ページは削除できません。');
        return;
    }

    // Show temporary feedback
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    try {
        // PDFLib uses 0-indexed page numbers for deletion
        const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes.slice());
        pdfDoc.removePage(pageNum - 1);
        
        const savedBytes = await pdfDoc.save();
        originalPdfBytes = new Uint8Array(savedBytes);
        
        // Reload pdfjs document
        currentPdfDoc = await pdfjsLib.getDocument({ data: originalPdfBytes.slice() }).promise;
        totalPages = currentPdfDoc.numPages;
        
        // Adjust current page if necessary
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        // Update UI
        deletePageInput.value = '';
        updatePageNavigation();
        await renderPreview();
        
        // Notify user
        alert(`${pageNum}ページ目を削除しました。`);
        
    } catch (err) {
        console.error('Page deletion error:', err);
        alert('ページの削除中にエラーが発生しました。');
    } finally {
        document.body.style.cursor = originalCursor;
    }
}

// ===================================
// Prompt Copy
// ===================================
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast();
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast();
    }
}

function showToast() {
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 2000);
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
    try {
        const firstFile = files[0];

        if (isPDF(firstFile)) {
            mode = 'pdf';
            await loadPDFFile(firstFile);
        } else if (isImage(firstFile)) {
            mode = 'image';
            const imageFilesOnly = files.filter(f => isImage(f));
            if (imageFilesOnly.length === 0) {
                showError('有効な画像ファイルが見つかりませんでした。');
                return;
            }
            await loadImageFiles(imageFilesOnly);
        } else {
            showError('対応していないファイル形式です。PDF・PNG・JPEG・WebP・GIF・BMPに対応しています。');
            return;
        }
    } catch (error) {
        console.error('File loading error:', error);
        showError('ファイルの読み込み中にエラーが発生しました。有効なファイルであることを確認してください。');
        resetApp();
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
        if (pdfDeleteGroup) pdfDeleteGroup.style.display = 'flex';

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
    if (pdfDeleteGroup) pdfDeleteGroup.style.display = 'none';

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

function applyCropToPage(page, visualDirection, percentage) {
    let rotation = (page.getRotation().angle || 0) % 360;
    if (rotation < 0) rotation += 360;

    let actualDirection;
    if (visualDirection === 'bottom') {
        if (rotation === 0) actualDirection = 'bottom';
        else if (rotation === 90) actualDirection = 'right';
        else if (rotation === 180) actualDirection = 'top';
        else if (rotation === 270) actualDirection = 'left';
    } else { // top
        if (rotation === 0) actualDirection = 'top';
        else if (rotation === 90) actualDirection = 'left';
        else if (rotation === 180) actualDirection = 'bottom';
        else if (rotation === 270) actualDirection = 'right';
    }

    const mediaBox = page.getMediaBox();
    let newX = mediaBox.x;
    let newY = mediaBox.y;
    let newW = mediaBox.width;
    let newH = mediaBox.height;

    if (actualDirection === 'bottom') {
        const crop = mediaBox.height * (percentage / 100);
        newY = mediaBox.y + crop;
        newH = mediaBox.height - crop;
    } else if (actualDirection === 'top') {
        const crop = mediaBox.height * (percentage / 100);
        newH = mediaBox.height - crop;
    } else if (actualDirection === 'left') {
        const crop = mediaBox.width * (percentage / 100);
        newX = mediaBox.x + crop;
        newW = mediaBox.width - crop;
    } else if (actualDirection === 'right') {
        const crop = mediaBox.width * (percentage / 100);
        newW = mediaBox.width - crop;
    }

    page.setCropBox(newX, newY, newW, newH);
    page.setMediaBox(newX, newY, newW, newH);
}

function cropPageBottom(page, percentage) {
    applyCropToPage(page, 'bottom', percentage);
}

function cropPageTop(page, percentage) {
    applyCropToPage(page, 'top', percentage);
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
