// 字符计数功能
function updateCharCount(inputId, countId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    
    input.addEventListener('input', function() {
        const length = this.value.length;
        counter.textContent = length;
        
        const parent = counter.parentElement;
        parent.classList.remove('warning', 'error');
        
        if (length > maxLength * 0.8) {
            parent.classList.add('warning');
        }
        if (length >= maxLength) {
            parent.classList.add('error');
        }
    });
}

// 标签管理
const tags = [];

function initializeTagManagement() {
    const tagInput = document.getElementById('tagInput');
    const tagInputField = document.getElementById('tagInputField');
    
    tagInputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(this.value.trim());
            this.value = '';
        }
    });
}

// 安全的标签添加方式
function addTag() {
    const tagInputField = document.getElementById('tagInputField');
    const tagInput = document.getElementById('tagInput');
    const tagText = tagInputField.value.trim();
    
    if (tagText && !tags.includes(tagText)) {
        tags.push(tagText);
        
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        
        // 安全的文本设置
        const tagTextNode = document.createTextNode(tagText);
        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeTag(tagText, tagElement);
        
        tagElement.appendChild(tagTextNode);
        tagElement.appendChild(removeBtn);
        
        tagInput.insertBefore(tagElement, tagInputField);
    }
}

function removeTag(tagText, element) {
    const index = tags.indexOf(tagText);
    if (index > -1) {
        tags.splice(index, 1);
        element.remove();
    }
}

// 图片上传管理
const uploadedImages = [];

function initializeImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const coverSelect = document.getElementById('cover');
    
    imageUpload.addEventListener('click', () => imageInput.click());
    
    imageUpload.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    imageUpload.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    imageUpload.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    imageInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
}

// 修改图片处理函数，添加验证
function handleFiles(files) {
    Array.from(files).forEach(file => {
        // 验证图片文件
        const validation = dataProcessor.validateImageFile(file);
        if (!validation.isValid) {
            errorHandler.showError(`文件 ${file.name}: ${validation.errors.join(', ')}`);
            return;
        }
        
        if (uploadedImages.length >= 9) {
            errorHandler.showWarning('最多只能上传9张图片');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            addImagePreview(e.target.result, file.name, file);
        };
        reader.readAsDataURL(file);
    });
}

function addImagePreview(src, name, file) {
    const imagePreview = document.getElementById('imagePreview');
    const coverSelect = document.getElementById('cover');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    const safeName = dataProcessor.escapeHtml(name);
    previewItem.innerHTML = `
        <img src="${src}" alt="${safeName}">
        <button type="button" class="preview-remove" onclick="removeImage(this.parentElement, '${safeName}')">
            ×
        </button>
    `;
    
    imagePreview.appendChild(previewItem);
    uploadedImages.push({ src, name: safeName, file });
    
    // 更新封面选择
    const option = document.createElement('option');
    option.value = safeName;
    option.textContent = safeName;
    coverSelect.appendChild(option);
    
    errorHandler.showInfo(`图片 ${safeName} 添加成功`);
}

function removeImage(element, name) {
    const coverSelect = document.getElementById('cover');
    
    element.remove();
    const index = uploadedImages.findIndex(img => img.name === name);
    if (index > -1) {
        uploadedImages.splice(index, 1);
    }
    
    // 从封面选择中移除
    const option = coverSelect.querySelector(`option[value="${name}"]`);
    if (option) {
        option.remove();
    }
}

// 编辑器工具栏
function initializeEditor() {
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const textarea = document.getElementById('content');
            
            switch(action) {
                case 'bold':
                    insertText(textarea, '**', '**');
                    break;
                case 'italic':
                    insertText(textarea, '*', '*');
                    break;
                case 'underline':
                    insertText(textarea, '<u>', '</u>');
                    break;
                case 'link':
                    const url = prompt('请输入链接地址:');
                    if (url) {
                        insertText(textarea, '[链接文字](', url + ')');
                    }
                    break;
                case 'list':
                    insertText(textarea, '\n- ', '');
                    break;
            }
        });
    });
}

function insertText(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;
    
    textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
}

// 表单提交处理
function initializeFormSubmit() {
    document.getElementById('postForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = {
            title: document.getElementById('title').value.trim(),
            categoryId: document.getElementById('category').value,
            content: document.getElementById('content').value.trim(),
            tags: tags.join(','),
            allowComment: document.getElementById('allowComment').checked
        };
        
        // 数据清理和验证
        const sanitizedData = dataProcessor.sanitizeInput(formData);
        const validation = dataProcessor.validatePostData(sanitizedData);
        
        if (!validation.isValid) {
            formValidator.showFormErrors('postForm', validation.errors);
            errorHandler.showError('请修正表单中的错误');
            return;
        }
        
        // 验证图片文件
        for (const image of uploadedImages) {
            if (image.file) {
                const imageValidation = dataProcessor.validateImageFile(image.file);
                if (!imageValidation.isValid) {
                    errorHandler.showError(`图片 ${image.name}: ${imageValidation.errors.join(', ')}`);
                    return;
                }
            }
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.textContent = '发布中...';
        submitBtn.disabled = true;
        
        try {
            errorHandler.showLoading('正在发布帖子...');
            
            // 先上传图片
            const imageUrls = [];
            for (const image of uploadedImages) {
                if (image.file) {
                    try {
                        const uploadResponse = await fileAPI.uploadPostImage(image.file);
                        const processedResponse = dataProcessor.processApiResponse(uploadResponse);
                        
                        if (processedResponse.success) {
                            imageUrls.push(processedResponse.data.url);
                        } else {
                            throw new Error(processedResponse.message || '图片上传失败');
                        }
                    } catch (uploadError) {
                        throw new Error(`图片 ${image.name} 上传失败: ${uploadError.message}`);
                    }
                }
            }
            
            // 准备帖子数据
            const postData = {
                title: sanitizedData.title,
                content: sanitizedData.content,
                categoryId: parseInt(sanitizedData.categoryId),
                tags: sanitizedData.tags,
                images: imageUrls,
                coverImage: document.getElementById('cover').value || (imageUrls.length > 0 ? imageUrls[0] : null),
                allowComment: sanitizedData.allowComment
            };
            
            // 创建帖子
            const createResponse = await postAPI.create(postData);
            const processedResult = dataProcessor.processApiResponse(createResponse);
            
            if (!processedResult.success) {
                throw new Error(processedResult.message || '帖子创建失败');
            }
            
            // 清除草稿和表单错误
            localStorage.removeItem('postDraft');
            formValidator.clearFormErrors('postForm');
            
            errorHandler.hideLoading();
            errorHandler.showSuccess('帖子发布成功！');
            
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                window.location.href = `post-detail.html?id=${processedResult.data.id}`;
            }, 1500);
            
        } catch (error) {
            console.error('发布失败:', error);
            errorHandler.hideLoading();
            errorHandler.handleApiError(error);
        } finally {
            submitBtn.textContent = '发布帖子';
            submitBtn.disabled = false;
        }
    });
}

// 加载分类列表
async function loadCategories() {
    try {
        errorHandler.showLoading('正在加载分类...');
        
        const categoriesResponse = await categoryAPI.getAll();
        const processedResponse = dataProcessor.processApiResponse(categoriesResponse);
        
        if (!processedResponse.success) {
            throw new Error(processedResponse.message || '加载分类失败');
        }
        
        const categories = processedResponse.data;
        const categorySelect = document.getElementById('category');
        
        // 清空现有选项（保留默认选项）
        categorySelect.innerHTML = '<option value="">请选择分类</option>';
        
        // 添加分类选项
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = dataProcessor.escapeHtml(category.name);
            categorySelect.appendChild(option);
        });
        
        errorHandler.hideLoading();
        
    } catch (error) {
        console.error('加载分类失败:', error);
        errorHandler.hideLoading();
        errorHandler.showError('加载分类失败，请刷新页面重试');
    }
}

// 草稿功能
function saveDraft() {
    const draftData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        content: document.getElementById('content').value,
        cover: document.getElementById('cover').value,
        allowComment: document.getElementById('allowComment').checked,
        tags: tags
    };
    
    localStorage.setItem('postDraft', JSON.stringify(draftData));
    errorHandler.showSuccess('草稿已保存');
}

// 预览功能
function preview() {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    
    if (!title || !content) {
        errorHandler.showWarning('请先填写标题和内容');
        return;
    }
    
    // 这里可以实现预览功能，比如打开新窗口显示预览
    errorHandler.showInfo('预览功能开发中...');
}

// 恢复草稿
function restoreDraft() {
    const draft = localStorage.getItem('postDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            if (confirm('检测到未完成的草稿，是否恢复？')) {
                // 使用数据处理器清理草稿数据
                const sanitizedDraft = dataProcessor.sanitizeInput(data);
                
                document.getElementById('title').value = sanitizedDraft.title || '';
                document.getElementById('category').value = sanitizedDraft.category || '';
                document.getElementById('content').value = sanitizedDraft.content || '';
                document.getElementById('cover').value = sanitizedDraft.cover || '';
                document.getElementById('allowComment').checked = sanitizedDraft.allowComment !== false;
                
                // 恢复标签
                if (data.tags && Array.isArray(data.tags)) {
                    const tagInput = document.getElementById('tagInput');
                    const tagInputField = document.getElementById('tagInputField');
                    
                    data.tags.forEach(tag => {
                        const sanitizedTag = dataProcessor.escapeHtml(tag);
                        tags.push(sanitizedTag);
                        const tagElement = document.createElement('div');
                        tagElement.className = 'tag';
                        const tagTextNode = document.createTextNode(sanitizedTag);
                        const removeBtn = document.createElement('span');
                        removeBtn.className = 'tag-remove';
                        removeBtn.textContent = '×';
                        removeBtn.onclick = () => removeTag(sanitizedTag, tagElement);
                        tagElement.appendChild(tagTextNode);
                        tagElement.appendChild(removeBtn);
                        tagInput.insertBefore(tagElement, tagInputField);
                    });
                }
                
                errorHandler.showInfo('草稿已恢复');
            }
        } catch (error) {
            console.error('恢复草稿失败:', error);
            localStorage.removeItem('postDraft');
            errorHandler.showWarning('草稿数据损坏，已清除');
        }
    }
}

// 页面初始化
function initializePage() {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
        errorHandler.showError('请先登录');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // 初始化各个功能模块
    updateCharCount('title', 'titleCount', 50);
    updateCharCount('content', 'contentCount', 5000);
    initializeTagManagement();
    initializeImageUpload();
    initializeEditor();
    initializeFormSubmit();
    
    // 加载分类列表
    loadCategories();
    
    // 加载草稿
    restoreDraft();
    
    // 绑定表单验证
    formValidator.bindFormValidation('postForm', {
        title: {
            required: true,
            minLength: 5,
            maxLength: 100
        },
        categoryId: {
            required: true
        },
        content: {
            required: true,
            minLength: 10,
            maxLength: 10000
        }
    });
}

// 页面加载完成后初始化
window.addEventListener('load', initializePage);