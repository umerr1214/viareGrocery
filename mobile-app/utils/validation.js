// Validation utilities for form inputs

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true, message: '' };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  return { isValid: true, message: '' };
};

export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  return { isValid: true, message: '' };
};

export const validateProductList = (products) => {
  if (!products || products.length === 0) {
    return { isValid: false, message: 'Please add at least one product' };
  }
  if (products.length > 20) {
    return { isValid: false, message: 'Maximum 20 products allowed' };
  }
  return { isValid: true, message: '' };
};

export const validateImageFile = (file) => {
  if (!file) {
    return { isValid: false, message: 'Please select an image' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'Please select a valid image file (JPEG, PNG, WebP)' };
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size && file.size > maxSize) {
    return { isValid: false, message: 'Image size must be less than 10MB' };
  }
  
  return { isValid: true, message: '' };
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field];
    const value = formData[field];
    
    let validationResult;
    
    switch (rule.type) {
      case 'email':
        validationResult = validateEmail(value);
        break;
      case 'password':
        validationResult = validatePassword(value);
        break;
      case 'confirmPassword':
        validationResult = validateConfirmPassword(formData.password, value);
        break;
      case 'name':
        validationResult = validateName(value);
        break;
      case 'required':
        validationResult = validateRequired(value, rule.fieldName || field);
        break;
      case 'custom':
        validationResult = rule.validator(value, formData);
        break;
      default:
        validationResult = { isValid: true, message: '' };
    }

    if (!validationResult.isValid) {
      errors[field] = validationResult.message;
      isValid = false;
    }
  });

  return { isValid, errors };
}; 