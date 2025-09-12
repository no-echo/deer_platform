// 分享模态框功能 - 完全安全版本
(function(global) {
    'use strict';
    
    function ShareModal() {
        this.modal = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // 超级安全的初始化
        var self = this;
        this.safeInit();
    }
    
    ShareModal.prototype.safeInit = function() {
        var self = this;
        
        function attemptInit() {
            if (self.initialized || self.retryCount >= self.maxRetries) {
                return;
            }
            
            self.retryCount++;
            
            try {
                if (document.readyState === 'complete') {
                    self.init();
                } else {
                    setTimeout(attemptInit, 200 * self.retryCount);
                }
            } catch (error) {
                console.warn('ShareModal初始化尝试失败:', error);
                if (self.retryCount < self.maxRetries) {
                    setTimeout(attemptInit, 500 * self.retryCount);
                }
            }
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attemptInit);
        } else {
            setTimeout(attemptInit, 100);
        }
    };
    
    ShareModal.prototype.bindEvents = function() {
        var self = this;
        
        // 超级安全的事件绑定
        setTimeout(function() {
            try {
                // 检查document是否存在
                if (!document || typeof document.querySelectorAll !== 'function') {
                    return;
                }
                
                // 检查分享按钮是否存在
                var shareButtons = document.querySelectorAll('.action-btn');
                if (!shareButtons || shareButtons.length === 0) {
                    console.log('未找到分享按钮，跳过事件绑定');
                    return;
                }
                
                for (var i = 0; i < shareButtons.length; i++) {
                    var btn = shareButtons[i];
                    if (btn && btn.textContent && btn.textContent.indexOf('分享') !== -1) {
                        // 安全的事件绑定
                        if (btn && typeof btn.addEventListener === 'function') {
                            btn.addEventListener('click', function() {
                                self.showModal();
                            });
                        }
                        break;
                    }
                }
                
                // 模态框内部事件绑定
                if (self.modal && typeof self.modal.querySelector === 'function') {
                    var closeBtn = self.modal.querySelector('.close-btn');
                    if (closeBtn && typeof closeBtn.addEventListener === 'function') {
                        closeBtn.addEventListener('click', function() {
                            self.hideModal();
                        });
                    }
                    
                    var shareOptions = self.modal.querySelectorAll('.share-btn');
                    if (shareOptions) {
                        for (var j = 0; j < shareOptions.length; j++) {
                            var option = shareOptions[j];
                            if (option && typeof option.addEventListener === 'function') {
                                (function(btn) {
                                    btn.addEventListener('click', function() {
                                        var platform = btn.getAttribute('data-platform');
                                        self.share(platform);
                                    });
                                })(option);
                            }
                        }
                    }
                    
                    // 点击外部关闭
                    if (typeof self.modal.addEventListener === 'function') {
                        self.modal.addEventListener('click', function(e) {
                            if (e.target === self.modal) {
                                self.hideModal();
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('ShareModal事件绑定失败:', error);
            }
        }, 300);
    };
    
    ShareModal.prototype.init = function() {
        if (this.initialized) {
            return;
        }
        
        try {
            this.createModal();
            this.bindEvents();
            this.initialized = true;
        } catch (error) {
            console.error('ShareModal initialization error:', error);
        }
    };
    
    ShareModal.prototype.createModal = function() {
        // 检查是否已存在
        this.modal = document.getElementById('shareModal');
        if (this.modal) {
            return;
        }
        
        var modalHTML = [
            '<div id="shareModal" class="share-modal" style="display: none;">',
            '  <div class="share-modal-content">',
            '    <div class="share-modal-header">',
            '      <h3>分享到</h3>',
            '      <span class="close-btn">&times;</span>',
            '    </div>',
            '    <div class="share-options">',
            '      <button class="share-btn" data-platform="wechat">',
            '        <span>📱</span>',
            '        <span>微信</span>',
            '      </button>',
            '      <button class="share-btn" data-platform="weibo">',
            '        <span>🐦</span>',
            '        <span>微博</span>',
            '      </button>',
            '      <button class="share-btn" data-platform="qq">',
            '        <span>🐧</span>',
            '        <span>QQ</span>',
            '      </button>',
            '      <button class="share-btn" data-platform="copy">',
            '        <span>📋</span>',
            '        <span>复制链接</span>',
            '      </button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('shareModal');
    };
    
    ShareModal.prototype.showModal = function() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    };
    
    ShareModal.prototype.hideModal = function() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    };
    
    ShareModal.prototype.share = function(platform) {
        var url = global.location.href;
        var title = document.title;
        
        try {
            switch (platform) {
                case 'wechat':
                    this.copyToClipboard(url);
                    alert('链接已复制，请在微信中粘贴分享');
                    break;
                case 'weibo':
                    global.open('https://service.weibo.com/share/share.php?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title));
                    break;
                case 'qq':
                    global.open('https://connect.qq.com/widget/shareqq/index.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title));
                    break;
                case 'copy':
                    this.copyToClipboard(url);
                    alert('链接已复制到剪贴板');
                    break;
            }
            
            this.hideModal();
        } catch (error) {
            console.error('Share error:', error);
        }
    };
    
    ShareModal.prototype.copyToClipboard = function(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
            } else {
                // 兼容旧浏览器
                var textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error('Copy to clipboard error:', error);
        }
    };
    
    // 全局初始化
    var shareModalInstance = null;
    
    function initShareModal() {
        try {
            if (!shareModalInstance && typeof ShareModal === 'function') {
                shareModalInstance = new ShareModal();
            }
        } catch (error) {
            console.warn('ShareModal初始化失败:', error);
        }
    }
    
    // 超级安全的页面加载初始化
    if (typeof document !== 'undefined' && document && document.readyState) {
        if (document.readyState === 'loading') {
            if (typeof document.addEventListener === 'function') {
                document.addEventListener('DOMContentLoaded', initShareModal);
            } else {
                setTimeout(initShareModal, 500);
            }
        } else {
            setTimeout(initShareModal, 100);
        }
    } else {
        setTimeout(function() {
            if (typeof document !== 'undefined' && document) {
                initShareModal();
            }
        }, 1000);
    }
    
    // 导出到全局作用域
    if (typeof global !== 'undefined') {
        global.ShareModal = ShareModal;
        global.shareModal = shareModalInstance;
    }
    
})(typeof window !== 'undefined' ? window : this);