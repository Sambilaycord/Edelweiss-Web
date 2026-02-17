export const VALIDATION_RULES = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100,
    errorMessage: "Please enter a valid email address.",
  },
  password: {
    minLength: 8,
    maxLength: 254,
    regex: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
    errorMessage: "Password must be 8-72 characters and contain no spaces.",
  },
  username: {
    minLength: 3,
    maxLength: 20,
    regex: /^[a-zA-Z0-9_.-]+$/,
    errorMessage: "Username can only contain letters, numbers, underscores, dots, and hyphens.",
  },
  postalCode: {
    regex: /^\d{4}$/, // Strictly 4 digits for PH postal codes
    errorMessage: "Postal code must be exactly 4 digits.",
  }
};

export const sanitizeInput = (val: string): string => {
  return val.replace(/[<>\"\'\\]/g, ''); 
};

export const validateField = (type: keyof typeof VALIDATION_RULES, value: string): string | null => {
  const rule = VALIDATION_RULES[type];
  
  if (!value) return "This field is required.";

  const fieldLabel = type.charAt(0).toUpperCase() + type.slice(1);
  
  if (type === 'username' && !/[a-zA-Z]/.test(value)) {
    return "Username must contain at least one letter.";
  }

  if ('minLength' in rule && value.length < rule.minLength!) {
    return `${fieldLabel} must be at least ${rule.minLength} characters.`;
  }
  
  if ('maxLength' in rule && value.length > rule.maxLength!) {
    return `${fieldLabel} exceeds maximum length of ${rule.maxLength}.`;
  }
  
  if (!rule.regex.test(value)) {
    return rule.errorMessage;
  }
  
  return null; 
};