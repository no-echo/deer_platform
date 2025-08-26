// 表单验证工具 - 修复版本
(function(global) {
    'use strict';
    
    // 表单验证类
    function FormValidator() {
        this.rules = {
            required: function(value) {
                return value && value.trim() !== '';
            },
            email: function(value) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            minLength: function(value, length) {
                return value && value.length >= length;
            },
            maxLength: function(value, length) {
                return !value || value.length <= length;
            },
            password: function(value) {
                return value && value.length >= 6 && /^(?=.*[a-zA-Z])(?=.*\d)/.test(value);
            },
            username: function(value) {
                return value && /^[a-zA-Z0-9_]{3,20}$/.test(value);
            },
            phone: function(value) {
                return !value || /^1[3-9]\d{9}$/.test(value);
            }
        };
        
        this.messages = {
            required: '此字段为必填项',
            email: '请输入有效的邮箱地址',
            minLength: '长度不能少于{0}个字符',
            maxLength: '长度不能超过{0}个字符',
            password: '密码至少6位，且包含字母和数字',
            username: '用户名只能包含字母、数字和下划线，长度3-20位',
            phone: '请输入有效的手机号码'
        };
    }
    
    // 验证单个字段
    FormValidator.prototype.validateField = function(value, rules) {
        var errors = [];
        var self = this;
        
        if (!rules || !Array.isArray(rules)) {
            return errors;
        }
        
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            
            if (typeof rule === 'string') {
                if (self.rules[rule] && !self.rules[rule](value)) {
                    errors.push(self.messages[rule]);
                }
            } else if (typeof rule === 'object' && rule !== null) {
                var type = rule.type;
                var param = rule.param;
                var message = rule.message;
                
                if (self.rules[type] && !self.rules[type](value, param)) {
                    errors.push(message || self.messages[type].replace('{0}', param));
                }
            } else if (typeof rule === 'function') {
                var result = rule(value);
                if (result !== true) {
                    errors.push(result || '验证失败');
                }
            }
        }
        
        return errors;
    };
    
    // 验证表单数据
    FormValidator.prototype.validateForm = function(formData, schema) {
        var errors = {};
        var hasErrors = false;
        
        if (!formData || !schema) {
            return { isValid: false, errors: { general: ['表单数据或验证规则无效'] } };
        }
        
        for (var field in schema) {
            if (schema.hasOwnProperty(field)) {
                var fieldErrors = this.validateField(formData[field], schema[field]);
                if (fieldErrors.length > 0) {
                    errors[field] = fieldErrors;
                    hasErrors = true;
                }
            }
        }
        
        return { isValid: !hasErrors, errors: errors };
    };
    
    // 绑定表单验证 - 核心修复方法
    FormValidator.prototype.bindForm = function(formElement, schema) {
        var self = this;
        
        // 严格的参数检查
        if (!formElement) {
            console.error('FormValidator.bindForm: formElement is required');
            return false;
        }
        
        if (!schema) {
            console.error('FormValidator.bindForm: schema is required');
            return false;
        }
        
        // 检查是否为有效的DOM元素
        if (!formElement.nodeType || formElement.nodeType !== 1) {
            console.error('FormValidator.bindForm: formElement must be a valid DOM element');
            return false;
        }
        
        // 检查是否有querySelectorAll方法
        if (typeof formElement.querySelectorAll !== 'function') {
            console.error('FormValidator.bindForm: formElement does not support querySelectorAll');
            return false;
        }
        
        try {
            var inputs = formElement.querySelectorAll('input, textarea, select');
            
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                var fieldName = input.name || input.id;
                
                if (!fieldName || !schema[fieldName]) {
                    continue;
                }
                
                // 创建错误提示元素
                var errorElement = input.parentNode.querySelector('.field-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'field-error';
                    errorElement.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 4px; display: none;';
                    input.parentNode.appendChild(errorElement);
                }
                
                // 绑定验证事件
                (function(inputElement, fieldName, errorElement) {
                    var validateInput = function() {
                        var errors = self.validateField(inputElement.value, schema[fieldName]);
                        
                        if (errors.length > 0) {
                            inputElement.style.borderColor = '#dc3545';
                            errorElement.textContent = errors[0];
                            errorElement.style.display = 'block';
                        } else {
                            inputElement.style.borderColor = '#28a745';
                            errorElement.style.display = 'none';
                        }
                    };
                    
                    inputElement.addEventListener('blur', validateInput);
                    inputElement.addEventListener('input', function() {
                        clearTimeout(inputElement.validationTimeout);
                        inputElement.validationTimeout = setTimeout(validateInput, 500);
                    });
                })(input, fieldName, errorElement);
            }
            
            return true;
        } catch (error) {
            console.error('FormValidator.bindForm error:', error);
            return false;
        }
    };
    
    // 显示表单错误
    FormValidator.prototype.showFormErrors = function(errors) {
        if (global.errorHandler && typeof global.errorHandler.handleValidationError === 'function') {
            global.errorHandler.handleValidationError(errors);
        } else {
            console.error('表单验证错误:', errors);
        }
    };
    
    // 清除表单错误样式
    FormValidator.prototype.clearFormErrors = function(formElement) {
        if (!formElement || typeof formElement.querySelectorAll !== 'function') {
            return;
        }
        
        try {
            var inputs = formElement.querySelectorAll('input, textarea, select');
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                input.style.borderColor = '';
                var errorElement = input.parentNode.querySelector('.field-error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('clearFormErrors error:', error);
        }
    };
    
    // 创建全局实例
    var formValidator = new FormValidator();
    
    // 导出到全局作用域
    global.formValidator = formValidator;
    global.FormValidator = FormValidator;
    
    // 支持AMD/CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = formValidator;
    }
    
})(typeof window !== 'undefined' ? window : this);