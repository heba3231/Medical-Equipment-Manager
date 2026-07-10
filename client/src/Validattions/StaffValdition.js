// Staff Validation Functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

export const validateName = (name) => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 50) return "Name cannot exceed 50 characters";
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

export const validateDepartment = (department) => {
  if (!department) return "Department is required";
  return null;
};

export const validatePhone = (phone) => {
  if (phone && !/^[\d\s+\-()]{10,15}$/.test(phone)) {
    return "Please enter a valid phone number";
  }
  return null;
};

export const validateStaffForm = (formData) => {
  const errors = {};
  
  errors.name = validateName(formData.name);
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  errors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
  errors.department = validateDepartment(formData.department);
  errors.phone = validatePhone(formData.phone);
  
  // Remove null values
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) delete errors[key];
  });
  
  return errors;
};

export const validateLoginForm = (formData) => {
  const errors = {};
  
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) delete errors[key];
  });
  
  return errors;
};